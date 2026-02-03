export class DataFormatter {
  constructor(server) {
    this.server = server;
  }

  formatSummary(torrents, pausedSet) {
    if (!torrents) return [];

    return torrents
      .map(torrent => {
        if (!torrent) return null;

        const isPaused = pausedSet.has(torrent.infoHash);
        const hasFiles = torrent.files && torrent.files.length > 0;
        
        let status = 'checking';
        if (hasFiles) {
          if (torrent.progress >= 1) {
            status = 'completed';
          } else if (isPaused) {
            status = 'paused';
          } else {
            status = 'downloading';
          }
        }

        return {
          id: torrent.infoHash,
          name: torrent.name || `Loading... (${torrent.infoHash ? torrent.infoHash.slice(0, 6) : '...'})`,
          progress: torrent.progress || 0,
          downloadSpeed: isPaused ? 0 : (torrent.downloadSpeed || 0),
          uploadSpeed: torrent.uploadSpeed || 0,
          numPeers: torrent.numPeers || 0,
          totalSize: torrent.length || 0,
          downloaded: torrent.downloaded || 0,
          uploaded: torrent.uploaded || 0,
          timeRemaining: torrent.timeRemaining || 0,
          isPaused: !!isPaused,
          isMetadataLoaded: !!hasFiles,
          ratio: torrent.ratio || 0,
          status: status,
          addedDate: torrent.addedDate,
          completedDate: torrent.completedDate,
          numFiles: hasFiles ? torrent.files.length : 0
        };
      })
      .filter(Boolean);
  }

  formatFiles(torrent) {
    if (!torrent || !torrent.files) return [];

    return torrent.files.map((file, index) => ({
      index: index,
      name: file.name,
      size: file.length,
      progress: file.progress
    }));
  }

  formatPeers(torrent) {
    return [];
  }
}
