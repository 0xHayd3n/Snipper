import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('snipperOverlay', {
  getScreenshot: () => ipcRenderer.invoke('overlay:getScreenshot'),
  sendSelection: (x: number, y: number, w: number, h: number) =>
    ipcRenderer.send('overlay:selection', x, y, w, h),
  cancel: () => ipcRenderer.send('overlay:cancel'),
});
