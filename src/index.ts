import {
  inject,
  type App,
  type InjectionKey,
  type Plugin,
  type Ref,
  shallowRef,
  ref
} from 'vue'

export type SocketStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'closing'
  | 'closed'
  | 'reconnecting'
  | 'error'

export interface WebSocketConstructor {
  new (url: string, protocols?: string | string[]): WebSocket
}

export type WebSocketData = Parameters<WebSocket['send']>[0]
export type SocketEventHook<TEvent extends Event> = (event: TEvent, client: SocketClient) => void
export type SocketMessageHook = (
  event: MessageEvent,
  client: SocketClient,
  json: unknown | null
) => void
export type SocketReconnectHook = (attempt: number, client: SocketClient) => void

export interface SocketClientOptions {
  url?: string
  protocol?: string | string[]
  protocols?: string | string[]
  webSocket?: WebSocketConstructor
  reconnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
  onOpen?: SocketEventHook<Event>
  onClose?: SocketEventHook<CloseEvent>
  onError?: SocketEventHook<Event>
  onMessage?: SocketMessageHook
  onReconnect?: SocketReconnectHook
  onReconnectError?: SocketReconnectHook
}

export interface SocketPluginOptions extends SocketClientOptions {
  connectManually?: boolean
}

export interface SocketClient {
  socket: Ref<WebSocket | null>
  status: Ref<SocketStatus>
  lastMessage: Ref<MessageEvent | null>
  lastJsonMessage: Ref<unknown | null>
  error: Ref<Event | null>
  reconnectAttempt: Ref<number>
  connect: (url?: string, options?: Partial<SocketClientOptions>) => WebSocket
  disconnect: (code?: number, reason?: string) => void
  send: (data: WebSocketData) => void
  sendJson: (data: unknown) => void
  onOpen: (callback: SocketEventHook<Event>) => () => void
  onClose: (callback: SocketEventHook<CloseEvent>) => () => void
  onError: (callback: SocketEventHook<Event>) => () => void
  onMessage: (callback: SocketMessageHook) => () => void
  onReconnect: (callback: SocketReconnectHook) => () => void
  onReconnectError: (callback: SocketReconnectHook) => () => void
}

interface HookRegistry {
  open: Set<SocketEventHook<Event>>
  close: Set<SocketEventHook<CloseEvent>>
  error: Set<SocketEventHook<Event>>
  message: Set<SocketMessageHook>
  reconnect: Set<SocketReconnectHook>
  reconnectError: Set<SocketReconnectHook>
}

const SOCKET_CONNECTING = 0
const SOCKET_OPEN = 1
const SOCKET_CLOSED = 3

export const socketInjectionKey: InjectionKey<SocketClient> = Symbol('VueNativeWebSocket')

export class NativeSocketClient implements SocketClient {
  readonly socket = shallowRef<WebSocket | null>(null)
  readonly status = ref<SocketStatus>('idle')
  readonly lastMessage = shallowRef<MessageEvent | null>(null)
  readonly lastJsonMessage = shallowRef<unknown | null>(null)
  readonly error = shallowRef<Event | null>(null)
  readonly reconnectAttempt = ref(0)

