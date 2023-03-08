const fs = require('fs')
const path = require('path')
const debug = require('debug')('patbrid:watchers:offcloud')
const OffCloudAPI = require('./offcloudapi')
const OffCloudTorrent = require('./torrent')

class OffCloudWatcher {
  constructor (apiKey, downloadFn) {
    debug('ctor', apiKey)

    this.client = new OffCloudAPI(apiKey)
    console.log('this.client ', this.client)
    this.downloadFn = downloadFn
    this.watchList = []
  }

  addFile (file) {
    debug('addFile', file)

    const extension = path.extname(file).toLowerCase()

    if (extension === '.magnet') {
      this.addMagnet(file)
    } else {
      this.addTorrent(file)
    }
  }

  addTorrent (file) {
    debug('addTorrent', file)
    console.log('found file: ', file)

    // Create a torrent instance
    const torrent = new OffCloudTorrent(this.client, this.downloadFn, file)
    console.log('created file: ', file)
    // Add the torrent to the queue
    return torrent.addToQueue()
      // Save to the watch list
      .then(() => this.addToWatchList(torrent))
      // Log errors
      .catch(err => console.error('[!] addTorrent failed', err))
  }

  addMagnet (file) {
    debug('addMagnet', file)

    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        debug('read magnet error', err)
      }

      // Create a torrent instance
      const torrent = new OffCloudTorrent(this.client, this.downloadFn, file, data)

      // Add the torrent to the queue
      return torrent.addToQueue()
      // Save to the watch list
        .then(() => this.addToWatchList(torrent))
      // Log errors
        .catch(err => console.error('[!] addTorrent failed', err))
    })
  }

  checkWatchList () {
    debug('checkWatchList', this.watchList.length)

    // Remove invalid torrents
    this.removeInvalidTorrents()

    // Go through each torrent and update it
    const promises = this.watchList.map(torrent => torrent.update())

    // Wait for all torrents to update
    return Promise.all(promises)
      .catch(err => console.error('[!] checkWatchList failed', err))
  }

  addToWatchList (torrent) {
    debug('addToWatchList', torrent.file)

    // Add the torrent to the watch list
    this.watchList.push(torrent)
  }

  removeFromWatchList (torrent) {
    debug('removeFromWatchList', torrent.file)

    // Remove the torrent from the watch list
    const index = this.watchList.indexOf(torrent)

    if (~index) {
      this.watchList.splice(index, 1)
    }
  }

  removeInvalidTorrents () {
    debug('removeInvalidTorrents')

    // Remove any invalid torrents from the watch list
    this.watchList.forEach(torrent => {
      if (torrent.status === 'invalid') {
        this.removeFromWatchList(torrent)
      }
    })
  }
}

module.exports = OffCloudWatcher
