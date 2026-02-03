import { ipcMain, dialog, app, shell } from "electron";
import { torrentEngine } from "../torrent/index.js";
import fs from "fs";

export function setupSystemIPC(mainWindow, forceUpdate) {
  ipcMain.handle("settings:get", () => torrentEngine.getConfig());
  
  ipcMain.handle("settings:set", (e, config) => {
    torrentEngine.saveConfig(config);
    app.setLoginItemSettings({
      openAtLogin: config.autoLaunch,
      openAsHidden: true
    });
    return { success: true };
  });

  ipcMain.handle("app:reset", () => {
    torrentEngine.hardReset();
    forceUpdate();
    if (mainWindow) mainWindow.setProgressBar(-1);
    return { success: true };
  });

  ipcMain.handle("dialog:select-folder", async (e, options = {}) => {
    const title = options.title || "Select Folder";
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: title,
      properties: ["openDirectory"]
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle("dialog:open-torrent", async (e, options = {}) => {
    const title = options.title || "Select .torrent file";
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: title,
      properties: ["openFile"],
      filters: [{ name: "Torrent Files", extensions: ["torrent"] }]
    });
    return canceled ? null : filePaths[0];
  });

  
  ipcMain.handle("system:open-file", async (e, fullPath) => {
    try {
      if (!fs.existsSync(fullPath)) return { success: false, error: "File not found" };
      const result = await shell.openPath(fullPath);
      if (result) return { success: false, error: result };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("system:show-in-folder", async (e, fullPath) => {
    if (!fullPath) return;
    if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
       await shell.openPath(fullPath);
    } else {
       shell.showItemInFolder(fullPath);
    }
    return { success: true };
  });
}