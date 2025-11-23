import React, { useState, useEffect } from 'react';
import './UpdaterStatus.css';

const UpdaterStatus = () => {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState('');

  useEffect(() => {
    const removeListener = window.electron.onUpdaterStatus((data) => {
      console.log('[Updater UI] Received status:', data.status);
      setStatus(data.status);
      if (data.status === 'downloading') {
        setProgress(data.progress.percent);
      }
      if (data.status === 'available' || data.status === 'downloaded') {
        setVersion(data.info.version);
      }
    });

    return () => removeListener();
  }, []);

  const handleRestart = () => {
    window.electron.updaterQuitAndInstall();
  };

  if (status === 'idle' || status === 'not-available') {
    return null;
  }

  return (
    <div className="updater-status-bar">
      {status === 'available' && <p>Доступно обновление {version}!</p>}
      {status === 'downloading' && (
        <div className="download-progress">
          <p>Загрузка обновления...</p>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {status === 'downloaded' && (
        <>
          <p>Обновление {version} готово!</p>
          <button onClick={handleRestart}>Перезапустить</button>
        </>
      )}
      {status === 'error' && <p className="error">Ошибка обновления</p>}
    </div>
  );
};

export default UpdaterStatus;