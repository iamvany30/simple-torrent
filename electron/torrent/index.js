import WebTorrent from 'webtorrent';
import { EventEmitter } from 'events';
import fs from 'fs';
import { PATHS } from './constants.js';
import { store } from './store.js';
import { StreamServer } from './server.js';
import { DataFormatter } from './formatter.js';
import { FolderWatcher } from './watcher.js';
import { RssManager } from './rss.js';

class TorrentEngine extends EventEmitter {
  constructor() {
    super();
    this.client = new WebTorrent({
      maxConns: store.getConfig().maxConns,
      dht: true,
      lsd: true,
      webSeeds: true
    });
    this.server = new StreamServer(this.client);
    this.formatter = new DataFormatter(this.server);
    this.watcher = new FolderWatcher((path) => {
      console.log('[Watcher] Adding torrent:', path);
      this.startDownload(path).catch(e => console.error('[Watcher] Error:', e.message));
    });
    this.rss = new RssManager((url) => {
      console.log('[RSS] Auto-adding torrent from feed:', url);
      this.startDownload(url).catch(e => console.error('[RSS] Download Error:', e.message));
    });
    this.pausedTorrents = new Set();
    this._initHandlers();
    setTimeout(() => this._bootstrap(), 1000);
  }

  async _bootstrap() {
    await this._restoreState();
    this.server.start();
    this._applyConfig();
  }

  _initHandlers() {
    this.client.on('error', (err) => {
      console.error('[Engine] Critical Client Error:', err.message);
      this.emit('error', err.message);
    });
  }

  async startDownload(magnetOrPath, config = {}, saveToState = true) {
    const finalPath = config.path || store.getConfig().downloadPath;
    return new Promise((resolve, reject) => {
      const isMagnet = magnetOrPath.startsWith('magnet:');
      const isUrl = magnetOrPath.startsWith('http://') || magnetOrPath.startsWith('https://');
      const isFile = !isMagnet && !isUrl && fs.existsSync(magnetOrPath);
      if (!isMagnet && !isUrl && !isFile) {
        return reject(new Error(`Source not found or invalid: ${magnetOrPath}`));
      }
      try {
        const torrent = this.client.add(magnetOrPath, { path: finalPath });
        const onReady = () => {
          this._initTorrent(torrent, config);
          if (saveToState) this._persist();
          this.emit('torrentAdded', { id: torrent.infoHash });
          resolve({ id: torrent.infoHash });
        };
        const onError = (err) => err.message.includes('duplicate') ? resolve({ duplicate: true }) : reject(err);
        if (torrent.infoHash) onReady();
        else {
          torrent.once('infoHash', onReady);
          torrent.once('error', onError);
        }
      } catch (err) {
        if (err.message.includes('duplicate')) resolve({ duplicate: true });
        else reject(err);
      }
    });
  }

  removeTorrent(id, deleteFiles = false) {
    this.pausedTorrents.delete(id);
    try {
      this.client.remove(id, { destroyStore: deleteFiles }, (err) => {
        if (!err) {
          this.emit('torrentRemoved', { id });
          this._persist();
        }
      });
    } catch (e) { console.warn(`[Engine] Remove failed:`, e.message); }
  }

  pauseTorrent(id) {
    const t = this.client.get(id);
    if (!t) return;
    this.pausedTorrents.add(id);
    if (t.pieces && t.pieces.length > 0) {
      t.deselect(0, t.pieces.length - 1, false);
    }
    if (t.wires) {
      t.wires.forEach(w => w.destroy());
    }
    this.emit('torrentPaused', { id });
    this._persist();
  }

  resumeTorrent(id) {
    const t = this.client.get(id);
    if (!t || t.progress === 1) return;
    this.pausedTorrents.delete(id);
    t.select(0, t.pieces.length - 1, false);
    t.resume();
    this.emit('torrentResumed', { id });
    this._persist();
  }

  getSummary() {
    return {
      torrents: this.formatter.formatSummary(this.client.torrents, this.pausedTorrents),
      stats: {
        downloaded: this.client.downloaded,
        uploaded: this.client.uploaded,
        downloadSpeed: this.client.downloadSpeed,
        uploadSpeed: this.client.uploadSpeed
      }
    };
  }

  getConfig() { return store.getConfig(); }
  saveConfig(newConfig) { store.saveConfig(newConfig); this._applyConfig(); }
  hardReset() {
    this.client.torrents.forEach(t => this.client.remove(t.infoHash));
    this.pausedTorrents.clear();
    if (fs.existsSync(PATHS.STATE)) fs.unlinkSync(PATHS.STATE);
    this.emit('update');
  }

  async destroy() {
    this._persist();
    this.server.stop();
    this.rss.stop();
    return new Promise(r => this.client.destroy(r));
  }
  
  _initTorrent(torrent, config) {
    const hash = torrent.infoHash;
    torrent.addedDate = config.addedDate || Date.now();
    if (config.completedDate) torrent.completedDate = config.completedDate;
    if (config.paused) this.pausedTorrents.add(hash);
    torrent.on('metadata', () => {
      if (!this.pausedTorrents.has(hash)) {
        torrent.select(0, torrent.pieces.length - 1, false);
      }
      this._persist();
      this.emit('metadata', { id: hash });
    });
    torrent.on('done', () => {
      console.log(`[Engine] ✅ DOWNLOAD COMPLETE: ${torrent.name}. Stopping torrent to prevent seeding.`);
      torrent.completedDate = Date.now();
      this.pauseTorrent(hash);
      this.emit('complete', { id: hash });
    });
    torrent.on('error', (e) => console.warn(`[Engine] Torrent warning ${hash.slice(0,6)}:`, e.message));
    if (torrent.files?.length > 0 && !this.pausedTorrents.has(hash)) {
       torrent.select(0, torrent.pieces.length - 1, false);
    }
  }

  _applyConfig() {
    const cfg = store.getConfig();
    this.watcher.update(cfg);
    this.rss.start(cfg.rssFeeds);
    this.client.throttleDownload(cfg.downloadLimit || -1);
    this.client.throttleUpload(cfg.uploadLimit || -1);
  }

  _persist() {
    const state = this.client.torrents.map(t => ({
      magnetURI: t.magnetURI,
      path: t.path,
      isPaused: this.pausedTorrents.has(t.infoHash),
      addedDate: t.addedDate,
      completedDate: t.completedDate
    }));
    store.saveState(state);
  }

  async _restoreState() {
    const state = store.getState();
    const promises = state.map(item => 
      this.startDownload(item.magnetURI, { ...item }, false)
        .catch(err => console.warn(`[Engine] Restore failed: ${err.message}`))
    );
    await Promise.all(promises);
    this.emit('torrentAdded', { restored: true }); 
  }
}

export const torrentEngine = new TorrentEngine();