// ==================================================
// FILE: src/hooks/useTorrentEngine.js (ИТОГОВАЯ ВЕРСИЯ)
// ==================================================
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useTorrentEngine = () => {
  const { t } = useTranslation();

  // === STATE ===
  const [torrents, setTorrents] = useState([]);
  
  // <<< ГЛАВНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ
  // Убедимся, что начальное состояние имеет все необходимые поля.
  const [stats, setStats] = useState({ 
    downloaded: 0, 
    uploaded: 0,
    downloadSpeed: 0, // <-- Добавлено
    uploadSpeed: 0    // <-- Добавлено
  });

  // === 1. INITIALIZATION & LISTENERS ===
  useEffect(() => {
    // Слушаем обновления от Electron
    const stopUpdates = window.electron.onUpdate((data) => {
      if (!data) return;

      // Обработка формата { torrents, stats }
      if (data.torrents) {
        setTorrents(data.torrents);
        if (data.stats) setStats(data.stats);
      } 
      // Обработка старого формата (просто массив)
      else if (Array.isArray(data)) {
        setTorrents(data);
      }
    });

    // Слушаем внешние ссылки
    const stopMagnet = window.electron.onMagnet((url) => {
      console.log('🔗 Magnet received in UI');
      addTorrent(url);
    });

    const stopFileOpen = window.electron.onFileOpen((path) => {
      console.log('📂 File open received in UI');
      addTorrent(path);
    });

    // Сообщаем, что мы готовы
    console.log('[UI] Sending ready signal...');
    window.electron.notifyUIReady();

    return () => {
      stopUpdates();
      stopMagnet();
      stopFileOpen();
    };
  }, []);

  // === 2. ACTIONS ===

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
    saveSettings
  };
};