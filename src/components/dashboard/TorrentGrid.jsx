import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TorrentCard from './TorrentCard';
import './TorrentGrid.css';

const EmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <div className="scanner-line" />
      <p>{t('grid.empty_state')}</p>
    </div>
  );
};

const RemoveModal = ({ torrent, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  if (!torrent) return null;

  return (
    <div className="remove-modal-overlay" onClick={onCancel}>
      <div className="remove-modal" onClick={(e) => e.stopPropagation()}>
        <div className="remove-header">
          <span>{t('delete_modal.title')}</span>
          <button onClick={onCancel} className="btn-cancel-x">×</button>
        </div>
        <div className="remove-body">
          <p>{t('delete_modal.target')}</p>
          <span className="torrent-name-highlight">{torrent.name}</span>
        </div>
        <div className="remove-actions">
          <button className="btn-remove-opt" onClick={() => onConfirm(torrent.id, false)}>
            {t('delete_modal.keep_files')}
          </button>
          <button className="btn-remove-opt danger" onClick={() => onConfirm(torrent.id, true)}>
            {t('delete_modal.delete_data')}
          </button>
        </div>
      </div>
    </div>
  );
};


const TorrentGrid = ({ torrents, pauseTorrent, resumeTorrent, removeTorrent }) => {
  const [torrentToRemove, setTorrentToRemove] = useState(null);

  const handleRemoveRequest = (torrent) => {
    setTorrentToRemove(torrent);
  };

  const handleConfirmRemove = (id, deleteFiles) => {
    removeTorrent(id, deleteFiles);
    setTorrentToRemove(null);
  };

  const handleCancelRemove = () => {
    setTorrentToRemove(null);
  };

  if (!torrents || torrents.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="torrent-grid">
        {torrents.map(torrent => (
          <TorrentCard
            key={torrent.id}
            torrent={torrent}
            onPause={pauseTorrent}
            onResume={resumeTorrent}
            onRemove={handleRemoveRequest}
          />
        ))}
      </div>

      <RemoveModal
        torrent={torrentToRemove}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </>
  );
};

export default TorrentGrid;