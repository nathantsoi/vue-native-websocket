# vue-native-websocket

native websocket implementation for Vuejs 2 and Vuex

## Install

``` bash
yarn add vue-native-websocket

# or

npm install vue-native-websocket --save
```

## Usage

#### Configuration

Automatic socket connection from an URL string

``` js
import VueNativeSock from 'vue-native-websocket'
Vue.use(VueNativeSock, 'ws://localhost:9090')
```

Enable Vuex integration, where `'./store'` is your local apps store:

``` js
import store from './store'
Vue.use(VueNativeSock, 'ws://localhost:9090', { store: store })
```

Set sub-protocol, this is optional option and default is empty string.

``` js
import VueNativeSock from 'vue-native-websocket'
Vue.use(VueNativeSock, 'ws://localhost:9090', { protocol: 'my-protocol' })
```


Optionally enable JSON message passing:

``` js
Vue.use(VueNativeSock, 'ws://localhost:9090', { format: 'json' })
```

JSON message passing with a store:

``` js
import store from './store'
Vue.use(VueNativeSock, 'ws://localhost:9090', { store: store, format: 'json' })
```

Enable ws reconnect automatically:

``` js
Vue.use(VueNativeSock, 'ws://localhost:9090', { 
  reconnection: true, // (Boolean) whether to reconnect automatically (false)
  reconnectionAttempts: 5, // (Number) number of reconnection attempts before giving up (Infinity),
  reconnectionDelay: 3000, // (Number) how long to initially wait before attempting a new (1000)
})
```

#### On Vuejs instance usage

``` js
var vm = new Vue({
  methods: {
    clickButton: function(val) {
        // $socket is [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) instance
        this.$socket.send('some data')
        // or with {format: 'json'} enabled
        this.$socket.sendObj({awesome: 'data'})
    }
  }
})
```

#### Dynamic socket event listeners

Create a new listener, for example:

``` js
this.$options.sockets.onmessage = (data) => console.log(data)
```

Remove existing listener

``` js
delete this.$options.sockets.onmessage
```

#### Vuex Store integration

Vuex integration works differently depending on if you've enabled a format

##### Without a format enabled

Socket events will commit mutations on the root store corresponding to the following events

`SOCKET_ONOPEN`

`SOCKET_ONCLOSE`

`SOCKET_ONERROR`

`SOCKET_ONMESSAGE`

Each callback is passed the raw websocket event object

Update state in the open, close and error callbacks. You can also check the socket state directly with the `this.$socket` object on the main Vue object.

Handle all the data in the `SOCKET_ONMESSAGE` mutation.

Reconect events will commit mutations `SOCKET_RECONNECT` and `SOCKET_RECONNECT_ERROR`.

``` js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false,
    }
  },
  mutations:{
    SOCKET_ONOPEN (state, event)  {
      state.socket.isConnected = true
    },
    SOCKET_ONCLOSE (state, event)  {
      state.socket.isConnected = false
    },
    SOCKET_ONERROR (state, event)  {
      console.error(state, event)
    },
    // default handler called for all methods
    SOCKET_ONMESSAGE (state, message)  {
      state.message = message
    },
    // mutations for reconnect methods
    [ws.WS_RECONNECT](state, count) {
      console.info(state, count)
    },
    [ws.WS_RECONNECT_ERROR](state) {
      state.socket.reconnectError = true;
    },
  }
})
```

##### With `format: 'json'` enabled

All data passed through the websocket is expected to be JSON.

Each message is `JSON.parse`d if there is a data (content) response.

If there is no data, the fallback `SOCKET_ON*` mutation is called with the original event data, as above.

If there is a `.namespace` on the data, the message is sent to this `namespaced: true` store (be sure to turn this on in the store module).

If there is a `.mutation` value in the response data, the corresponding mutation is called with the name `SOCKET_[mutation value]`

If there is an `.action` value in the response data ie. `action: 'customerAdded'`, the corresponding action is called by name:

``` js
actions: {
    customerAdded (context) {
      console.log('action received: customerAdded')
    }
  }
```

Use the `.sendObj({some: data})` method on the `$socket` object to send stringified json messages.

## Examples

TODO: post your example here!

## Credits

Derived from https://github.com/MetinSeylan/Vue-Socket.io
