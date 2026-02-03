import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import electronUpdater from 'electron-updater';
import { createMainWindow } from './window.js';
import { setupIPC } from './ipc.js';
import { torrentEngine } from './torrent/index.js';
import { notificationManager } from './notifications.js';

const { autoUpdater } = electronUpdater;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow = null;
let tray = null;
let isQuitting = false;
let initialFileOrUrl = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
      handleUrlOrFile(mainWindow, commandLine);
    }
  });
}
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('magnet', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('magnet');
}

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    handleUrlOrFile(mainWindow, [filePath]);
  } else {
    initialFileOrUrl = filePath;
  }
});

const sendUpdateStatusToWindow = (payload) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', payload);
  }
};

autoUpdater.on('update-available', (info) => sendUpdateStatusToWindow({ status: 'available', info }));
autoUpdater.on('update-not-available', (info) => sendUpdateStatusToWindow({ status: 'not-available', info }));
autoUpdater.on('download-progress', (progress) => sendUpdateStatusToWindow({ status: 'downloading', progress }));
autoUpdater.on('update-downloaded', (info) => sendUpdateStatusToWindow({ status: 'downloaded', info }));
autoUpdater.on('error', (error) => sendUpdateStatusToWindow({ status: 'error', error: error.message }));

ipcMain.on('updater:quit-and-install', () => {
  isQuitting = true;
  torrentEngine.destroy().then(() => autoUpdater.quitAndInstall());
});

if (process.env.NODE_ENV === 'development') {
  ipcMain.handle('dev:test-updater', async () => {
    sendUpdateStatusToWindow({ status: 'available', info: { version: '99.9.9-dev' }});
    let percent = 0;
    const interval = setInterval(() => {
      percent += 20;
      sendUpdateStatusToWindow({ status: 'downloading', progress: { percent }});
      if (percent >= 100) {
        clearInterval(interval);
        sendUpdateStatusToWindow({ status: 'downloaded', info: { version: '99.9.9-dev' }});
      }
    }, 500);
  });
}

ipcMain.on('show-context-menu', (event, torrentId) => {
  const torrent = torrentEngine.client.get(torrentId);
  const isPaused = torrentEngine.pausedTorrents.has(torrentId);

  const template = [
    {
      label: isPaused ? 'Возобновить' : 'Пауза',
      click: () => {
        if (isPaused) torrentEngine.resumeTorrent(torrentId);
        else torrentEngine.pauseTorrent(torrentId);
        if(mainWindow) mainWindow.webContents.send("torrent:update", torrentEngine.getSummary());
      }
    },
    { type: 'separator' },
    {
      label: 'Открыть папку',
      enabled: !!torrent && !!torrent.path,
      click: () => {
        if (torrent && torrent.path) {
          shell.openPath(torrent.path);
        }
      }
    },
    {
      label: 'Скопировать Magnet-ссылку',
      click: () => {
        if (torrent && torrent.magnetURI) {
           if(mainWindow) mainWindow.webContents.send('clipboard:write', torrent.magnetURI);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Удалить...',
      role: 'delete',
      click: () => {
        if(mainWindow) mainWindow.webContents.send('context:delete-request', torrentId);
      }
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});


app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.simpletorrent.app');
  }

  mainWindow = createMainWindow();
  setupIPC(mainWindow);
  createTray();
  notificationManager.init(torrentEngine, mainWindow);

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }

  mainWindow.webContents.on('did-finish-load', () => {
    const args = initialFileOrUrl ? [initialFileOrUrl] : process.argv;
    handleUrlOrFile(mainWindow, args);
    initialFileOrUrl = null;
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      setupIPC(mainWindow);
    } else {
      mainWindow.show();
    }
  });
});

app.on('before-quit', async (e) => {
  if (torrentEngine.isDestroyed) return;
  e.preventDefault();
  isQuitting = true;
  await torrentEngine.destroy();
  torrentEngine.isDestroyed = true;
  app.quit();
});

function handleUrlOrFile(win, argv) {
  if (!win || win.isDestroyed() || !Array.isArray(argv)) return;
  
  const args = argv.map(arg => arg.replace(/^"|"$/g, ''));

  const url = args.find(arg => arg.startsWith('magnet:'));
  if (url) win.webContents.send('magnet:received', url);

  const file = args.find(arg => arg.endsWith('.torrent'));
  if (file) win.webContents.send('file:open', file);

  if (url || file) {
    if (win.isMinimized()) win.restore();
    if (!win.isVisible()) win.show();
    win.focus();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../../resources/icons/icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  tray.setToolTip('SimpleTorrent');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть SimpleTorrent', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Выход', click: () => { isQuitting = true; app.quit(); } }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow?.show());
}