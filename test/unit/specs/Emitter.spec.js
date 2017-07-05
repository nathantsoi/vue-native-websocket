import Vue from 'vue'
import VueNativeSock from '@/Main'

describe("Emitter.js", () =>{

  before(() => {
    Vue.use(VueNativeSock, 'ws://localhost:9090', null)
  })

  it('contains spec with an expectation', () => {
    expect(true).to.be.ok
  })
})
