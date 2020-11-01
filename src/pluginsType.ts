// 插件内用到的类型进行统一定义

// 传输数据时的处理函数类型定义
export type storeHandler<T = any> = (
    eventName: string,
    event: {
        data: string;
        mutation: string;
        namespace: string;
        action: string;
    },
    opts?: T
) => void;

// 插件调用者可以传的参数类型定义
export type websocketOpts<T = any> = {
    format: string;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    connectManually?: boolean;
    passToStoreHandler?: storeHandler;
    store?: T;
    mutations?: T;
    protocol?: string;
    WebSocket?: WebSocket;
    $setInstance?: (event: EventTarget) => void;
};
