import { useState, useEffect, useRef } from 'react';

export const useDragDrop = (onDropCallback) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current--;

      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(false);
      dragCounter.current = 0;

      const files = e.dataTransfer.files;
      const text = e.dataTransfer.getData('text');

      if (files && files.length > 0) {
        const path = files[0]?.path;
        
        if (path && (path.endsWith('.torrent') || path.endsWith('.Torrent'))) {
          console.log('[D&D] Torrent file detected:', path);
          onDropCallback(path);
          return;
        }
      } 
      
      if (text && text.startsWith('magnet:')) {
        console.log('[D&D] Magnet link detected:', text);
        onDropCallback(text);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onDropCallback]);

  return isDragging;
};