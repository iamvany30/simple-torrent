import React from 'react';
import './Sidebar.css';
import { useTranslation } from 'react-i18next';
import { formatSpeed } from '../../utils/formatters';
import UpdaterStatus from './UpdaterStatus';


const Sidebar = ({ currentView, setView, stats }) => {
  const { t } = useTranslation();

  const handleAddTorrent = async () => {
    const filePath = await window.electron.openTorrentFile();
    if (filePath) {
      await window.electron.startTorrent({ magnetURI: filePath });
    }
  };

  return (
    <aside className="sidebar">
      <button className="fab-add" onClick={handleAddTorrent}>
        <span>+</span> {t('sidebar.add_torrent')}
      </button>

      <div className="stats-block">
        <div className="stat-row">
          <label>↓ {t('sidebar.download')}</label>
          <span className="val highlight">
            {formatSpeed(stats.downloadSpeed)}
          </span>
        </div>
        <div className="stat-row">
          <label>↑ {t('sidebar.upload')}</label>
          <span className="val">
            {formatSpeed(stats.uploadSpeed)}
          </span>
        </div>
      </div>

      <nav className="nav-menu">
        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setView('dashboard')}
        >
          {t('sidebar.dashboard')}
        </button>
        <button
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
        >
          {t('sidebar.settings')}
        </button>
      </nav>

      <UpdaterStatus />
      
      <div className="version-tag">
        v1.0.6 // VOID
      </div>
    </aside>
  );
};

export default Sidebar;