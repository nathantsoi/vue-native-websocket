import Observer from './Observer'
import Emitter from './Emitter'

export default {

  install (Vue, connection, opts = {}) {
    if (!connection && !opts.connectManually) { throw new Error('[vue-native-socket] cannot locate connection') }

    let observer = null

    let isVue3 = false
    const version = Number(Vue.version.split('.')[0])
    if (version >= 3) {
      isVue3 = true
    }
    const globalPrototype = isVue3 ? Vue.config.globalProperties : Vue.prototype

    opts.$setInstance = (wsInstance) => {
      globalPrototype.$socket = wsInstance
    }

    if (opts.connectManually) {
      globalPrototype.$connect = (connectionUrl = connection, connectionOpts = opts) => {
        connectionOpts.$setInstance = opts.$setInstance
        observer = new Observer(connectionUrl, connectionOpts)
        globalPrototype.$socket = observer.WebSocket
      }

      globalPrototype.$disconnect = () => {
        if (observer && observer.reconnection) {
          observer.reconnection = false
          clearTimeout(observer.reconnectTimeoutId)
        }
        if (globalPrototype.$socket) {
          globalPrototype.$socket.close()
          delete globalPrototype.$socket
        }
      }
    } else {
      observer = new Observer(connection, opts)
      globalPrototype.$socket = observer.WebSocket
    }
    const hasProxy = typeof Proxy !== 'undefined' && typeof Proxy === 'function' && /native code/.test(Proxy.toString())

    Vue.mixin({
      created () {
        const vm = this
        const sockets = this.$options.sockets

        if (hasProxy) {
          this.$options.sockets = new Proxy({}, {
            set (target, key, value) {
              Emitter.addListener(key, value, vm)
              target[key] = value
              return true
            },
            deleteProperty (target, key) {
              Emitter.removeListener(key, vm.$options.sockets[key], vm)
              delete target.key
              return true
            }
          })
          if (sockets) {
            Object.keys(sockets).forEach((key) => {
              this.$options.sockets[key] = sockets[key]
            })
          }
        } else {
          Object.seal(this.$options.sockets)

          // if !hasProxy need addListener
          if (sockets) {
            Object.keys(sockets).forEach(key => {
              Emitter.addListener(key, sockets[key], vm)
            })
          }
        }
      },
      [isVue3 ? 'beforeUnmount' : 'beforeDestroy'] () {
        if (hasProxy) {
          const sockets = this.$options.sockets

          if (sockets) {
            Object.keys(sockets).forEach((key) => {
              delete this.$options.sockets[key]
            })
          }
        }
      }
    })
  }
}
