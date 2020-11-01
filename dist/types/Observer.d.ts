import { websocketOpts } from "src/pluginsType";
export default class {
    private readonly format;
    private readonly connectionUrl;
    private readonly opts;
    reconnection: boolean;
    private readonly reconnectionAttempts;
    private readonly reconnectionDelay;
    private reconnectTimeoutId;
    private reconnectionCount;
    private readonly passToStoreHandler;
    private readonly store;
    private readonly mutations;
    WebSocket: WebSocket | undefined;
    /**
     * 观察者模式, websocket服务核心功能封装
     * @param connectionUrl 连接的url
     * @param opts 其它配置项
     */
    constructor(connectionUrl: string, opts?: websocketOpts);
    connect(connectionUrl: string, opts?: websocketOpts): WebSocket;
    reconnect(): void;
    onEvent(): void;
    /**
     * 触发vuex中的方法
     * @param eventName 事件名称
     * @param event 事件
     */
    passToStore(eventName: string, event: any): void;
    /**
     * 默认的事件处理函数
     * @param eventName 事件名称
     * @param event 事件
     */
    defaultPassToStore(eventName: string, event: {
        data: string;
        mutation: string;
        namespace: string;
        action: string;
    }): void;
}
declare global {
    interface WebSocket {
        sendObj(obj: JSON): void;
    }
}