  private options: SocketClientOptions
  private url?: string
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private manuallyClosed = false
  private hooks: HookRegistry = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
    message: new Set(),
    reconnect: new Set(),
    reconnectError: new Set()
  }

  constructor (options: SocketClientOptions = {}) {
    this.options = { ...options }
    this.url = options.url

    if (options.onOpen) this.onOpen(options.onOpen)
    if (options.onClose) this.onClose(options.onClose)
    if (options.onError) this.onError(options.onError)
    if (options.onMessage) this.onMessage(options.onMessage)
    if (options.onReconnect) this.onReconnect(options.onReconnect)
    if (options.onReconnectError) this.onReconnectError(options.onReconnectError)
  }

  connect (url?: string, options: Partial<SocketClientOptions> = {}): WebSocket {
    this.options = { ...this.options, ...options }
    this.url = url ?? options.url ?? this.url ?? this.options.url

    if (!this.url) {
      throw new Error('[vue-native-websocket] cannot connect without a url')
    }

    this.clearReconnectTimer()

    if (this.socket.value && this.socket.value.readyState !== SOCKET_CLOSED) {
      this.disconnect()
    }

    this.manuallyClosed = false
    this.status.value = 'connecting'

    const SocketConstructor = this.getWebSocketConstructor()
    const resolvedUrl = resolveSocketUrl(this.url)
    const protocols = this.options.protocols ?? this.options.protocol
    const socket = protocols
      ? new SocketConstructor(resolvedUrl, protocols)
      : new SocketConstructor(resolvedUrl)

    this.socket.value = socket
    this.bindEvents(socket)

    return socket
  }

  disconnect (code?: number, reason?: string): void {
    this.manuallyClosed = true
    this.clearReconnectTimer()

    const socket = this.socket.value
    if (!socket) {
      this.status.value = 'closed'
      return
    }

    if (socket.readyState === SOCKET_OPEN || socket.readyState === SOCKET_CONNECTING) {
      this.status.value = 'closing'
      socket.close(code, reason)
    } else {
      this.status.value = 'closed'
    }

    this.socket.value = null
  }

  send (data: WebSocketData): void {
    const socket = this.socket.value
    if (!socket || socket.readyState !== SOCKET_OPEN) {
      throw new Error('[vue-native-websocket] cannot send before the socket is open')
    }

    socket.send(data)
  }

  sendJson (data: unknown): void {
    this.send(JSON.stringify(data))
  }

  onOpen (callback: SocketEventHook<Event>): () => void {
    return this.subscribe(this.hooks.open, callback)
  }

  onClose (callback: SocketEventHook<CloseEvent>): () => void {
    return this.subscribe(this.hooks.close, callback)
  }

  onError (callback: SocketEventHook<Event>): () => void {
    return this.subscribe(this.hooks.error, callback)
  }

  onMessage (callback: SocketMessageHook): () => void {
    return this.subscribe(this.hooks.message, callback)
  }

  onReconnect (callback: SocketReconnectHook): () => void {
    return this.subscribe(this.hooks.reconnect, callback)
  }

  onReconnectError (callback: SocketReconnectHook): () => void {
    return this.subscribe(this.hooks.reconnectError, callback)
  }

  private bindEvents (socket: WebSocket): void {
    socket.onopen = event => {
      this.status.value = 'open'
      this.error.value = null
      this.reconnectAttempt.value = 0
      this.emit(this.hooks.open, event)
    }

    socket.onmessage = event => {
      this.lastMessage.value = event
      const json = parseJson(event.data)
      this.lastJsonMessage.value = json.ok ? json.value : null
      this.emitMessage(event, this.lastJsonMessage.value)
    }

    socket.onerror = event => {
      this.status.value = 'error'
      this.error.value = event
      this.emit(this.hooks.error, event)
    }

    socket.onclose = event => {
      if (this.socket.value === socket) {
        this.socket.value = null
      }

      this.status.value = 'closed'
      this.emit(this.hooks.close, event)

      if (!this.manuallyClosed && this.shouldReconnect()) {
        this.scheduleReconnect()
      }
    }
  }

  private scheduleReconnect (): void {
    const attempt = this.reconnectAttempt.value + 1
    const maxAttempts = this.getReconnectAttempts()

    if (attempt > maxAttempts) {
      this.emitReconnect(this.hooks.reconnectError, this.reconnectAttempt.value)
      return
    }

    this.reconnectAttempt.value = attempt
    this.status.value = 'reconnecting'
    this.emitReconnect(this.hooks.reconnect, attempt)

    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.url)
    }, this.getReconnectDelay())
  }

  private shouldReconnect (): boolean {
    return Boolean(this.options.reconnect ?? this.options.reconnection)
  }

  private getReconnectAttempts (): number {
    return this.options.reconnectAttempts ?? this.options.reconnectionAttempts ?? Infinity
  }

  private getReconnectDelay (): number {
    return this.options.reconnectDelay ?? this.options.reconnectionDelay ?? 1000
  }

  private clearReconnectTimer (): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private getWebSocketConstructor (): WebSocketConstructor {
    const SocketConstructor = this.options.webSocket ?? globalThis.WebSocket

    if (!SocketConstructor) {
      throw new Error('[vue-native-websocket] WebSocket is not available')
    }

    return SocketConstructor
  }

  private subscribe<TCallback> (set: Set<TCallback>, callback: TCallback): () => void {
    set.add(callback)
    return () => {
      set.delete(callback)
    }
  }

  private emit<TEvent extends Event> (set: Set<SocketEventHook<TEvent>>, event: TEvent): void {
    set.forEach(callback => callback(event, this))
  }

  private emitMessage (event: MessageEvent, json: unknown | null): void {
    this.hooks.message.forEach(callback => callback(event, this, json))
  }

  private emitReconnect (set: Set<SocketReconnectHook>, attempt: number): void {
    set.forEach(callback => callback(attempt, this))
  }
}

export type NativeSocketPlugin = Plugin & {
  client: SocketClient
}

export function createSocketClient (options: SocketClientOptions = {}): SocketClient {
  return new NativeSocketClient(options)
}

export function createSocketPlugin (options: SocketPluginOptions = {}): NativeSocketPlugin {
  const client = createSocketClient(options)

  return {
    client,
    install (app: App) {
      if (!options.connectManually && !options.url) {
        throw new Error('[vue-native-websocket] cannot install without a url')
      }

      app.provide(socketInjectionKey, client)
      registerGlobalProperties(app, client)

      if (!options.connectManually) {
        client.connect(options.url)
      }
    }
  } satisfies NativeSocketPlugin
}

export function useSocket (): SocketClient {
  const client = inject(socketInjectionKey)

  if (!client) {
    throw new Error('[vue-native-websocket] useSocket must be called after installing the plugin')
  }

  return client
}

function registerGlobalProperties (app: App, client: SocketClient): void {
  Object.defineProperties(app.config.globalProperties, {
    $socket: {
      configurable: true,
      get: () => client.socket.value
    },
    $connect: {
      configurable: true,
      value: client.connect.bind(client)
    },
    $disconnect: {
      configurable: true,
      value: client.disconnect.bind(client)
    },
    $send: {
      configurable: true,
      value: client.send.bind(client)
    },
    $sendJson: {
      configurable: true,
      value: client.sendJson.bind(client)
    }
  })
}

function resolveSocketUrl (url: string): string {
  if (!url.startsWith('//')) {
    return url
  }

  const protocol = globalThis.location?.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}${url}`
}

function parseJson (data: unknown): { ok: true, value: unknown } | { ok: false } {
  if (typeof data !== 'string') {
    return { ok: false }
  }

  try {
    return { ok: true, value: JSON.parse(data) }
  } catch {
    return { ok: false }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $socket: WebSocket | null
    $connect: SocketClient['connect']
    $disconnect: SocketClient['disconnect']
    $send: SocketClient['send']
    $sendJson: SocketClient['sendJson']
  }
}

export default createSocketPlugin
