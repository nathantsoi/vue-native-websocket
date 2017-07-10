import Emitter from './Emitter'

export default class {
  constructor (connectionUrl, opts = {}) {
    this.format = opts.format && opts.format.toLowerCase()
    this.connect(connectionUrl, opts)
    if (opts.store) { this.store = opts.store }
    this.onEvent()
  }

  connect (connectionUrl, opts = {}) {
    let protocol = opts.protocol || ''
    this.WebSocket = opts.WebSocket || (protocol === '' ? new WebSocket(connectionUrl) : new WebSocket(connectionUrl, protocol))
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
    let method = 'commit'
    let target = eventName.toUpperCase()
    let msg = event
    if (this.format === 'json' && event.data) {
      msg = JSON.parse(event.data)
      target = [msg.namespace || '', msg.mutation].filter((e) => !!e).join('/')
      if (msg.action) {
        method = 'dispatch'
        target = msg.action
      }
    }
    this.store[method](target, msg)
  }
}
