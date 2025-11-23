import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMainWindow } from './window.js';
import { setupIPC } from './ipc.js';
import { torrentEngine } from './torrent/index.js';

import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;

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
autoUpdater.on('error', (error) => sendUpdateStatusToWindow({ status: 'error', error }));

ipcMain.on('updater:quit-and-install', () => {
  autoUpdater.quitAndInstall();
});



const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
  ipcMain.handle('dev:test-updater', async () => {
    console.log('[DEV] |--> Запуск симуляции обновления...');
    sendUpdateStatusToWindow({ status: 'available', info: { version: '99.9.9-dev' }});
    await new Promise(r => setTimeout(r, 2000));
    const interval = setInterval(() => {
      const percent = (parseFloat(interval.initialPercent) || 0) + 25;
      sendUpdateStatusToWindow({ status: 'downloading', progress: { percent }});
      interval.initialPercent = percent;
      if (percent >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          sendUpdateStatusToWindow({ status: 'downloaded', info: { version: '99.9.9-dev' }});
          console.log('[DEV] |--> Симуляция завершена.');
        }, 1000);
      }
    }, 800);
    return { success: true };
  });
}



app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.simpletorrent.app');
  }

  mainWindow = createMainWindow();
  setupIPC(mainWindow);
  createTray();

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
  
  mainWindow.webContents.on('did-finish-load', () => {
    const args = initialFileOrUrl ? [initialFileOrUrl] : process.argv;
    handleUrlOrFile(mainWindow, args);
    initialFileOrUrl = null;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      setupIPC(mainWindow);
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });
});



app.on('before-quit', async () => {
  console.log('[Main] App is quitting. Destroying torrent engine...');
  isQuitting = true;
  await torrentEngine.destroy();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
  }
});



const __dirname = path.dirname(fileURLToPath(import.meta.url));

function handleUrlOrFile(win, argv) {
  if (!win || win.isDestroyed() || !Array.isArray(argv)) return;
  const url = argv.find(arg => arg.startsWith('magnet:'));
  if (url) win.webContents.send('magnet:received', url);
  const file = argv.find(arg => arg.endsWith('.torrent'));
  if (file) win.webContents.send('file:open', file);
  if (url || file) {
    if (win.isMinimized()) win.restore();
    if (!win.isVisible()) win.show();
    win.focus();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../../resources/icons/icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  tray.setToolTip('SimpleTorrent');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть SimpleTorrent', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Выход', click: () => {
        isQuitting = true;
        app.quit();
      }}
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow?.show());
}