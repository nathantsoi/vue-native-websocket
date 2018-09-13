import Vue from 'vue'
import Emitter from '@/Emitter'
import Observer from '@/Observer'

import { Server, WebSocket } from 'mock-socket'

describe('Observer.js', () => {
  let observer, mockServer

  let wsUrl = 'ws://localhost:8080'

  it('fires onopen event', (done) => {
    mockServer = new Server(wsUrl)
    mockServer.on('connection', ws => {
      ws.send('hi')
    })
    Vue.use(VueNativeSock, wsUrl)
    let vm = new Vue()
    observer = new Observer(wsUrl)
    Emitter.addListener('onopen', (data) => {
      expect(data.type).to.equal('open')
      mockServer.stop(done)
    }, vm)
  })

  it('fires onopen event skip scheme', (done) => {
    mockServer = new Server(wsUrl)
    mockServer.on('connection', ws => {
      ws.send('hi')
    })
    Vue.use(VueNativeSock, '//localhost:8080')
    let vm = new Vue()
    observer = new Observer(wsUrl)
    Emitter.addListener('onopen', (data) => {
      expect(data.type).to.equal('open')
      mockServer.stop(done)
    }, vm)
  })

  // TODO: DRY
  it('passes a json commit to the provided vuex store', (done) => {
    let expectedMsg = { mutation: 'setName', value: 'steve' }
    let mockStore = sinon.mock({ commit: () => {} })
    mockStore.expects('commit').withArgs('SOCKET_ONOPEN')
    mockStore.expects('commit').withArgs(expectedMsg.mutation)

    mockServer = new Server(wsUrl)
    mockServer.on('connection', ws => {
      ws.send(JSON.stringify(expectedMsg))
    })

    Vue.use(VueNativeSock, wsUrl)
    let vm = new Vue()
    observer = new Observer(wsUrl, {
      store: mockStore.object,
      format: 'json',
      websocket: new WebSocket(wsUrl)
    })

    setTimeout(() => {
      mockStore.verify()
      mockServer.stop(done)
    }, 100)
  })

  // TODO: DRY
  it('passes a json action to the provided vuex store', (done) => {
    let expectedMsg = { action: 'setName', value: 'steve' }
    let mockStore = sinon.mock({
      commit: () => {},
      dispatch: () => {}
    })
    mockStore.expects('dispatch').withArgs(expectedMsg.action, expectedMsg)

    mockServer = new Server(wsUrl)
    mockServer.on('connection', ws => {
      ws.send(JSON.stringify(expectedMsg))
    })

    Vue.use(VueNativeSock, wsUrl)
    let vm = new Vue()
    observer = new Observer(wsUrl, {
      store: mockStore.object,
      format: 'json',
      websocket: new WebSocket(wsUrl)
    })

    setTimeout(() => {
      mockStore.verify()
      mockServer.stop(done)
    }, 100)
  })

  // TODO: DRY
  it('passes a namespaced json commit to the provided vuex store', (done) => {
    let expectedMsg = { namespace: 'users', mutation: 'setName', value: 'steve' }
    let mockStore = sinon.mock({ commit: () => {} })
    mockStore.expects('commit').withArgs('SOCKET_ONOPEN')
    mockStore.expects('commit').withArgs(expectedMsg.namespace + '/' + expectedMsg.mutation)

    mockServer = new Server(wsUrl)
    mockServer.on('connection', ws => {
      ws.send(JSON.stringify(expectedMsg))
    })

    Vue.use(VueNativeSock, wsUrl)
    let vm = new Vue()
    observer = new Observer(wsUrl, {
      store: mockStore.object,
      format: 'json',
      websocket: new WebSocket(wsUrl)
    })

    setTimeout(() => {
      mockStore.verify()
      mockServer.stop(done)
    }, 100)
  })

  // TODO: DRY
  it('passes a namespaced json action to the provided vuex store', (done) => {
    let expectedMsg = { namespace: 'users', action: 'setName', value: 'steve' }
    let mockStore = sinon.mock({
        commit: () => {},
        dispatch: () => {}
    })
    mockStore.expects('dispatch').withArgs(expectedMsg.namespace + '/' + expectedMsg.action, expectedMsg)

    mockServer = new Server(wsUrl)
    mockServer.on('connection', ws => {
      ws.send(JSON.stringify(expectedMsg))
    })

    Vue.use(VueNativeSock, wsUrl)
    let vm = new Vue()
    observer = new Observer(wsUrl, {
      store: mockStore.object,
      format: 'json',
      websocket: new WebSocket(wsUrl)
    })

    setTimeout(() => {
      mockStore.verify()
      mockServer.stop(done)
    }, 100)
  })

  // TODO: DRY
  it('passes a custom commit name to the provided vuex store', (done) => {
    let expectedMsg = 'hello world'
    let mutations = {
      SOCKET_ONOPEN: '✅ Socket connected',
      SOCKET_ONMESSAGE: 'Websocket message received'
    }
    let mockStore = sinon.mock({ commit: () => {} })
    mockStore.expects('commit').withArgs(mutations.SOCKET_ONOPEN)
    mockStore.expects('commit').withArgs(mutations.SOCKET_ONMESSAGE)

    mockServer = new Server(wsUrl)
    mockServer.on('connection', ws => {
      ws.send(expectedMsg)
    })

    Vue.use(VueNativeSock, wsUrl)
    let vm = new Vue()
    observer = new Observer(wsUrl, {
      store: mockStore.object,
      mutations,
      websocket: new WebSocket(wsUrl)
    })

    setTimeout(() => {
      mockStore.verify()
      mockServer.stop(done)
    }, 100)
  })

  describe('reconnection feature', () => {
    let observer, mockServer, vm, mockStore
    let wsUrl = 'ws://localhost:8080'

    beforeEach(() => {
      mockServer = new Server(wsUrl)
      mockServer.on('connection', ws => ws.send('hi'))
      Vue.use(VueNativeSock, wsUrl)
      vm = new Vue()
      mockStore = sinon.mock({ commit: () => {} })

      observer = new Observer(wsUrl, {
        store: mockStore.object,
        reconnection: true,
        reconnectionAttempts: 2,
        WebSocket: new WebSocket(wsUrl),
      })
    })

    it('calls #reconnect() method', (done) => {
      sinon.spy(observer, 'reconnect');
      mockServer.close()

      expect(observer.reconnect).to.called
      mockServer.stop(done)
    })

    it('fires SOCKET_RECONNECT event', (done) => {
      sinon.spy(observer, 'passToStore');
      const clock = sinon.useFakeTimers()
      mockServer.close()
      clock.tick(1500);

      expect(observer.passToStore).to.have.been.calledWith('SOCKET_RECONNECT')
      mockServer.stop(done)
    })

    it('fires SOCKET_RECONNECT_ERROR event, after all attemps', (done) => {
      sinon.spy(observer, 'passToStore');
      observer.reconnectionCount = 2
      observer.reconnectionAttempts = 1
      mockServer.close()

      expect(observer.passToStore).to.have.been.calledWith('SOCKET_RECONNECT_ERROR')
      mockServer.stop(done)
    })
  })
})
