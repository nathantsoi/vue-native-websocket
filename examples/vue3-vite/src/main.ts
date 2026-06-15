import { computed, createApp, defineComponent, h, onUnmounted, reactive } from 'vue'
import { createSocketPlugin, useSocket } from 'vue-native-websocket'
import './style.css'

const messages = reactive<string[]>([])
const ECHO_SOCKET_URL = 'wss://echo.websocket.org'

const socketPlugin = createSocketPlugin({
  url: ECHO_SOCKET_URL,
  connectManually: true,
  reconnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  onOpen: () => {
    messages.unshift(`Connected to ${ECHO_SOCKET_URL}`)
  },
  onClose: () => {
    messages.unshift('Disconnected')
  },
  onReconnect: attempt => {
    messages.unshift(`Reconnect attempt ${attempt}`)
  },
  onReconnectError: () => {
    messages.unshift('Reconnect failed')
  },
  onMessage: (event, client, json) => {
    messages.unshift(JSON.stringify(json ?? event.data))
  }
})

const App = defineComponent({
  setup () {
    const socket = useSocket()
    const canSend = computed(() => socket.status.value === 'open')
    const unsubscribeError = socket.onError(() => {
      messages.unshift('Socket error')
    })

    onUnmounted(unsubscribeError)

    return () => h('main', { class: 'shell' }, [
      h('section', { class: 'panel' }, [
        h('div', { class: 'header' }, [
          h('div', [
            h('h1', 'Vue Native WebSocket'),
            h('p', 'Vue 3 + Vite echo client')
          ]),
          h('span', { class: ['status', socket.status.value] }, socket.status.value)
        ]),
        h('div', { class: 'actions' }, [
          h('button', { onClick: () => socket.connect() }, 'Connect'),
          h('button', { onClick: () => socket.disconnect() }, 'Disconnect'),
          h('button', {
            disabled: !canSend.value,
            onClick: () => socket.sendJson({ type: 'ping', sentAt: new Date().toISOString() })
          }, 'Send ping')
        ]),
        h('dl', { class: 'metrics' }, [
          h('div', [
            h('dt', 'Endpoint'),
            h('dd', ECHO_SOCKET_URL)
          ]),
          h('div', [
            h('dt', 'Reconnect attempt'),
            h('dd', socket.reconnectAttempt.value)
          ]),
          h('div', [
            h('dt', 'Last JSON'),
            h('dd', JSON.stringify(socket.lastJsonMessage.value ?? null))
          ])
        ])
      ]),
      h('section', { class: 'log' }, [
        h('h2', 'Events'),
        messages.length
          ? h('ol', messages.slice(0, 8).map(message => h('li', message)))
          : h('p', 'No socket events yet.')
      ])
    ])
  }
})

createApp(App)
  .use(socketPlugin)
  .mount('#app')
