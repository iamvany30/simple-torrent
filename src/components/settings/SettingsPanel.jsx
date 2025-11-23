import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SettingsPanel.css';

export default function SettingsPanel({ onSave, onLoad }) {
  const { t, i18n } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  
  const [config, setConfig] = useState({
    downloadPath: '',
    maxConns: 100,
    downloadLimit: -1,
    uploadLimit: -1,
    autoLaunch: false,
    enableWatch: false,
    watchPath: '',
    rssFeeds: []
  });

  const [originalConfig, setOriginalConfig] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await onLoad();
        if (mounted && data) {
          setConfig(data);
          setOriginalConfig(data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [onLoad]);

  useEffect(() => {
    if (!originalConfig) return;
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setIsDirty(changed);
  }, [config, originalConfig]);

  
  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleBrowse = async (field) => {
    const path = await window.electron.selectFolder({
      title: field === 'downloadPath' ? t('dialogs.select_folder') : 'Select Watch Folder'
    });
    if (path) {
      handleChange(field, path);
    }
  };

  const handleSave = async () => {
    await onSave(config);
    setOriginalConfig(config);
    setIsDirty(false);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  if (loading) return <div className="settings-panel">Loading configuration...</div>;

  return (
    <div className="settings-panel">
      
      <div className="settings-header">
        <h2>{t('settings.title')}</h2>
        {isDirty && (
          <span className="unsaved-warning">
            {t('settings.unsaved')}
          </span>
        )}
      </div>

      <div className="settings-grid">
        
        <div className="setting-section">
          <div className="section-title">{t('settings.paths')}</div>
          
          <div className="setting-item">
            <label>{t('settings.download_path')}</label>
            <div className="input-group">
              <input 
                type="text" 
                value={config.downloadPath} 
                readOnly 
              />
              <button onClick={() => handleBrowse('downloadPath')}>...</button>
            </div>
          </div>
        </div>

        <div className="setting-double-col">
          <div className="setting-item">
            <label>{t('settings.limits')} (KB/s, -1 = ∞)</label>
            <div className="input-group">
              <input 
                type="number" 
                placeholder="DL Limit"
                value={config.downloadLimit}
                onChange={(e) => handleChange('downloadLimit', parseInt(e.target.value))}
              />
               <input 
                type="number" 
                placeholder="UP Limit"
                value={config.uploadLimit}
                onChange={(e) => handleChange('uploadLimit', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="setting-item">
            <label>{t('settings.connections')}</label>
            <input 
              type="number" 
              value={config.maxConns}
              onChange={(e) => handleChange('maxConns', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="setting-section">
          <div className="section-title">AUTOMATION</div>
          
          <div className="checkbox-row" onClick={() => handleChange('autoLaunch', !config.autoLaunch)}>
            <label>Start with System</label>
            <div className="toggle-switch">
              <div className={`knob ${config.autoLaunch ? 'active' : ''}`} />
            </div>
          </div>

          <div className="checkbox-row" style={{ marginTop: 10 }} onClick={() => handleChange('enableWatch', !config.enableWatch)}>
            <label>Enable Watch Folder</label>
            <div className="toggle-switch">
              <div className={`knob ${config.enableWatch ? 'active' : ''}`} />
            </div>
          </div>

          {config.enableWatch && (
            <div className="setting-item" style={{ marginTop: 10 }}>
              <div className="input-group">
                <input 
                  type="text" 
                  value={config.watchPath || ''} 
                  placeholder="Select folder to watch for .torrent files"
                  readOnly 
                />
                <button onClick={() => handleBrowse('watchPath')}>...</button>
              </div>
            </div>
          )}
        </div>

        <div className="setting-section">
          <div className="section-title">{t('settings.language')}</div>
          <div className="lang-switcher">
            <button 
              className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <span className="lang-divider">/</span>
            <button 
              className={`lang-btn ${i18n.language === 'ru' ? 'active' : ''}`}
              onClick={() => changeLanguage('ru')}
            >
              RU
            </button>
          </div>
        </div>

      </div>

      <div className="settings-footer">
        <button 
          className="btn-save" 
          onClick={handleSave}
          disabled={!isDirty}
        >
          {t('settings.save')}
        </button>
      </div>
    </div>
  );
}