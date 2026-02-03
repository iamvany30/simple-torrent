export class StreamServer {
  constructor(client) {
    this.client = client;
    this.server = null;
    this.port = 0;
  }

  start() {
    if (this.server) return;
    
    this.server = this.client.createServer();
    this.server.listen(0, () => {
      this.port = this.server.address().port;
      console.log(`[StreamServer] Listening on http://localhost:${this.port}`);
    });
  }

  stop() {
    if (!this.server) return;
    
    this.server.close();
    this.server = null;
  }

  getStreamUrl(file) {
    if (!this.server || !file || !file._torrent) return null;
    
    const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
    return `http://localhost:${this.port}/webtorrent/${file._torrent.infoHash}/${encodedPath}`;
  }
}
