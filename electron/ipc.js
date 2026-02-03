import { ipcMain } from "electron";
import { torrentEngine } from "./torrent/index.js";
import { setupTorrentIPC } from "./ipcs/torrent.js";
import { setupSystemIPC } from "./ipcs/system.js";
import { setupWindowIPC } from "./ipcs/window.js";
import { startUpdaterLoop } from "./ipcs/updater.js";

const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }
};

export function setupIPC(mainWindow) {
  const sendUpdateThrottled = throttle(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const summary = torrentEngine.getSummary();
      mainWindow.webContents.send("torrent:update", summary);
    }
  }, 800);

  const forceUpdate = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const summary = torrentEngine.getSummary();
      console.log(`[IPC] Forcing update...`);
      mainWindow.webContents.send("torrent:update", summary);
    }
  };

  ipcMain.on("ui:ready", () => {
    console.log("[IPC] UI reported ready");
    forceUpdate();
  });

  ipcMain.on("magnet:open", (e, magnetLink) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("magnet:received", magnetLink);
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  setupTorrentIPC(mainWindow, sendUpdateThrottled);
  setupSystemIPC(mainWindow, forceUpdate);
  setupWindowIPC(mainWindow);
  startUpdaterLoop(mainWindow);
}