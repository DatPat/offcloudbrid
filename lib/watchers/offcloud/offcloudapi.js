// const fetch = require('node-fetch')
//  const { EEXIST } = require('constants')
const fs = require('fs')
const https = require('https')
const debug = require('debug')('fs:fsmonitor:request')
const request = require('request')
const axios = require('axios')
const FormData = require('form-data')
const { resolve } = require('path')
// const request = require('./await-request')

class OffCloudAPI {
  constructor (token, defaultOptions = {}) {
    this.token = token
    this.base_url = defaultOptions.base_url || 'https://offcloud.com/api/'
    this.defaultOptions = defaultOptions
    delete this.defaultOptions.base_url
  }

  runRequest (endpoint, o = {}) {
    const options = Object.assign({}, this.defaultOptions)

    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      options.url = endpoint + `?key=${this.token}`
    } else {
      options.url = this.base_url + endpoint + `?key=${this.token}`
    }
    console.log('request: ', options.url)
    options.json = true
    options.qs = o.qs || {}
    options.headers = options.headers || {}

    for (const i in o) {
      options[i] = o[i]
    }

    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error)
        } else {
          if (typeof body !== 'undefined') {
            if (options.binary) body = JSON.parse(body)
            if (body.error) {
              reject(body.error)
            } else {
              resolve(body)
            }
          } else if (response.statusCode === 200) {
            resolve()
          } else {
            reject(response.statusCode)
          }
        }
      })
    })
  }

  async _request (endpoint, o = {}) {
    try {
      const result = await this.runRequest(endpoint, o)
      console.log('result: ', result)
      return result
    } catch (err) {
      if (err.errno === 'ECONNREFUSED' || err.errno === 'ECONNRESET') {
        console.log(err.errno)
        this.sleep(10000)
        console.log('retrying: ', endpoint)
        return this._request(endpoint, o)
      }
      throw err
    }
  }

  _get (endpoint, options = {}) {
    options.method = 'get'
    return this._request(endpoint, options)
  }

  _delete (endpoint, options = {}) {
    options.method = 'delete'// 'delete'
    return this._request(endpoint, options)
  }

  _post (endpoint, options = {}) {
    options.method = 'post'
    return this._request(endpoint, options)
  }

  _put (endpoint, options = {}) {
    options.method = 'put'
    return this._request(endpoint, options)
  }

  CloudDetails () {
    debug('CloudDetails: ')
    return this._post('cloud/download', {
      formData: {
      },
      jar: true,
      json: true
    })
  }

  explore (reqid) {
    debug('explore: ', reqid)
    return this._post('cloud/explore', {
      formData: {
        requestId: reqid
      },
      jar: true,
      json: true
    })
  }

  CloudStatus (reqid) {
    debug('CloudStatus: ', reqid)
    return this._post('cloud/status', {
      formData: {
        requestId: reqid
      },
      jar: true,
      json: true
    })
  }

  delete (reqid) {
    debug('delete: ', reqid)
    return this._get('https://offcloud.com/cloud/remove/' + reqid, {
      jar: true,
      json: true
    })// 'https://offcloud.com/cloud/remove/'
  }

  proxies () {
    debug('proxies: ')
    return this._post('proxy', {
      formData: {
        requestId: ''
      },
      jar: true,
      json: true
    })
  }

  remotes () {
    debug('remotes: ')
    return this._post('remote/accounts', {
      formData: {
        requestId: ''
      },
      jar: true,
      json: true
    })
  }

  btstatus (bthashes) {
    return this._post('cache', {
      formData: {
        hashes: [bthashes]
      },
      jar: true,
      json: true
    })
  }

  addCloud (link) {
    debug('addCloud: ', link)
    return this._post('cloud', {
      formData: { url: link },
      jar: true,
      json: true,
      crossDomain: true, // enable this
      xhrFields: {
        withCredentials: true
      }
    })
  }

  addUsenet (link, name) {
    debug('addUsenet: ', link)
    // return this._post('https://offcloud.com/cloud/request', {
    return this._post('cloud', {
      formData: { url: link, customFileName: name },
      jar: true,
      json: true,
      crossDomain: true, // enable this
      xhrFields: {
        withCredentials: true
      }
    })
  }

  sleep (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  /*
  addFile (path) {
    const options = {
      method: 'POST',
      url: 'https://offcloud.com/torrent/upload' + `?key=${this.token}`,
      port: 443,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        file: fs.createReadStream(path),
        name: 'file',
        filename: path
      }
    }
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        console.log('GOT A RESPONSE TO OUR REQUEST', error, body)
        if (typeof body !== 'undefined') {
          body = JSON.parse(body)
          if (body.success === true) {
            resolve(body)
          } else {
            reject(response)
          }
        } else if (response.statusCode === 200) {
          resolve()
        } else {
          reject(response)
        }
        if (error !== null && typeof error !== 'undefined') {
          reject(error)
        }
      })
    })
  }
*/
  httpsPost ({ body, ...options }) {
    return new Promise((resolve, reject) => {
      const req = https.request({
        method: 'POST',
        ...options
      }, res => {
        const chunks = []
        res.on('data', data => chunks.push(data))
        res.on('end', () => {
          let body = Buffer.concat(chunks)
          switch (res.headers['content-type']) {
            case 'application/json':
              body = JSON.parse(body)
              break
          }
          resolve(body)
        })
      })
      req.on('error', reject)
      if (body) {
        req.write(body)
      }
      req.end()
    })
  }

  /*
  addFile (path) {
    const options = {
      method: 'POST',
      url: 'https://offcloud.com/torrent/upload' + `?key=${this.token}`,
      port: 443,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        file: fs.createReadStream(path),
        name: 'file',
        filename: path
      }
    }
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error)
        } else {
          if (typeof body !== 'undefined') {
            body = JSON.parse(body)
            if (body.success === true) {
              resolve(body)
            } else {
              reject(response)
            }
          } else if (response.statusCode === 200) {
            resolve()
          } else {
            reject(response)
          }
        }
      })
    })
  } */
  addFile2 (path) {
    const data = JSON.stringify({
      file: fs.createReadStream(path),
      name: 'file',
      filename: path
    })
    const options = {
      method: 'POST',
      url: 'https://offcloud.com/torrent/upload' + `?key=${this.token}`,
      port: 443,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Content-Length': data.length
      },
      // body: {
      FormData: {
        file: fs.createReadStream(path),
        name: 'file',
        filename: path
      }
    //  }
    }
    axios(options)
      .then(response => {
        console.log('logging response')
        console.log(response.data)
        resolve(JSON.parse(response.data))
      })
      .catch(error => {
        console.log(error, 'ERROR')
      })
  }

  addFile (path) {
    const form = new FormData()
    const stream = fs.createReadStream(path)

    form.append('file', stream)
    form.append('name', 'file')
    form.append('filename', path)

    const formHeaders = form.getHeaders()

    return new Promise((resolve, reject) => {
      axios.post('https://offcloud.com/torrent/upload' + `?key=${this.token}`, form, {
        headers: {
          ...formHeaders
        }
      })
        .then(response => {
          const data = response.data
          console.log(data)
          resolve(data)
        })
        .catch(error => {
          console.log('could not post ', path)
          reject(error)
        })
    })
    //      .then(response => console.log(response))
    //      .catch(error => reject(error))
    /*
    const options = {
      method: 'POST',
      url: 'https://offcloud.com/torrent/upload' + `?key=${this.token}`,
      port: 443,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        file: fs.createReadStream(path),
        name: 'file',
        filename: path
      }
    }
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        console.log(response)
        if (error) {
          reject(error)
        } else if (body) {
          if (typeof body !== 'undefined') {
            console.log(body)
            body = JSON.parse(body)
            if (body.success === true) {
              resolve(body)
            } else {
              reject(response)
            }
          } else if (response.statusCode === 200) {
            resolve()
          } else {
            reject(response)
          }
        }
      })
    }) */
  }

  addFileWORKING (path) { /* using request */
    const options = {
      method: 'POST',
      url: 'https://offcloud.com/torrent/upload' + `?key=${this.token}`,
      port: 443,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        file: fs.createReadStream(path),
        name: 'file',
        filename: path
      }
    }
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        console.log(response)
        if (error) {
          reject(error)
        } else if (body) {
          if (typeof body !== 'undefined') {
            console.log(body)
            body = JSON.parse(body)
            if (body.success === true) {
              resolve(body)
            } else {
              reject(response)
            }
          } else if (response.statusCode === 200) {
            resolve()
          } else {
            reject(response)
          }
        }
      })
    })
  }

  addTorrent (path) {
    const options = {
      method: 'POST',
      url: 'https://offcloud.com/torrent/upload' + `?key=${this.token}`,
      port: 443,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        file: fs.createReadStream(path),
        name: 'file',
        filename: path
      }
    }
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error)
        } else {
          if (typeof body !== 'undefined') {
            body = JSON.parse(body)
            if (body.success === true) {
              resolve(body)
            } else {
              reject(response)
            }
          } else if (response.statusCode === 200) {
            resolve()
          } else {
            reject(response)
          }
        }
      })
    })
  }

  addInstant (link) {
    debug('addInstant: ', link)
    return this._post('cloud', {
      formData: { url: link },
      jar: true,
      json: true,
      crossDomain: true, // enable this
      xhrFields: {
        withCredentials: true
      }
    })
  }

  addRemote (link) {
    debug('addRemote: ', link)
    return this._post('remote', {
      formData: { url: link },
      jar: true,
      json: true,
      crossDomain: true, // enable this
      xhrFields: {
        withCredentials: true
      }
    })
  }
}

module.exports = OffCloudAPI
