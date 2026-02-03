import { ipcMain } from "electron";
import { torrentEngine } from "../torrent/index.js";


export function setupTorrentIPC(mainWindow, sendUpdate) {
  
  
  torrentEngine.on("metadata", () => sendUpdate());
  torrentEngine.on("torrentAdded", () => sendUpdate());
  torrentEngine.on("torrentRemoved", () => sendUpdate());
  torrentEngine.on("torrentPaused", () => sendUpdate());
  torrentEngine.on("torrentResumed", () => sendUpdate());
  torrentEngine.on("complete", () => sendUpdate());
  
  torrentEngine.on("error", (e) => {
    console.error("Engine sent error:", e);
    sendUpdate();
  });

  ipcMain.handle("torrent:inspect", async (e, magnetOrPath) => {
    try {
      const data = await torrentEngine.inspectTorrent(magnetOrPath);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("torrent:start", async (e, config) => {
    try {
      const result = await torrentEngine.startDownload(config.magnetURI, config);
      sendUpdate();
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("torrent:pause", (e, id) => {
    torrentEngine.pauseTorrent(id);
    sendUpdate();
    return { success: true };
  });

  ipcMain.handle("torrent:resume", (e, id) => {
    torrentEngine.resumeTorrent(id);
    sendUpdate();
    return { success: true };
  });

  ipcMain.handle("torrent:remove", (e, { id, deleteFiles }) => {
    torrentEngine.removeTorrent(id, deleteFiles);
    sendUpdate();
    return { success: true };
  });

  ipcMain.handle("torrent:set-sequential", (e, { id, enabled }) => {
    torrentEngine.setSequential(id, enabled);
    return { success: true };
  });

  ipcMain.handle("torrent:create", async (e, filePath) => {
    return { success: false, error: "Not implemented yet" };
  });

  ipcMain.handle("torrent:get-trackers", (e, id) => {
    const t = torrentEngine.client.get(id);
    if (!t) return [];
    return t.announce;
  });

  ipcMain.handle("torrent:add-tracker", (e, { id, url }) => {
    const t = torrentEngine.client.get(id);
    if (t) t.addPeer(url);
    return { success: true };
  });
}