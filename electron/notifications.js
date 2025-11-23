import { Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { torrentEngine } from './torrent/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICON_PATH = path.join(__dirname, '../../resources/icons/icon.png');

class NotificationManager {
  constructor() {
    this.mainWindow = null;
  }

  init(mainWindow) {
    this.mainWindow = mainWindow;
    this._listenToEvents();
    console.log('[Notifications] Manager initialized.');
  }

  _listenToEvents() {
    torrentEngine.on('complete', (torrent) => {
      const config = torrentEngine.getConfig();
      if (config.showNotificationsOnComplete) {
        this._show({
          title: 'Загрузка завершена',
          body: torrent.name,
        });
      }
    });

    torrentEngine.on('error', (errorMessage) => {
      this._show({
        title: 'Ошибка торрент-движка',
        body: errorMessage,
      });
    });
  }

  _show(options) {
    if (!Notification.isSupported()) {
      console.warn('[Notifications] System notifications not supported.');
      return;
    }

    const notification = new Notification({
      ...options,
      icon: ICON_PATH,
      silent: false,
    });

    notification.on('click', () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        if (!this.mainWindow.isVisible()) this.mainWindow.show();
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    notification.show();
  }
}

export const notificationManager = new NotificationManager();