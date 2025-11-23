import React from 'react';
import TorrentItem from '../torrent/TorrentItem';

const TorrentList = ({ torrents, onRemove, onPause, onResume, onDetails }) => {
  return (
    <div style={styles.container}>
      {torrents.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚡</div>
          <div style={{ textAlign: 'center', lineHeight: '1.5' }}>
            <strong>SimpleTorrent готов</strong><br/>
            Перетащите файл сюда<br/>или нажмите Ctrl+V
          </div>
        </div>
      ) : (
        torrents.map((t) => (
          <TorrentItem 
            key={t.id} 
            torrent={t} 
            onRemove={onRemove}
            onPause={onPause}
            onResume={onResume}
            onDetails={() => onDetails(t)}
          />
        ))
      )}
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--spacing-md)'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary)',
    opacity: 0.7
  }
};

export default TorrentList;