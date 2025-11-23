import React from 'react';
import AddForm from '../torrent/AddForm';

const Header = ({ onAdd, onOpenFile, onOpenSettings }) => {
  return (
    <div style={styles.header}>
      <div style={{ flex: 1 }}>
        <AddForm onAdd={onAdd} onOpenFile={onOpenFile} />
      </div>
      
      <div style={styles.controls}>
        <button onClick={onOpenSettings} style={styles.btn} title="Настройки">⚙️</button>
      </div>
    </div>
  );
};

const styles = {
  header: {
    borderBottom: '1px solid var(--bg-tertiary)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    paddingRight: 10
  },
  controls: {
    display: 'flex',
    gap: '10px'
  },
  btn: {
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    transition: 'color 0.2s'
  }
};

export default Header;