import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db';
import { registerIpcHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ── Window State Persistence ──

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const stateFilePath = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState(): WindowState {
  try {
    const data = fs.readFileSync(stateFilePath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return { width: 1200, height: 800, isMaximized: false };
  }
}

function saveWindowState(): void {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const state: WindowState = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: mainWindow.isMaximized(),
  };
  try {
    fs.writeFileSync(stateFilePath(), JSON.stringify(state));
  } catch {
    // Silently ignore write errors
  }
}

// ── Tray Icon ──

function createTrayIcon(): Electron.NativeImage {
  // Generate a 16x16 RGBA bitmap with an "S"-like shape
  const size = 16;
  const channels = 4;
  const buf = Buffer.alloc(size * size * channels, 0);

  const setPixel = (x: number, y: number, r: number, g: number, b: number, a: number) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const offset = (y * size + x) * channels;
    buf[offset] = r;
    buf[offset + 1] = g;
    buf[offset + 2] = b;
    buf[offset + 3] = a;
  };

  // Draw a simple "S" shape in white on transparent background
  // Top horizontal bar (rows 3-4, cols 5-11)
  for (let x = 5; x <= 11; x++) { setPixel(x, 3, 255, 255, 255, 255); setPixel(x, 4, 255, 255, 255, 255); }
  // Left vertical upper (rows 5-7, cols 4-5)
  for (let y = 5; y <= 7; y++) { setPixel(4, y, 255, 255, 255, 255); setPixel(5, y, 255, 255, 255, 255); }
  // Middle horizontal bar (rows 7-8, cols 5-11)
  for (let x = 5; x <= 11; x++) { setPixel(x, 7, 255, 255, 255, 255); setPixel(x, 8, 255, 255, 255, 255); }
  // Right vertical lower (rows 8-11, cols 10-11)
  for (let y = 8; y <= 11; y++) { setPixel(10, y, 255, 255, 255, 255); setPixel(11, y, 255, 255, 255, 255); }
  // Bottom horizontal bar (rows 11-12, cols 4-11)
  for (let x = 4; x <= 11; x++) { setPixel(x, 11, 255, 255, 255, 255); setPixel(x, 12, 255, 255, 255, 255); }

  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

function setupTray(): void {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('Snipper');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Snipper',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ── Window Creation ──

function createWindow(): void {
  const saved = loadWindowState();

  mainWindow = new BrowserWindow({
    width: saved.width,
    height: saved.height,
    ...(saved.x !== undefined && saved.y !== undefined ? { x: saved.x, y: saved.y } : {}),
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0d0d0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (saved.isMaximized) {
    mainWindow.maximize();
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  // Save state on resize/move
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Global Hotkey ──

function registerGlobalHotkey(): void {
  try {
    const registered = globalShortcut.register('CommandOrControl+Shift+S', () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    if (!registered) {
      console.warn('Global shortcut Ctrl+Shift+S could not be registered — may be claimed by another app.');
    }
  } catch (err) {
    console.warn('Failed to register global shortcut:', err);
  }
}

// ── App Lifecycle ──

app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();
  setupTray();
  registerGlobalHotkey();

  // Window control handlers
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    isQuitting = true;
    app.quit();
  }
});
