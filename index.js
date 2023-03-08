const chokidar = require('chokidar')
const OffCloudWatcher = require('./lib/watchers/offcloud')
const Downloader = require('./lib/downloaders/inline')

const {
  OFFCLOUD_API_KEY,
  WATCH_DIR = '/watch',
  DOWNLOAD_DIR = '/download',
  WATCH_RATE = 5000
} = process.env

if (!OFFCLOUD_API_KEY) {
  console.log('[!] OFFCLOUD_API_KEY env var is not set')

  process.exit(-1)
}

// Create a downloader instance
const downloader = new Downloader(WATCH_DIR, DOWNLOAD_DIR)

// Create a watcher instance
const watcher = new OffCloudWatcher(OFFCLOUD_API_KEY, downloader.download)

console.log(`[+] Watching '${WATCH_DIR}' for new nzbs, magnets and torrents`)

chokidar
  .watch(`${WATCH_DIR}`, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: true,
    ignored: '(?<![^/])\\.',
    depth: 99
  })
  .on('add', path => {
    if (path.indexOf('/.') !== -1 || path.indexOf('.queued') !== -1) {
      console.log(`Ignoring '${path}' because it is a work file`)
    } else if (path.indexOf('.torrent') !== -1 || path.indexOf('.magnet') !== -1 || path.indexOf('.nzb') !== -1) {
      watcher.addFile(path)
    } else {
      console.log(`Ignoring '${path}' because it has an unknown extension`)
    }
  })

// Check the torrent watch list every "WATCH_RATE" ms
setInterval(() => watcher.checkWatchList(), WATCH_RATE)
