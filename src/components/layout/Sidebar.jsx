// ==================================================
// FILE: src/components/layout/Sidebar.jsx (ИТОГОВАЯ ВЕРСИЯ)
// ==================================================
import React from 'react';
import './Sidebar.css';
import { useTranslation } from 'react-i18next';
import { formatSpeed } from '../../utils/formatters';
import UpdaterStatus from './UpdaterStatus'; // Импортируем компонент статуса

/**
 * Боковая панель приложения.
 * @param {object} props - Свойства компонента.
 * @param {string} props.currentView - Текущий активный вид ('dashboard' или 'settings').
 * @param {Function} props.setView - Функция для смены вида.
 * @param {object} props.stats - Объект со статистикой скоростей.
 */
const Sidebar = ({ currentView, setView, stats }) => {
  const { t } = useTranslation();

  // Обработчик нажатия на кнопку "Добавить .torrent"
  const handleAddTorrent = async () => {
    // Напрямую обращаемся к API, предоставленному через preload
    const filePath = await window.electron.openTorrentFile();
    if (filePath) {
      await window.electron.startTorrent({ magnetURI: filePath });
    }
  };

  return (
    <aside className="sidebar">
      {/* --- 1. Логотип --- */}
      <div className="logo-area">
        ST<span className="dot">.</span>
      </div>
      
      {/* --- 2. Главная кнопка действия --- */}
      <button className="fab-add" onClick={handleAddTorrent}>
        <span>+</span> {t('sidebar.add_torrent')}
      </button>

      {/* --- 3. Блок статистики --- */}
      <div className="stats-block">
        <div className="stat-row">
          <label>↓ {t('sidebar.download')}</label>
          <span className="val highlight">
            {/* Безопасно получаем данные из props */}
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

      {/* --- 4. Навигация --- */}
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

      {/* --- 5. Статус обновления (прижимается к низу) --- */}
      <UpdaterStatus />
      
      {/* --- 6. Версия приложения --- */}
      <div className="version-tag">
        v1.0.0 // VOID
      </div>
    </aside>
  );
};

export default Sidebar;