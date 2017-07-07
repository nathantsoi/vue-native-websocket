import Vue from 'vue'

// bring in the Emitter class, not the singleton
let EmitterClass = require('exports-loader?Emitter!@/Emitter')

describe ("Emitter.js", () => {

  let vm = new Vue()
  let Emitter

  beforeEach (() => {
    Emitter = new EmitterClass()
  })

  it ('registers an handler', () => {
    expect(Emitter.listeners.size).to.equal(0)
    Emitter.addListener('[event_type]', (value) => {}, vm)
    expect(Emitter.listeners.size).to.equal(1)
  })

  it ('unregisters a registered handler', () => {
    let event_type = 'atype', cb = (value) => {}
    should.not.exist(Emitter.listeners.get(event_type))
    Emitter.addListener(event_type, cb, vm)
    expect(Emitter.listeners.get(event_type).length).to.equal(1)
    Emitter.removeListener(event_type, cb, vm)
    expect(Emitter.listeners.get(event_type).length).to.equal(0)
  })

  it ('fires an events', (done) => {
    let event_type = 'syn', expected_response = 'ack'
    expect(Emitter.listeners.size).to.equal(0)
    Emitter.addListener(event_type, (value) => {
      expect(value).to.equal(expected_response)
      done()
    }, vm)
    expect(Emitter.listeners.size).to.equal(1)
    Emitter.emit(event_type, expected_response)
  })

})
