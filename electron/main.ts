import { app, BrowserWindow } from 'electron'
import path from 'path'

const isDev = !app.isPackaged

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    useContentSize: true,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)
