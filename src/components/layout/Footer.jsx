import React from 'react';
import { formatBytes } from '../../utils/formatters';

const Footer = ({ count, stats, onReset }) => {
  return (
    <div style={styles.footer}>
      <div style={{ display: 'flex', gap: '15px' }}>
        <span>Всего: {count}</span>
        <span style={{ color: '#2ecc71' }}>DL: {formatBytes(stats.downloaded)}</span>
        <span style={{ color: '#3498db' }}>UL: {formatBytes(stats.uploaded)}</span>
      </div>

      <button 
        onClick={onReset} 
        style={styles.resetBtn}
        title="Полный сброс данных"
      >
        RESET
      </button>
    </div>
  );
};

const styles = {
  footer: {
    padding: '8px 15px',
    background: 'var(--bg-secondary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--bg-tertiary)'
  },
  resetBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.5,
    fontSize: '10px',
    transition: 'opacity 0.2s'
  }
};

export default Footer;