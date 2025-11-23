const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  
  inspectTorrent: (magnetOrPath) => ipcRenderer.invoke('torrent:inspect', magnetOrPath),
  
  startTorrent: (config) => {
    console.log('[PRELOAD] Starting torrent:', config);
    return ipcRenderer.invoke('torrent:start', config);
  },

  removeTorrent: (id, deleteFiles) => ipcRenderer.invoke('torrent:remove', { id, deleteFiles }),
  pauseTorrent: (id) => ipcRenderer.invoke('torrent:pause', id),
  resumeTorrent: (id) => ipcRenderer.invoke('torrent:resume', id),
  createTorrent: (filePath) => ipcRenderer.invoke('torrent:create', filePath),

  getTrackers: (id) => ipcRenderer.invoke('torrent:get-trackers', id),
  addTracker: (id, url) => ipcRenderer.invoke('torrent:add-tracker', { id, url }),
  setTorrentLimit: (id, type, value) => ipcRenderer.invoke('torrent:limit', { id, type, value }),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (config) => ipcRenderer.invoke('settings:set', config),
  resetApp: () => ipcRenderer.invoke('app:reset'),

  openTorrentFile: (options) => ipcRenderer.invoke('dialog:open-torrent', options),
  selectFolder: (options) => ipcRenderer.invoke('dialog:select-folder', options),

  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  getFilePath: (file) => webUtils.getPathForFile(file),

  notifyUIReady: () => ipcRenderer.send('ui:ready'),

  onUpdate: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('torrent:update', subscription);
    return () => ipcRenderer.removeListener('torrent:update', subscription);
  },

  onMagnet: (callback) => {
    const subscription = (_event, url) => callback(url);
    ipcRenderer.on('magnet:received', subscription);
    return () => ipcRenderer.removeListener('magnet:received', subscription);
  },

    onUpdaterStatus: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('updater:status', subscription);
    return () => ipcRenderer.removeListener('updater:status', subscription);
  },

  updaterQuitAndInstall: () => ipcRenderer.send('updater:quit-and-install'),
 devTestUpdater: () => ipcRenderer.invoke('dev:test-updater'),

  onFileOpen: (callback) => {
    const subscription = (_event, path) => callback(path);
    ipcRenderer.on('file:open', subscription);
    return () => ipcRenderer.removeListener('file:open', subscription);
  },

  showNotification: (title, body) => {
    new Notification(title, { body });
  }
});