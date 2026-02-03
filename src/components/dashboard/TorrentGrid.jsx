import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import TorrentCard from './TorrentCard';
import './TorrentGrid.css';

const CARD_MIN_WIDTH = 350;
const CARD_HEIGHT = 210; 
const GUTTER_SIZE = 25;

const TorrentGrid = ({ torrents, onRemove, onPause, onResume }) => {
  const { t } = useTranslation();
  
  const [GridModule, setGridModule] = useState(null);
  const [AutoSizerModule, setAutoSizerModule] = useState(null);
  const [libsLoaded, setLibsLoaded] = useState(false);

  const [removeModal, setRemoveModal] = useState({ show: false, id: null, title: '' });

  useEffect(() => {
    let mounted = true;

    const loadLibs = async () => {
      try {
        const ReactWindow = await import('react-window');
        const AutoSizer = await import('react-virtualized-auto-sizer');

        if (!mounted) return;

        const GridComp = ReactWindow.FixedSizeGrid || ReactWindow.default?.FixedSizeGrid || ReactWindow.default;
        const ASComp = AutoSizer.default || AutoSizer;

        console.log('[Grid] Libs loaded:', { GridComp, ASComp });

        setGridModule(() => GridComp);
        setAutoSizerModule(() => ASComp);
        setLibsLoaded(true);
      } catch (error) {
        console.error('[Grid] Failed to load virtualization libs:', error);
        setLibsLoaded(true); 
      }
    };

    loadLibs();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (window.electron && window.electron.onContextDeleteRequest) {
      const unsubscribe = window.electron.onContextDeleteRequest((_event, id) => {
        const target = torrents.find(t => t.id === id);
        if (target) {
          setRemoveModal({ show: true, id: target.id, title: target.name });
        }
      });
      return () => unsubscribe();
    }
  }, [torrents]);

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    if (window.electron && window.electron.showContextMenu) {
      window.electron.showContextMenu(id);
    }
  };

  const confirmRemove = (deleteFiles) => {
    if (removeModal.id) {
      onRemove(removeModal.id, deleteFiles);
      setRemoveModal({ show: false, id: null, title: '' });
    }
  };


  if (!torrents || torrents.length === 0) {
    return (
      <div className="empty-state">
        <div className="scanner-line"></div>
        <p>{t('grid.empty_state')}</p>
      </div>
    );
  }

  const Cell = ({ columnIndex, rowIndex, style, data }) => {
    const { items, columnCount } = data;
    const index = rowIndex * columnCount + columnIndex;
    if (index >= items.length) return null;
    const torrent = items[index];

    const cardStyle = {
      ...style,
      left: Number(style.left) + GUTTER_SIZE,
      top: Number(style.top) + GUTTER_SIZE,
      width: Number(style.width) - GUTTER_SIZE,
      height: Number(style.height) - GUTTER_SIZE,
    };

    return (
      <div style={cardStyle} onContextMenu={(e) => handleContextMenu(e, torrent.id)}>
        <TorrentCard
          torrent={torrent}
          onPause={() => onPause(torrent.id)}
          onResume={() => onResume(torrent.id)}
          onRemove={() => setRemoveModal({ show: true, id: torrent.id, title: torrent.name })}
        />
      </div>
    );
  };

  if (!libsLoaded) {
    return <div className="loading-grid" style={{padding: 20}}>Loading view...</div>;
  }

  if (GridModule && AutoSizerModule) {
    const Grid = GridModule;
    const AutoSizer = AutoSizerModule;

    return (
      <>
        <div className="torrent-grid-container" style={{ flex: 1, height: '100%', width: '100%' }}>
          <AutoSizer>
            {({ height, width }) => {
              const safeWidth = width || 800;
              const safeHeight = height || 600;
              const columnCount = Math.floor(safeWidth / (CARD_MIN_WIDTH + GUTTER_SIZE)) || 1;
              const columnWidth = Math.floor(safeWidth / columnCount);
              const rowCount = Math.ceil(torrents.length / columnCount);

              return (
                <Grid
                  className="torrent-virtual-grid"
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  height={safeHeight}
                  rowCount={rowCount}
                  rowHeight={CARD_HEIGHT + GUTTER_SIZE}
                  width={safeWidth}
                  itemData={{ items: torrents, columnCount }}
                >
                  {Cell}
                </Grid>
              );
            }}
          </AutoSizer>
        </div>
        {renderRemoveModal()}
      </>
    );
  }

  return (
    <>
      <div className="torrent-grid-fallback" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '25px', 
          padding: '20px',
          overflowY: 'auto',
          height: '100%'
      }}>
        {torrents.map(torrent => (
          <div key={torrent.id} onContextMenu={(e) => handleContextMenu(e, torrent.id)}>
            <TorrentCard
              torrent={torrent}
              onPause={() => onPause(torrent.id)}
              onResume={() => onResume(torrent.id)}
              onRemove={() => setRemoveModal({ show: true, id: torrent.id, title: torrent.name })}
            />
          </div>
        ))}
      </div>
      {renderRemoveModal()}
    </>
  );

  function renderRemoveModal() {
    if (!removeModal.show) return null;
    return (
      <div className="remove-modal-overlay">
        <div className="remove-modal">
          <div className="remove-header">
            <span>{t('delete_modal.title')}</span>
            <button className="btn-cancel-x" onClick={() => setRemoveModal({ show: false, id: null })}>×</button>
          </div>
          <div className="remove-body">
            <p>{t('delete_modal.target')}</p>
            <span className="torrent-name-highlight">{removeModal.title}</span>
            <div className="remove-actions">
              <button className="btn-remove-opt" onClick={() => confirmRemove(false)}>{t('delete_modal.keep_files')}</button>
              <button className="btn-remove-opt danger" onClick={() => confirmRemove(true)}>{t('delete_modal.delete_data')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default TorrentGrid;