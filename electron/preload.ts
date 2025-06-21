import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  logToMain: (message: string) => ipcRenderer.send("log-to-main", message)
});
