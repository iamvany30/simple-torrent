import WebTorrent from 'webtorrent';
import { EventEmitter } from 'events';
import fs from 'fs';
import { powerSaveBlocker } from 'electron';
import { PATHS } from './constants.js';
import { store } from './store.js';
import { StreamServer } from './server.js';
import { DataFormatter } from './formatter.js';
import { FolderWatcher } from './watcher.js';
import { RssManager } from './rss.js';

class TorrentEngine extends EventEmitter {
  constructor() {
    super();
    const config = store.getConfig();
    
    this.client = new WebTorrent({
      maxConns: config.maxConns || 55, 
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
    this.powerSaveId = null; 
    this.isDestroyed = false;

    this._initHandlers();
    
    setTimeout(() => this._bootstrap(), 1000);
    setInterval(() => this._managePowerSave(), 10000);
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

  _managePowerSave() {
    if (this.isDestroyed) return;
    const isDownloading = this.client.downloadSpeed > 5000; // > 5KB/s
    
    if (isDownloading && this.powerSaveId === null) {
      this.powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
    } else if (!isDownloading && this.powerSaveId !== null) {
      powerSaveBlocker.stop(this.powerSaveId);
      this.powerSaveId = null;
    }
  }

  async startDownload(magnetOrPath, config = {}, saveToState = true) {
    if (this.isDestroyed) return;

    const finalPath = config.path || store.getConfig().downloadPath;
    
    return new Promise((resolve, reject) => {
      const isMagnet = typeof magnetOrPath === 'string' && magnetOrPath.startsWith('magnet:');
      const isUrl = typeof magnetOrPath === 'string' && (magnetOrPath.startsWith('http://') || magnetOrPath.startsWith('https://'));
      const isFile = typeof magnetOrPath === 'string' && !isMagnet && !isUrl && fs.existsSync(magnetOrPath);

      if (!isMagnet && !isUrl && !isFile) {
        return reject(new Error(`Source not found or invalid`));
      }

      try {
        const torrent = this.client.add(magnetOrPath, { path: finalPath });

        const onReady = () => {
          this._initTorrent(torrent, config);
          if (saveToState) {
            this._persist();
            this.emit('torrentAdded', { id: torrent.infoHash });
          }
          resolve({ id: torrent.infoHash });
        };

        const onError = (err) => {
          if (err.message.includes('duplicate')) {
            resolve({ duplicate: true });
          } else {
            reject(err);
          }
        };

        if (torrent.infoHash) {
          onReady();
        } else {
          torrent.once('infoHash', onReady);
          torrent.once('error', onError);
        }
      } catch (err) {
        if (err.message.includes('duplicate')) resolve({ duplicate: true });
        else reject(err);
      }
    });
  }

  async inspectTorrent(magnetOrPath) {
    return new Promise((resolve, reject) => {
      try {
        const timeout = setTimeout(() => reject(new Error('Metadata timeout')), 15000);
        const torrent = this.client.add(magnetOrPath, { path: store.getConfig().downloadPath });
        
        torrent.once('metadata', () => {
          clearTimeout(timeout);
          const files = torrent.files.map((f, i) => ({
            index: i,
            name: f.name,
            length: f.length,
            path: f.path
          }));
          
          this.client.remove(torrent.infoHash, { destroyStore: false });
          resolve({
            name: torrent.name,
            infoHash: torrent.infoHash,
            files: files,
            length: torrent.length
          });
        });
        
        torrent.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });

      } catch (e) {
        reject(e);
      }
    });
  }

  removeTorrent(id, deleteFiles = false) {
    this.pausedTorrents.delete(id);
    const t = this.client.get(id);
    if (!t) return;

    t.destroy({ destroyStore: deleteFiles }, (err) => {
      if (!err) {
        this.emit('torrentRemoved', { id });
        this._persist();
      } else {
        console.error('[Engine] Remove error:', err);
      }
    });
  }

  pauseTorrent(id) {
    const t = this.client.get(id);
    if (!t) return;
    
    this.pausedTorrents.add(id);
    
    if (t.pieces) t.deselect(0, t.pieces.length - 1, false);
    if (t.wires) t.wires.forEach(w => w.destroy());
    
    t.pause(); 
    this.emit('torrentPaused', { id });
    this._persist();
  }

  resumeTorrent(id) {
    const t = this.client.get(id);
    if (!t) return;
    
    this.pausedTorrents.delete(id);
    t.select(0, t.pieces.length - 1, false);
    t.resume();
    this.emit('torrentResumed', { id });
    this._persist();
  }

  setSequential(id, enabled) {
    const t = this.client.get(id);
    if (!t) return;
    
    t.deselect(0, t.pieces.length - 1, false);
    t.select(0, t.pieces.length - 1, false, enabled ? 1 : 0);
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
  saveConfig(newConfig) { 
    store.saveConfig(newConfig); 
    this._applyConfig(); 
  }

  hardReset() {
    this.client.torrents.forEach(t => this.client.remove(t.infoHash));
    this.pausedTorrents.clear();
    if (fs.existsSync(PATHS.STATE)) fs.unlinkSync(PATHS.STATE);
    this.emit('update');
  }

  async destroy() {
    this.isDestroyed = true;
    if (this.powerSaveId !== null) powerSaveBlocker.stop(this.powerSaveId);
    this._persist();
    this.server.stop();
    this.rss.stop();
    
    return new Promise(r => {
      try {
        this.client.destroy(r);
      } catch (e) {
        r();
      }
    });
  }
  
  _initTorrent(torrent, config) {
    const hash = torrent.infoHash;
    
    torrent.addedDate = config.addedDate || Date.now();
    if (config.completedDate) torrent.completedDate = config.completedDate;
    
    if (config.paused) {
      this.pausedTorrents.add(hash);
    }

    torrent.on('metadata', () => {
      if (this.pausedTorrents.has(hash)) {
        torrent.deselect(0, torrent.pieces.length - 1, false);
      }
      this._persist();
      this.emit('metadata', { id: hash });
    });

    torrent.on('done', () => {
      console.log(`[Engine] ✅ DOWNLOAD COMPLETE: ${torrent.name}`);
      torrent.completedDate = Date.now();
      
      const conf = this.getConfig();
      if (conf.stopOnComplete) {
      }
      
      this.emit('complete', { id: hash, name: torrent.name });
      this._persist(); 
    });

    torrent.on('error', (e) => console.warn(`[Engine] Torrent warning ${hash.slice(0,6)}:`, e.message));
  }

  _applyConfig() {
    const cfg = store.getConfig();
    this.watcher.update(cfg);
    this.rss.start(cfg.rssFeeds);
    this.client.throttleDownload(cfg.downloadLimit || -1);
    this.client.throttleUpload(cfg.uploadLimit || -1);
  }

  _persist() {
    if (this.isDestroyed) return;
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
      this.startDownload(item.magnetURI, { 
        path: item.path,
        paused: item.isPaused,
        addedDate: item.addedDate,
        completedDate: item.completedDate
      }, false).catch(() => {})
    );
    await Promise.all(promises);
    this.emit('torrentAdded', { restored: true }); 
  }
}

export const torrentEngine = new TorrentEngine();