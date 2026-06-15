# vue-native-websocket

Native WebSocket client for Vue 3 with a plugin API, Composition API composable,
reactive connection state, JSON helpers, reconnect support, and store-agnostic
event hooks.

## Install

```bash
npm install vue-native-websocket
```

```bash
yarn add vue-native-websocket
```

## Vue 3 quick start

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createSocketPlugin } from 'vue-native-websocket'

createApp(App)
  .use(createSocketPlugin({
    url: 'ws://localhost:9090'
  }))
  .mount('#app')
```

Use the shared socket client from any component setup function:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useSocket } from 'vue-native-websocket'

const socket = useSocket()
const isConnected = computed(() => socket.status.value === 'open')

function sendPing () {
  socket.sendJson({ type: 'ping' })
}
</script>

<template>
  <button :disabled="!isConnected" @click="sendPing">
    Ping
  </button>
</template>
```

## Manual connections

```ts
import { createSocketPlugin } from 'vue-native-websocket'

app.use(createSocketPlugin({
  url: 'ws://localhost:9090',
  connectManually: true
}))
```

```ts
const socket = useSocket()

socket.connect()
socket.connect('ws://localhost:9090/alternative')
socket.disconnect()
```

For Options API components, the plugin also exposes global properties:

```ts
this.$connect()
this.$send('hello')
this.$sendJson({ hello: 'world' })
this.$disconnect()
```

## Reactive state

`useSocket()` returns a shared client with these refs:

```ts
const {
  socket,
  status,
  lastMessage,
  lastJsonMessage,
  error,
  reconnectAttempt
} = useSocket()
```

`status` is one of:

```ts
'idle' | 'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting' | 'error'
```

## Event hooks

Hooks can be configured when the plugin is installed:

```ts
app.use(createSocketPlugin({
  url: 'ws://localhost:9090',
  protocols: 'my-protocol',
  onOpen: event => {
    console.info('socket opened', event)
  },
  onMessage: (event, client, json) => {
    console.info('message', event.data, json)
  },
  onClose: event => {
    console.info('socket closed', event)
  },
  onError: event => {
    console.error('socket error', event)
  }
}))
```

Hooks can also be registered from a component. Each hook returns an unsubscribe
function.

```ts
import { onUnmounted } from 'vue'
import { useSocket } from 'vue-native-websocket'

const socket = useSocket()

const unsubscribe = socket.onMessage((event, client, json) => {
  console.log(event.data, json)
})

onUnmounted(unsubscribe)
```

## Reconnect

```ts
app.use(createSocketPlugin({
  url: 'ws://localhost:9090',
  reconnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 3000,
  onReconnect: attempt => {
    console.info('reconnecting', attempt)
  },
  onReconnectError: attempt => {
    console.error('reconnect failed after attempt', attempt)
  }
}))
```

The legacy option names `protocol`, `reconnection`, `reconnectionAttempts`, and
`reconnectionDelay` are accepted as aliases.

## Store integration

The library no longer commits directly to Vuex. Use hooks to connect the socket
to Pinia, Vuex, or any other store.

Pinia example:

```ts
import { useChatStore } from './stores/chat'

const chat = useChatStore()

app.use(createSocketPlugin({
  url: 'ws://localhost:9090',
  onOpen: () => chat.setConnected(true),
  onClose: () => chat.setConnected(false),
  onMessage: (event, client, json) => {
    chat.receive(json ?? event.data)
  }
}))
```

Vuex example:

```ts
app.use(createSocketPlugin({
  url: 'ws://localhost:9090',
  onOpen: event => store.commit('SOCKET_ONOPEN', event),
  onClose: event => store.commit('SOCKET_ONCLOSE', event),
  onError: event => store.commit('SOCKET_ONERROR', event),
  onMessage: (event, client, json) => {
    store.commit('SOCKET_ONMESSAGE', json ?? event)
  }
}))
```

## Build from source

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

The package is built with Vite library mode and publishes ESM, CJS, UMD, and
TypeScript declaration outputs.

## Example app

A Vite + Vue 3 consumer example lives in `examples/vue3-vite`. It connects to
the public `wss://echo.websocket.org` test endpoint, so `Send ping` should echo
the same JSON payload back into the event log.

```bash
npm --prefix examples/vue3-vite install
npm --prefix examples/vue3-vite run dev
npm --prefix examples/vue3-vite run typecheck
npm --prefix examples/vue3-vite run build
```

## Breaking changes in v3

- Vue 2 is no longer supported.
- `Vue.use(...)` is replaced by `app.use(createSocketPlugin(...))`.
- Vuex automatic `commit`/`dispatch` handling has been removed.
- Dynamic `this.$options.sockets` listeners have been removed.
- TypeScript is now the source of truth and generated declarations are included
  in the package.

## License

MIT
