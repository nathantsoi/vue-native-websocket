import Emitter from './Emitter'

export default class {
  constructor (connectionUrl, store, opts = {}) {
    this.format = opts.format && opts.format.toLowerCase()
    this.connect(connectionUrl)
    if (store) { this.store = store }
    this.onEvent()
  }

  connect (connectionUrl) {
    this.WebSocket = new WebSocket(connectionUrl)
    if (this.format === 'json') {
      if (!('sendObj' in this.WebSocket)) {
        this.WebSocket.sendObj = (obj) => this.WebSocket.send(JSON.stringify(obj))
      }
    }
  }

  onEvent () {
    ['onmessage', 'onclose', 'onerror', 'onopen'].forEach((eventType) => {
      this.WebSocket[eventType] = (event) => {
        Emitter.emit(eventType, event)
        if (this.store) { this.passToStore('SOCKET_' + eventType, event) }
      }
    })
  }

  passToStore (eventName, event) {
    if (!eventName.startsWith('SOCKET_')) { return }
    if (this.format === 'json' && event.data) {
      let msg = JSON.parse(event.data)
      let target = msg.namespace || ''
      if (msg.mutation) {
        this.store.commit([target, msg.mutation].join('/'), msg)
      }
      if (msg.action) {
        this.store.dispatch([target, msg.action].join('/'), msg)
      }
    } else {
      // default mutation
      this.store.commit(eventName.toUpperCase(), event)
    }
  }
}
