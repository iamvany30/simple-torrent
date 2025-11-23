import React from 'react';
import TorrentGrid from '../components/dashboard/TorrentGrid';

const DashboardView = ({ torrents, pauseTorrent, resumeTorrent, removeTorrent }) => {

  return (
    <div className="main-content">
      <TorrentGrid
        torrents={torrents}
        pauseTorrent={pauseTorrent}
        resumeTorrent={resumeTorrent}
        removeTorrent={removeTorrent}
      />
    </div>
  );
};

export default DashboardView;