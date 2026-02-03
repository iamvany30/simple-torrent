const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  onUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("torrent:update", handler);
    return () => ipcRenderer.removeListener("torrent:update", handler);
  },
  onMagnet: (callback) => {
    const handler = (event, url) => callback(url);
    ipcRenderer.on("magnet:received", handler);
    return () => ipcRenderer.removeListener("magnet:received", handler);
  },
  onFileOpen: (callback) => {
    const handler = (event, path) => callback(path);
    ipcRenderer.on("file:open", handler);
    return () => ipcRenderer.removeListener("file:open", handler);
  },
  onUpdaterStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("updater:status", handler);
    return () => ipcRenderer.removeListener("updater:status", handler);
  },
  notifyUIReady: () => ipcRenderer.send("ui:ready"),
  startTorrent: (config) => ipcRenderer.invoke("torrent:start", config),
  pauseTorrent: (id) => ipcRenderer.invoke("torrent:pause", id),
  resumeTorrent: (id) => ipcRenderer.invoke("torrent:resume", id),
  removeTorrent: (id, deleteFiles) => ipcRenderer.invoke("torrent:remove", { id, deleteFiles }),
  openTorrentFile: (options) => ipcRenderer.invoke("dialog:open-torrent", options),
  selectFolder: (options) => ipcRenderer.invoke("dialog:select-folder", options),
  openFile: (path) => ipcRenderer.invoke("system:open-file", path),
  showInFolder: (path) => ipcRenderer.invoke("system:show-in-folder", path),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (config) => ipcRenderer.invoke("settings:set", config),
  resetApp: () => ipcRenderer.invoke("app:reset"),
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  quitAndInstall: () => ipcRenderer.send("updater:quit-and-install")
});