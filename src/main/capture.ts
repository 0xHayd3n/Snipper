import {
  BrowserWindow,
  desktopCapturer,
  screen,
  nativeImage,
  clipboard,
  dialog,
  shell,
} from 'electron';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { getDatabase } from './db';
import type { Capture, CaptureMode } from '../shared/types';

// ── Captures storage directory ──

function capturesDir(): string {
  const dir = path.join(app.getPath('userData'), 'captures');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function generateFilename(ext: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  return `snipper_${ts}.${ext}`;
}

// ── Take a full-screen screenshot ──

export async function takeFullScreenshot(): Promise<Electron.NativeImage> {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.size;
  const factor = display.scaleFactor;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.round(width * factor), height: Math.round(height * factor) },
  });

  if (!sources.length) throw new Error('No screen source found');
  return sources[0].thumbnail;
}

// ── Save a NativeImage to disk & DB ──

export function saveCapture(
  image: Electron.NativeImage,
  mode: CaptureMode,
  type: 'screenshot' | 'recording' = 'screenshot',
): Capture {
  const filename = generateFilename(type === 'recording' ? 'webm' : 'png');
  const filePath = path.join(capturesDir(), filename);
  const buffer = image.toPNG();
  fs.writeFileSync(filePath, buffer);

  const { width, height } = image.getSize();
  const db = getDatabase();
  const stmt = db.prepare(
    'INSERT INTO captures (type, mode, file_path, width, height, file_size) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const result = stmt.run(type, mode, filePath, width, height, buffer.length);
  return db.prepare('SELECT * FROM captures WHERE id = ?').get(result.lastInsertRowid) as Capture;
}

// ── Save raw buffer (for recordings) ──

export function saveRecordingBuffer(
  buffer: Buffer,
  width: number,
  height: number,
): Capture {
  const filename = generateFilename('webm');
  const filePath = path.join(capturesDir(), filename);
  fs.writeFileSync(filePath, buffer);

  const db = getDatabase();
  const stmt = db.prepare(
    'INSERT INTO captures (type, mode, file_path, width, height, file_size) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const result = stmt.run('recording', 'fullscreen', filePath, width, height, buffer.length);
  return db.prepare('SELECT * FROM captures WHERE id = ?').get(result.lastInsertRowid) as Capture;
}

// ── Rectangle selection via overlay window ──

export function showSelectionOverlay(
  screenshot: Electron.NativeImage,
  mainWindow: BrowserWindow,
): Promise<Capture | null> {
  return new Promise((resolve) => {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;
    const dataUrl = screenshot.toDataURL();

    const overlayHtml = `<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; cursor: crosshair; user-select: none; }
body { position: relative; }
#bg { width: 100%; height: 100%; object-fit: cover; display: block; }
#overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); }
#selection {
  position: absolute; border: 2px solid #0078d4;
  background: transparent; display: none;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.3);
}
#dims {
  position: absolute; padding: 2px 8px; background: #0078d4; color: #fff;
  font: 12px 'Segoe UI', sans-serif; border-radius: 3px; display: none; pointer-events: none;
}
</style></head>
<body>
<img id="bg" src="${dataUrl}" />
<div id="overlay"></div>
<div id="selection"></div>
<div id="dims"></div>
<script>
const sel = document.getElementById('selection');
const dims = document.getElementById('dims');
const overlay = document.getElementById('overlay');
let sx = 0, sy = 0, drawing = false;

document.addEventListener('mousedown', (e) => {
  sx = e.clientX; sy = e.clientY; drawing = true;
  sel.style.display = 'block';
  overlay.style.display = 'none';
  dims.style.display = 'block';
});

document.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY);
  const w = Math.abs(e.clientX - sx), h = Math.abs(e.clientY - sy);
  sel.style.left = x + 'px'; sel.style.top = y + 'px';
  sel.style.width = w + 'px'; sel.style.height = h + 'px';
  dims.style.left = (x + w + 4) + 'px'; dims.style.top = (y + h + 4) + 'px';
  dims.textContent = w + ' x ' + h;
});

document.addEventListener('mouseup', (e) => {
  if (!drawing) return;
  drawing = false;
  const x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY);
  const w = Math.abs(e.clientX - sx), h = Math.abs(e.clientY - sy);
  if (w > 5 && h > 5 && window.snipperOverlay) {
    window.snipperOverlay.sendSelection(x, y, w, h);
  } else if (window.snipperOverlay) {
    window.snipperOverlay.cancel();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.snipperOverlay) window.snipperOverlay.cancel();
});
</script>
</body></html>`;

    const tmpFile = path.join(app.getPath('temp'), 'snipper-overlay.html');
    fs.writeFileSync(tmpFile, overlayHtml);

    const overlay = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width,
      height,
      fullscreen: true,
      frame: false,
      transparent: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'overlay-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    overlay.loadFile(tmpFile);

    const { ipcMain } = require('electron');

    const onSelection = (_e: Electron.IpcMainEvent, x: number, y: number, w: number, h: number) => {
      cleanup();
      // Account for display scaling
      const factor = display.scaleFactor;
      const cropped = screenshot.crop({
        x: Math.round(x * factor),
        y: Math.round(y * factor),
        width: Math.round(w * factor),
        height: Math.round(h * factor),
      });
      const capture = saveCapture(cropped, 'rectangle');
      mainWindow.show();
      mainWindow.focus();
      resolve(capture);
    };

    const onCancel = () => {
      cleanup();
      mainWindow.show();
      mainWindow.focus();
      resolve(null);
    };

    function cleanup() {
      ipcMain.removeListener('overlay:selection', onSelection);
      ipcMain.removeListener('overlay:cancel', onCancel);
      if (!overlay.isDestroyed()) overlay.close();
    }

    ipcMain.once('overlay:selection', onSelection);
    ipcMain.once('overlay:cancel', onCancel);

    overlay.on('closed', () => {
      ipcMain.removeListener('overlay:selection', onSelection);
      ipcMain.removeListener('overlay:cancel', onCancel);
    });
  });
}

// ── Get image as data URL ──

export function getImageDataUrl(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.webm') {
    // Return a placeholder for video files
    return `data:video/webm;base64,${buffer.toString('base64')}`;
  }
  const base64 = buffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

// ── Copy image to clipboard ──

export function copyImageToClipboard(filePath: string): void {
  const image = nativeImage.createFromPath(filePath);
  clipboard.writeImage(image);
}

// ── Save As dialog ──

export async function saveAsDialog(filePath: string): Promise<string | null> {
  const ext = path.extname(filePath).toLowerCase();
  const isVideo = ext === '.webm';

  const result = await dialog.showSaveDialog({
    defaultPath: path.basename(filePath),
    filters: isVideo
      ? [{ name: 'Video', extensions: ['webm'] }]
      : [
          { name: 'PNG Image', extensions: ['png'] },
          { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
        ],
  });

  if (result.canceled || !result.filePath) return null;

  if (!isVideo && result.filePath.match(/\.jpe?g$/i)) {
    // Convert to JPEG
    const image = nativeImage.createFromPath(filePath);
    const jpegBuffer = image.toJPEG(90);
    fs.writeFileSync(result.filePath, jpegBuffer);
  } else {
    fs.copyFileSync(filePath, result.filePath);
  }

  return result.filePath;
}

// ── Open in file explorer ──

export function openInExplorer(filePath: string): void {
  shell.showItemInFolder(filePath);
}

// ── Delete capture file ──

export function deleteCaptureFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Silently ignore
  }
}
