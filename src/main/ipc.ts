import { ipcMain, BrowserWindow, desktopCapturer, screen } from 'electron';
import { getDatabase } from './db';
import {
  takeFullScreenshot,
  saveCapture,
  saveRecordingBuffer,
  showSelectionOverlay,
  getImageDataUrl,
  copyImageToClipboard,
  saveAsDialog,
  openInExplorer,
  deleteCaptureFile,
} from './capture';
import type { Capture, CaptureMode, CaptureType, DelayOption } from '../shared/types';

export function registerIpcHandlers(): void {
  const db = getDatabase();

  // ── Start a capture (screenshot or recording trigger) ──
  ipcMain.handle(
    'capture:start',
    async (_event, mode: CaptureMode, type: CaptureType, delay: DelayOption): Promise<Capture | null> => {
      const mainWindow = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
      if (!mainWindow) return null;

      // Hide main window before capturing
      mainWindow.hide();

      // Wait for window to fully hide + any user-specified delay
      await new Promise((r) => setTimeout(r, 300 + delay * 1000));

      if (type === 'screenshot') {
        const screenshot = await takeFullScreenshot();

        if (mode === 'fullscreen') {
          const capture = saveCapture(screenshot, 'fullscreen');
          mainWindow.show();
          mainWindow.focus();
          return capture;
        }

        if (mode === 'rectangle') {
          return showSelectionOverlay(screenshot, mainWindow);
        }

        if (mode === 'window') {
          // For window mode, capture full screen (simplified)
          const capture = saveCapture(screenshot, 'window');
          mainWindow.show();
          mainWindow.focus();
          return capture;
        }

        // Freeform falls back to rectangle for now
        return showSelectionOverlay(screenshot, mainWindow);
      }

      // For recordings — main window stays hidden, renderer handles recording
      mainWindow.show();
      mainWindow.focus();
      return null;
    },
  );

  // ── Get all captures ──
  ipcMain.handle('capture:getAll', (): Capture[] => {
    return db.prepare('SELECT * FROM captures ORDER BY created_at DESC').all() as Capture[];
  });

  // ── Delete a capture ──
  ipcMain.handle('capture:delete', (_event, id: number): void => {
    const capture = db.prepare('SELECT * FROM captures WHERE id = ?').get(id) as Capture | undefined;
    if (capture) {
      deleteCaptureFile(capture.file_path);
      db.prepare('DELETE FROM captures WHERE id = ?').run(id);
    }
  });

  // ── Copy image to clipboard ──
  ipcMain.handle('capture:copyToClipboard', (_event, id: number): void => {
    const capture = db.prepare('SELECT * FROM captures WHERE id = ?').get(id) as Capture | undefined;
    if (capture) copyImageToClipboard(capture.file_path);
  });

  // ── Save As dialog ──
  ipcMain.handle('capture:saveAs', async (_event, id: number): Promise<string | null> => {
    const capture = db.prepare('SELECT * FROM captures WHERE id = ?').get(id) as Capture | undefined;
    if (!capture) return null;
    return saveAsDialog(capture.file_path);
  });

  // ── Open in file explorer ──
  ipcMain.handle('capture:openInExplorer', (_event, id: number): void => {
    const capture = db.prepare('SELECT * FROM captures WHERE id = ?').get(id) as Capture | undefined;
    if (capture) openInExplorer(capture.file_path);
  });

  // ── Get image as data URL ──
  ipcMain.handle('capture:getImageDataUrl', (_event, id: number): string => {
    const capture = db.prepare('SELECT * FROM captures WHERE id = ?').get(id) as Capture | undefined;
    if (!capture) return '';
    return getImageDataUrl(capture.file_path);
  });

  // ── Recording: get screen source ID ──
  ipcMain.handle('recording:getSourceId', async (): Promise<string> => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    if (!sources.length) throw new Error('No screen source found');
    return sources[0].id;
  });

  // ── Recording: save recorded buffer ──
  ipcMain.handle(
    'recording:save',
    (_event, buffer: ArrayBuffer, width: number, height: number): Capture => {
      return saveRecordingBuffer(Buffer.from(buffer), width, height);
    },
  );
}
