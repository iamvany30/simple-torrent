import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatBytes, formatSpeed, formatTime } from '../../utils/formatters';
import './TorrentCard.css';

const PlayIcon = () => '▶';
const PauseIcon = () => '❚❚';
const TrashIcon = () => '🗑️';

const TorrentCard = memo(({ torrent, onPause, onResume, onRemove }) => {
  const { t } = useTranslation();

  const { id, name, progress, downloadSpeed, numPeers, totalSize, downloaded, timeRemaining, isPaused, status, numFiles } = torrent;

  const percent = Math.floor((progress || 0) * 100);

  const statusMap = {
    downloading: t('grid.downloading'),
    paused: t('grid.paused'),
    completed: t('grid.completed'),
    metadata: t('grid.searching'),
    checking: 'ПРОВЕРКА...'
  };

  const handlePauseResume = (e) => {
    e.stopPropagation();
    if (isPaused) onResume(id);
    else onPause(id);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(torrent);
  };

  const cardClasses = `torrent-card status-${status}`;
  
  const isCompleted = status === 'completed';

  return (
    <div className={cardClasses}>
      <header className="card-header">
        <h3 className="card-title" title={name}>{name}</h3>
      </header>
      
      <section className="card-progress">
        <div className="status-header">
          <span className="status-text">{statusMap[status] || 'UNKNOWN'}</span>
          <span className="downloaded-size">{`${formatBytes(downloaded)} / ${formatBytes(totalSize)}`}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </section>

      <section className="card-stats-grid">
        <div className="stat-item">
          <span className="label">↓ {t('grid.speed')}</span>
          <span className="value">{formatSpeed(downloadSpeed)}</span>
        </div>
        <div className="stat-item">
          <span className="label">↑ {t('grid.speed')}</span>
          <span className="value">0 B/s</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('grid.peers')}</span>
          <span className="value">{numPeers}</span>
        </div>
        <div className="stat-item">
          <span className="label">{status === 'downloading' ? 'ETA' : 'ФАЙЛЫ'}</span>
          <span className="value">{status === 'downloading' ? formatTime(timeRemaining) : (numFiles || '—')}</span>
        </div>
      </section>

      <div className="card-actions">
        <button
          className="btn-icon"
          onClick={handlePauseResume}
          title={isPaused ? 'Возобновить' : 'Пауза'}
          disabled={isCompleted}
        >
          {isPaused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button className="btn-icon danger" onClick={handleRemove} title="Удалить">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
});

export default TorrentCard;