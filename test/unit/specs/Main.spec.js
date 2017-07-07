import Vue from 'vue'
import VueNativeSock from '@/Main'

import { Server } from 'mock-socket'

describe("Main.js", () =>{

  let mockServer

  it ('can be bound to the onopen event', (done) => {
    mockServer = new Server('ws://localhost:8080')
    Vue.use(VueNativeSock, 'ws://localhost:8080')
    let vm = new Vue()
    vm.$options.sockets.onopen = (data) => {
      expect(data.type).to.equal('open')
      mockServer.stop(done)
    }
  })

})

