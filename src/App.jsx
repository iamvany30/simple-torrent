import React, { useState } from 'react';
import './App.css';

import { useDragDrop } from './hooks/useDragDrop';
import { useTorrentEngine } from './hooks/useTorrentEngine';

import Sidebar from './components/layout/Sidebar';
import TitleBar from './components/layout/TitleBar';
import DashboardView from './views/DashboardView';
import SettingsPanel from './components/settings/SettingsPanel';

const DropZoneOverlay = () => (
  <div className="drop-zone-overlay">
    <div className="drop-zone-content">
      <div className="drop-icon">⤓</div>
      <h2>DROP TO ADD</h2>
      <p>Supports .torrent files and magnet links</p>
    </div>
  </div>
);

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const {
    torrents,
    stats,
    addTorrent,
    pauseTorrent,
    resumeTorrent,
    removeTorrent
  } = useTorrentEngine();

  const isDragging = useDragDrop(addTorrent);

  return (
    <div className="app-container">
      <TitleBar />
      <div className="ambient-noise" />
      
      <div className="app-body">
        <Sidebar
          currentView={currentView}
          setView={setCurrentView}
          stats={stats} 
        />
        
        {currentView === 'dashboard' && (
          <DashboardView
            torrents={torrents}
            pauseTorrent={pauseTorrent}
            resumeTorrent={resumeTorrent}
            removeTorrent={removeTorrent}
          />
        )}

        {currentView === 'settings' && (
          <div className="main-content">
            <SettingsPanel />
          </div>
        )}
      </div>

      {isDragging && <DropZoneOverlay />}
    </div>
  );
}

export default App;