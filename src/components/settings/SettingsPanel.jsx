import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './SettingsPanel.css';
import LanguageSwitcher from './LanguageSwitcher';

const SettingsPanel = ({ onLoad, onSave, onReset }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    downloadPath: '',
    maxConns: 100,
    enableWatch: false,
    watchPath: '',
    autoLaunch: false,
  });
  const [isDirty, setIsDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      const loadedSettings = await onLoad();
      if (loadedSettings) {
        setSettings(prev => ({ ...prev, ...loadedSettings }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [onLoad]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (name, value) => {
    setSettings(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSelectFolder = async (fieldName) => {
    const folderPath = await window.electron.selectFolder();
    if (folderPath) {
      handleChange(fieldName, folderPath);
    }
  };

  const handleSave = () => {
    onSave(settings);
    setIsDirty(false);
  };

  const handleReset = () => {
    if (window.confirm("Вы уверены, что хотите сбросить все торренты и настройки? Это действие необратимо.")) {
      onReset();
      setTimeout(load, 500);
    }
  };
  
  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>{t('settings.title')}</h2>
        {isDirty && <span className="unsaved-warning">{t('settings.unsaved')}</span>}
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <h4 className="section-title">{t('settings.paths')}</h4>
          <label>{t('settings.download_path')}</label>
          <div className="input-group">
            <input type="text" value={settings.downloadPath || ''} readOnly />
            <button onClick={() => handleSelectFolder('downloadPath')}>...</button>
          </div>
        </div>

        <div className="setting-item">
          <h4 className="section-title">{t('settings.automation')}</h4>
          <div className="checkbox-row">
            <label>{t('settings.auto_launch')}</label>
            <ToggleSwitch
              checked={settings.autoLaunch || false}
              onChange={(checked) => handleChange('autoLaunch', checked)}
            />
          </div>
          <div className="checkbox-row">
            <label>{t('settings.watch_path')}</label>
            <ToggleSwitch
              checked={settings.enableWatch || false}
              onChange={(checked) => handleChange('enableWatch', checked)}
            />
          </div>
          {settings.enableWatch && (
            <div className="input-group" style={{ marginTop: '10px' }}>
              <input type="text" value={settings.watchPath || ''} readOnly placeholder="Папка не выбрана..." />
              <button onClick={() => handleSelectFolder('watchPath')}>...</button>
            </div>
          )}
        </div>

        <div className="setting-item">
          <h4 className="section-title">{t('settings.connections')}</h4>
          <label>{t('settings.max_conns')}</label>
          <input
            type="number"
            value={settings.maxConns || 100}
            onChange={(e) => handleChange('maxConns', parseInt(e.target.value, 10))}
          />
        </div>

        {/* --- Language --- */}
         <div className="setting-item">
          <h4 className="section-title">{t('settings.language')}</h4>
           <LanguageSwitcher />
        </div>
      </div>

      <div className="settings-footer">
        <button onClick={handleReset} className="btn-remove-opt danger" style={{marginRight: 'auto'}}>
          {t('settings.reset')}
        </button>
        <button onClick={handleSave} className="btn-save" disabled={!isDirty}>
          {t('settings.save')}
        </button>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange }) => (
  <div className="toggle-switch" onClick={() => onChange(!checked)}>
    <div className={`knob ${checked ? 'active' : ''}`} />
  </div>
);

export default SettingsPanel;