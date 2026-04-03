import { contextBridge, ipcRenderer } from 'electron';
import type { SnipperAPI } from '../shared/types';

const api: SnipperAPI = {
  snippets: {
    getAll: () => ipcRenderer.invoke('snippets:getAll'),
    create: (input) => ipcRenderer.invoke('snippets:create', input),
    update: (input) => ipcRenderer.invoke('snippets:update', input),
    delete: (id) => ipcRenderer.invoke('snippets:delete', id),
  },
  collections: {
    getAll: () => ipcRenderer.invoke('collections:getAll'),
    create: (input) => ipcRenderer.invoke('collections:create', input),
    delete: (id) => ipcRenderer.invoke('collections:delete', id),
  },
  tags: {
    getAll: () => ipcRenderer.invoke('tags:getAll'),
    create: (input) => ipcRenderer.invoke('tags:create', input),
    delete: (id) => ipcRenderer.invoke('tags:delete', id),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
};

contextBridge.exposeInMainWorld('snipper', api);
