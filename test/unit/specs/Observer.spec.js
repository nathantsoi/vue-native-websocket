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
})
