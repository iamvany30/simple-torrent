import fs from 'fs';
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
    });
    
    this.state = this._load(PATHS.STATE, []);
    this.rssHistory = this._load(PATHS.RSS_HISTORY, []);

    this.saveState = debounce((data) => this._write(PATHS.STATE, data), DEFAULTS.saveDebounce);
  }

  getConfig() { return this.config; }
  getState() { return this.state; }
  getRssHistory() { return this.rssHistory; }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._write(PATHS.CONFIG, this.config);
  }

  saveRssHistory(history) {
    this.rssHistory = history;
    this._write(PATHS.RSS_HISTORY, history);
  }

  _load(filePath, fallback) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {
      //
    }
    return fallback;
  }

  _write(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`[Store] Write error:`, e.message);
    }
  }
}

export const store = new Store();