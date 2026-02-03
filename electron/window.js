import { BrowserWindow, shell, app } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class WindowStateManager {
  constructor(filename, defaults) {
    this.path = path.join(app.getPath("userData"), filename);
    this.defaults = defaults;
    this.state = this._load();
    this._save = this._debounce(this._write.bind(this), 500);
  }

  _load() {
    try {
      if (fs.existsSync(this.path)) {
        return JSON.parse(fs.readFileSync(this.path, "utf-8"));
      }
    } catch (e) {
      console.error("Failed to load window state:", e);
    }
    return this.defaults;
  }

  _write() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.state));
    } catch (e) {
      console.error("Failed to save window state:", e);
    }
  }

  _debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  getBounds() { return this.state; }
  
  save(bounds) {
    this.state = bounds;
    this._save();
  }
}

const windowStateManager = new WindowStateManager("window-state.json", { 
  width: 900, 
  height: 600 
});

export function createMainWindow() {
  const iconPath = path.join(__dirname, "../../resources/icons/icon.png");
  const bounds = windowStateManager.getBounds();

  const win = new BrowserWindow({
    ...bounds,
    minWidth: 600,
    minHeight: 400,
    icon: iconPath,
    title: "SimpleTorrent",
    show: false,
    backgroundColor: "#050505",
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: '#050505',
      symbolColor: '#e0e0e0',
      height: 32
    },

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"), 
      sandbox: false 
    }
  });

  win.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  const saveState = () => {
    if (!win.isDestroyed() && !win.isMaximized() && !win.isMinimized()) {
      windowStateManager.save(win.getBounds());
    }
  };

  win.on("move", saveState);
  win.on("resize", saveState);

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  return win;
}