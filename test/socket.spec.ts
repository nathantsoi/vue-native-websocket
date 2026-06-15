import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import {
  createSocketClient,
  createSocketPlugin,
  useSocket,
  type SocketClient,
  type WebSocketConstructor
} from '../src'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readonly url: string
  readonly protocols?: string | string[]
  sent: unknown[] = []
  readyState = FakeWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor (url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
    FakeWebSocket.instances.push(this)
  }

  send (data: unknown): void {
    this.sent.push(data)
  }

  close (): void {
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  }

  open (): void {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  message (data: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data }))
  }

  error (): void {
    this.onerror?.(new Event('error'))
  }

  serverClose (): void {
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  }
}

const webSocket = FakeWebSocket as unknown as WebSocketConstructor

describe('vue-native-websocket', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    vi.useRealTimers()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('installs a Vue 3 plugin and exposes the injected client', () => {
    let injectedClient: SocketClient | undefined

    const Root = defineComponent({
      setup () {
        injectedClient = useSocket()
        return () => null
      }
    })

    const plugin = createSocketPlugin({
      url: 'ws://localhost:8080',
      webSocket
    })

    const app = createApp(Root)
    app.use(plugin)
    app.mount(document.createElement('div'))

    expect(injectedClient).toBe(plugin.client)
    expect(plugin.client.status.value).toBe('connecting')
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('registers global properties for manual connection flows', () => {
    const Root = defineComponent({
      render: () => null
    })

    const app = createApp(Root)
    app.use(createSocketPlugin({
      url: 'ws://localhost:8080',
      connectManually: true,
      webSocket
    }))
    const globalProperties = app.config.globalProperties as {
      $socket: WebSocket | null
      $connect: SocketClient['connect']
      $disconnect: SocketClient['disconnect']
    }

    expect(globalProperties.$socket).toBeNull()

    globalProperties.$connect()
    const socket = FakeWebSocket.instances[0]

    expect(globalProperties.$socket).toBe(socket)

    globalProperties.$disconnect()

    expect(globalProperties.$socket).toBeNull()
  })

  it('sends raw and JSON payloads after the socket opens', () => {
    const client = createSocketClient({
      url: 'ws://localhost:8080',
      protocol: 'chat',
      webSocket
    })

    client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.open()

    client.send('hello')
    client.sendJson({ type: 'ping' })

    expect(socket.sent).toEqual([
      'hello',
      JSON.stringify({ type: 'ping' })
    ])
    expect(socket.protocols).toBe('chat')
  })

  it('emits lifecycle hooks and stores the last parsed JSON message', () => {
    const onOpen = vi.fn()
    const onMessage = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()
    const client = createSocketClient({
      url: 'ws://localhost:8080',
      webSocket,
      onOpen,
      onMessage,
      onError,
      onClose
    })

    client.connect()
    const socket = FakeWebSocket.instances[0]

    socket.open()
    socket.message(JSON.stringify({ ok: true }))
    socket.error()
    socket.serverClose()

    expect(onOpen).toHaveBeenCalledOnce()
    expect(onMessage).toHaveBeenCalledWith(expect.any(MessageEvent), client, { ok: true })
    expect(client.lastJsonMessage.value).toEqual({ ok: true })
    expect(onError).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('sets lastJsonMessage to null for invalid JSON messages', () => {
    const client = createSocketClient({
      url: 'ws://localhost:8080',
      webSocket
    })

    client.connect()
    FakeWebSocket.instances[0].message('{')

    expect(client.lastMessage.value?.data).toBe('{')
    expect(client.lastJsonMessage.value).toBeNull()
  })

  it('reconnects until the configured attempt limit is reached', () => {
    vi.useFakeTimers()
    const onReconnect = vi.fn()
    const onReconnectError = vi.fn()
    const client = createSocketClient({
      url: 'ws://localhost:8080',
      webSocket,
      reconnect: true,
      reconnectAttempts: 1,
      reconnectDelay: 100,
      onReconnect,
      onReconnectError
    })

    client.connect()
    FakeWebSocket.instances[0].serverClose()

    expect(client.status.value).toBe('reconnecting')
    expect(client.reconnectAttempt.value).toBe(1)
    expect(onReconnect).toHaveBeenCalledWith(1, client)

    vi.advanceTimersByTime(100)

    expect(FakeWebSocket.instances).toHaveLength(2)

    FakeWebSocket.instances[1].serverClose()

    expect(onReconnectError).toHaveBeenCalledWith(1, client)
  })

  it('does not reconnect after an explicit disconnect', () => {
    vi.useFakeTimers()
    const onReconnect = vi.fn()
    const client = createSocketClient({
      url: 'ws://localhost:8080',
      webSocket,
      reconnect: true,
      reconnectDelay: 100,
      onReconnect
    })

    client.connect()
    client.disconnect()
    vi.advanceTimersByTime(100)

    expect(onReconnect).not.toHaveBeenCalled()
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('resolves protocol-relative URLs', () => {
    const originalLocation = window.location

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        protocol: 'https:'
      }
    })

    const client = createSocketClient({
      url: '//localhost:8080',
      webSocket
    })

    client.connect()

    expect(FakeWebSocket.instances[0].url).toBe('wss://localhost:8080')

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    })
  })
})
