import path from 'path';
import { app } from 'electron';
import os from 'os';

export const USER_DATA = app.getPath('userData');
export const DEFAULT_DOWNLOAD_DIR = path.join(os.homedir(), 'Downloads', 'SimpleTorrent');

export const PATHS = {
  STATE: path.join(USER_DATA, 'torrents-state.json'),
  CONFIG: path.join(USER_DATA, 'config.json'),
  RSS_HISTORY: path.join(USER_DATA, 'rss-history.json')
};

export const DEFAULTS = {
  maxConns: 150,
  rssUpdateInterval: 900000,
  saveDebounce: 2000
};

export const BEST_TRACKERS = [];
