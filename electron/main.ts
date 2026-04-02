import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 950,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    title: 'Chronos Task Tracker',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  ipcMain.handle('fetch-calendar', async (_event, url: string) => {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid URL scheme: Must be HTTP or HTTPS');
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
      throw error;
    }
  });
  ipcMain.handle('read-store', async (_event, key: string) => {
    try {
      const dataPath = path.join(app.getPath('userData'), `${key}.json`);
      const fileData = await fs.readFile(dataPath, 'utf-8');
      return fileData;
    } catch (error: any) {
      // If the file doesn't exist yet, just return null so Zustand falls back to default state
      if (error.code === 'ENOENT') {
        return null;
      }
      console.error(`Failed to read store ${key}:`, error);
      throw error;
    }
  });

  ipcMain.handle('write-store', async (_event, key: string, value: string) => {
    try {
      const dataPath = path.join(app.getPath('userData'), `${key}.json`);
      await fs.writeFile(dataPath, value, 'utf-8');
    } catch (error) {
      console.error(`Failed to write store ${key}:`, error);
      throw error;
    }
  });
  
  createWindow();
})
