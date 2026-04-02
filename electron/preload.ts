import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  onMainMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, value) => callback(value))
  },
  fetchCalendar: (url: string) => ipcRenderer.invoke('fetch-calendar', url),
  readStore: (key: string) => ipcRenderer.invoke('read-store', key),
  writeStore: (key: string, value: string) => ipcRenderer.invoke('write-store', key, value),
})
