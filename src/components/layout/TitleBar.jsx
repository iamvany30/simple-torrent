import React from 'react';
import './TitleBar.css';

const TitleBar = () => {
  
  const handleMinimize = () => {
    if (window.electron) window.electron.minimizeWindow();
  };

  const handleMaximize = () => {
    if (window.electron) window.electron.maximizeWindow();
  };

  const handleClose = () => {
    if (window.electron) window.electron.closeWindow();
  };

  return (
    <header className="custom-titlebar">
      <div className="titlebar-drag-region">
        <div className="app-icon">
          <span className="bracket">[</span>
          <span className="accent">ST</span>
          <span className="bracket">]</span>
        </div>
        <div className="app-name">
          SIMPLE<span className="dim">TORRENT</span>
        </div>
        <div className="sys-status">
           // SYSTEM READY
        </div>
      </div>

      <div className="window-controls">
        <button className="control-btn minimize" onClick={handleMinimize} title="Minimize">
          <svg width="10" height="1" viewBox="0 0 10 1">
            <path d="M0 0h10v1H0z" fill="currentColor" />
          </svg>
        </button>
        
        <button className="control-btn maximize" onClick={handleMaximize} title="Maximize">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1h8v8H1V1zm1 1v6h6V2H2z" fill="currentColor" />
          </svg>
        </button>
        
        <button className="control-btn close" onClick={handleClose} title="Close">
           <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 0L0 1l4 4-4 4 1 1 4-4 4 4 1-1-4-4 4-4-1-1-4 4z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default TitleBar;