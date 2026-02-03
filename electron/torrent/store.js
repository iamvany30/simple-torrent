import fs from 'fs';
import fsPromises from 'fs/promises';
import { PATHS, DEFAULT_DOWNLOAD_DIR, DEFAULTS } from './constants.js';

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

class Store {
  constructor() {
    this.config = this._load(PATHS.CONFIG, { 
      downloadPath: DEFAULT_DOWNLOAD_DIR, 
      maxConns: DEFAULTS.maxConns,
      showNotificationsOnComplete: true,
      autoLaunch: false,
      enableWatch: false,
      watchPath: '',
      rssFeeds: []
    });
    
    this.state = this._load(PATHS.STATE, []);
    this.rssHistory = this._load(PATHS.RSS_HISTORY, []);

    this.saveState = debounce((data) => this._writeAsync(PATHS.STATE, data), DEFAULTS.saveDebounce);
  }

  getConfig() { return this.config; }
  getState() { return this.state; }
  getRssHistory() { return this.rssHistory; }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._writeAsync(PATHS.CONFIG, this.config);
  }

  saveRssHistory(history) {
    this.rssHistory = history;
    this._writeAsync(PATHS.RSS_HISTORY, history);
  }

  _load(filePath, fallback) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {
      console.warn(`[Store] Load warning for ${filePath}:`, e.message);
    }
    return fallback;
  }

  async _writeAsync(filePath, data) {
    try {
      const tempPath = `${filePath}.tmp`;
      const json = JSON.stringify(data, null, 2);
      
      await fsPromises.writeFile(tempPath, json, 'utf-8');
      await fsPromises.rename(tempPath, filePath);
    } catch (e) {
      console.error(`[Store] Async Write Error (${filePath}):`, e.message);
    }
  }
}

export const store = new Store();