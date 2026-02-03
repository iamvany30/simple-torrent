import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useTorrentEngine = () => {
  const { t } = useTranslation();

  const [torrents, setTorrents] = useState([]);
  const [stats, setStats] = useState({ 
    downloaded: 0, 
    uploaded: 0,
    downloadSpeed: 0,
    uploadSpeed: 0
  });

  useEffect(() => {
    const removeUpdateListener = window.electron.onUpdate((data) => {
      if (!data) return;

      if (data.torrents) {
        setTorrents(data.torrents);
        if (data.stats) setStats(data.stats);
      } else if (Array.isArray(data)) {
        setTorrents(data);
      }
    });

    const removeMagnetListener = window.electron.onMagnet((url) => {
      console.log('🔗 Magnet received in UI');
      addTorrent(url);
    });

    const removeFileListener = window.electron.onFileOpen((path) => {
      console.log('📂 File open received in UI');
      addTorrent(path);
    });

    window.electron.notifyUIReady();

    return () => {
      removeUpdateListener();
      removeMagnetListener();
      removeFileListener();
    };
  }, []);


  const addTorrent = useCallback(async (magnetOrPath) => {
    if (!magnetOrPath) return;
    console.log(`[UI] Adding: ${magnetOrPath}`);
    try {
      await window.electron.startTorrent({
        magnetURI: magnetOrPath,
        path: null 
      });
    } catch (err) {
      console.error('[UI] Error adding torrent:', err);
    }
  }, []);

  const removeTorrent = useCallback(async (id, deleteFiles = false) => {
    await window.electron.removeTorrent(id, deleteFiles);
  }, []);

  const pauseTorrent = useCallback(async (id) => window.electron.pauseTorrent(id), []);
  const resumeTorrent = useCallback(async (id) => window.electron.resumeTorrent(id), []);
  
  const openAndAddTorrent = useCallback(async () => {
    const filePath = await window.electron.openTorrentFile({ title: t('dialogs.open_file') });
    if (filePath) await addTorrent(filePath);
  }, [addTorrent, t]);

  const selectFolder = useCallback(() => window.electron.selectFolder(), []);
  const resetApp = useCallback(async () => { await window.electron.resetApp(); setTorrents([]); }, []);
  const loadSettings = useCallback(() => window.electron.getSettings(), []);
  const saveSettings = useCallback((cfg) => window.electron.saveSettings(cfg), []);

  const openFile = useCallback((path) => window.electron.openFile(path), []);
  const showInFolder = useCallback((path) => window.electron.showInFolder(path), []);

  return { 
    torrents, 
    stats,
    addTorrent, 
    removeTorrent, 
    pauseTorrent,
    resumeTorrent,
    openAndAddTorrent, 
    selectFolder,
    resetApp,
    loadSettings,
    saveSettings,
    openFile,
    showInFolder
  };
};