import { contextBridge, ipcRenderer } from 'electron';
import type { SnipperAPI } from '../shared/types';

const api: SnipperAPI = {
  capture: {
    start: (mode, type, delay) => ipcRenderer.invoke('capture:start', mode, type, delay),
    getAll: () => ipcRenderer.invoke('capture:getAll'),
    delete: (id) => ipcRenderer.invoke('capture:delete', id),
    copyToClipboard: (id) => ipcRenderer.invoke('capture:copyToClipboard', id),
    saveAs: (id) => ipcRenderer.invoke('capture:saveAs', id),
    openInExplorer: (id) => ipcRenderer.invoke('capture:openInExplorer', id),
    getImageDataUrl: (id) => ipcRenderer.invoke('capture:getImageDataUrl', id),
  },
  recording: {
    getSourceId: () => ipcRenderer.invoke('recording:getSourceId'),
    save: (buffer, width, height) => ipcRenderer.invoke('recording:save', buffer, width, height),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
  onCaptureComplete: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, capture: unknown) => {
      callback(capture as any);
    };
    ipcRenderer.on('capture:complete', handler);
    return () => ipcRenderer.removeListener('capture:complete', handler);
  },
};

contextBridge.exposeInMainWorld('snipper', api);
