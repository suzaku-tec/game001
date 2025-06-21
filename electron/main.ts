import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import path from 'path'

const isDev = !app.isPackaged

ipcMain.on("log-to-main", (event: Electron.IpcMainEvent, message) => {
  console.log(`[Renderer][${event.type}]`, message);
});

const createWindow = () => {
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 800,
    height: 640,
    useContentSize: true,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "./preload.js"),
    },
  })

  win.setMenuBarVisibility(false);

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)
