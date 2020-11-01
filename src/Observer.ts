import Emitter from "./Emitter";
import { websocketOpts } from "src/pluginsType";

export default class {
    private readonly format: string; // 数据传输格式
    private readonly connectionUrl: string; // 连接url
    private readonly opts: websocketOpts; // 调用者可以传入的自定义参数
    public reconnection: boolean; // 是否开启重连
    private readonly reconnectionAttempts: number; // 最大重连次数
    private readonly reconnectionDelay: number; // 重连间隔时间
    private reconnectTimeoutId = 0; // 重连超时id
    private reconnectionCount = 0; // 已重连次数
    private readonly passToStoreHandler; // 传输数据时的处理函数
    private readonly store; // 启用vuex时传入vuex的store
    private readonly mutations; // 启用vuex时传入vuex中的mutations
    public WebSocket: WebSocket | undefined; // websocket连接
    /**
     * 观察者模式, websocket服务核心功能封装
     * @param connectionUrl 连接的url
     * @param opts 其它配置项
     */
    constructor(connectionUrl: string, opts: websocketOpts = { format: "" }) {
        // 获取参数中的format并将其转成小写
        this.format = opts.format && opts.format.toLowerCase();

        // 如果url以//开始对其进行处理添加正确的websocket协议前缀
        if (connectionUrl.startsWith("//")) {
            // 当前网站如果为https请求则添加wss前缀否则添加ws前缀
            const scheme = window.location.protocol === "https:" ? "wss" : "ws";
            connectionUrl = `${scheme}:${connectionUrl}`;
        }
        // 将处理好的url和opts赋值给当前类内部变量
        this.connectionUrl = connectionUrl;
        this.opts = opts;
        this.reconnection = this.opts.reconnection || false;
        this.reconnectionAttempts = this.opts.reconnectionAttempts || Infinity;
        this.reconnectionDelay = this.opts.reconnectionDelay || 1000;
        this.passToStoreHandler = this.opts.passToStoreHandler;

        // 建立连接
        this.connect(connectionUrl, opts);

        // 如果配置参数中有传store就将store赋值
        if (opts.store) {
            this.store = opts.store;
        }
        // 如果配置参数中有传vuex的同步处理函数就将mutations赋值
        if (opts.mutations) {
            this.mutations = opts.mutations;
        }
        // 事件触发
        this.onEvent();
    }

    // 连接websocket
    connect(connectionUrl: string, opts: websocketOpts = { format: "" }): WebSocket {
        // 获取配置参数传入的协议
        const protocol = opts.protocol || "";
        // 如果没传协议就建立一个正常的websocket连接否则就创建带协议的websocket连接
        this.WebSocket = <WebSocket>opts.WebSocket || (protocol === "" ? new WebSocket(connectionUrl) : new WebSocket(connectionUrl, protocol));
        // 启用json发送
        if (this.format === "json") {
            // 如果websocket中没有senObj就添加这个方法对象
            if (!("sendObj" in (this.WebSocket as WebSocket))) {
                // 将发送的消息转为json字符串
                (this.WebSocket as WebSocket).sendObj = (obj: JSON) => (this.WebSocket as WebSocket).send(JSON.stringify(obj));
            }
        }
        return this.WebSocket;
    }
    // 重新连接
    reconnect(): void {
        // 已重连次数小于等于设置的连接次数时执行重连
        if (this.reconnectionCount <= this.reconnectionAttempts) {
            this.reconnectionCount++;
            // 清理上一次重连时的定时器
            clearTimeout(this.reconnectTimeoutId);
            // 开始重连
            this.reconnectTimeoutId = setTimeout(() => {
                // 如果启用vuex就触发vuex中的重连方法
                if (this.store) {
                    this.passToStore("SOCKET_RECONNECT", this.reconnectionCount);
                }
                // 重新连接
                this.connect(this.connectionUrl, this.opts);
                // 触发WebSocket事件
                this.onEvent();
            }, this.reconnectionDelay);
        } else {
            // 如果启用vuex则触发重连失败方法
            if (this.store) {
                this.passToStore("SOCKET_RECONNECT_ERROR", true);
            }
        }
    }

    // 事件分发
    onEvent(): void {
        ["onmessage", "onclose", "onerror", "onopen"].forEach((eventType: string) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (this.WebSocket as WebSocket)[eventType] = (event) => {
                Emitter.emit(eventType, event);

                // 调用vuex中对应的方法
                if (this.store) {
                    this.passToStore("SOCKET_" + eventType, event);
                }

                // 处于重新连接状态切事件为onopen时执行
                if (this.reconnection && eventType === "onopen") {
                    // 设置实例
                    this.opts.$setInstance && this.opts.$setInstance(event.currentTarget);
                    // 清空重连次数
                    this.reconnectionCount = 0;
                }

                // 如果处于重连状态且事件为onclose时调用重连方法
                if (this.reconnection && eventType === "onclose") {
                    this.reconnect();
                }
            };
        });
    }

    /**
     * 触发vuex中的方法
     * @param eventName 事件名称
     * @param event 事件
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    passToStore(eventName: string, event: any): void {
        // 如果参数中有传事件处理函数则执行自定义的事件处理函数，否则执行默认的处理函数
        if (this.passToStoreHandler) {
            this.passToStoreHandler(eventName, event, this.defaultPassToStore.bind(this));
        } else {
            this.defaultPassToStore(eventName, event);
        }
    }

    /**
     * 默认的事件处理函数
     * @param eventName 事件名称
     * @param event 事件
     */
    defaultPassToStore(
        eventName: string,
        event: {
            data: string;
            mutation: string;
            namespace: string;
            action: string;
        }
    ): void {
        // 事件名称开头不是SOCKET_则终止函数
        if (!eventName.startsWith("SOCKET_")) {
            return;
        }
        let method = "commit";
        // 事件名称字母转大写
        let target = eventName.toUpperCase();
        // 消息内容
        let msg = event;
        // data存在且数据为json格式
        if (this.format === "json" && event.data) {
            // 将data从json字符串转为json对象
            msg = JSON.parse(event.data);
            // 判断msg是同步还是异步
            if (msg.mutation) {
                target = [msg.namespace || "", msg.mutation].filter((e: string) => !!e).join("/");
            } else if (msg.action) {
                method = "dispatch";
                target = [msg.namespace || "", msg.action].filter((e: string) => !!e).join("/");
            }
        }
        if (this.mutations) {
            target = this.mutations[target] || target;
        }
        // 触发storm中的方法
        this.store[method](target, msg);
    }
}

// 扩展全局对象
declare global {
    // 扩展websocket对象，添加sendObj方法
    interface WebSocket {
        sendObj(obj: JSON): void;
    }
}
