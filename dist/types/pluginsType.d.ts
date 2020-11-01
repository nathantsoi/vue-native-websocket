export declare type storeHandler<T = any> = (eventName: string, event: {
    data: string;
    mutation: string;
    namespace: string;
    action: string;
}, opts?: T) => void;
export declare type websocketOpts<T = any> = {
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
