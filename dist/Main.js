import Observer from "./Observer";
import Emitter from "./Emitter";
export default {
    install(app, connection, opts = { format: "" }) {
        // 没有传入连接，抛出异常
        if (!connection) {
            throw new Error("[vue-native-socket] cannot locate connection");
        }
        let observer;
        opts.$setInstance = (wsInstance) => {
            // 全局属性添加$socket
            app.config.globalProperties.$socket = wsInstance;
        };
        // 配置选项中启用手动连接
        if (opts.connectManually) {
            app.config.globalProperties.$connect = (connectionUrl = connection, connectionOpts = opts) => {
                // 调用者传入的参数中添加set实例
                connectionOpts.$setInstance = opts.$setInstance;
                // 创建Observer建立websocket连接
                observer = new Observer(connectionUrl, connectionOpts);
                // 全局添加$socket
                app.config.globalProperties.$socket = observer.WebSocket;
            };
            // 全局添加连接断开处理函数
            app.config.globalProperties.$disconnect = () => {
                if (observer && observer.reconnection) {
                    // 重新连接状态改为false
                    observer.reconnection = false;
                }
                // 如果全局属性socket存在则从全局属性移除
                if (app.config.globalProperties.$socket) {
                    // 关闭连接
                    app.config.globalProperties.$socket.close();
                    delete app.config.globalProperties.$socket;
                }
            };
        }
        else {
            // 未启用手动连接
            observer = new Observer(connection, opts);
            // 全局添加$socket属性，连接至websocket服务器
            app.config.globalProperties.$socket = observer.WebSocket;
        }
        const hasProxy = typeof Proxy !== "undefined" && typeof Proxy === "function" && /native code/.test(Proxy.toString());
        app.mixin({
            created() {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const vm = this;
                const sockets = this.$options["sockets"];
                if (hasProxy) {
                    this.$options.sockets = new Proxy({}, {
                        set(target, key, value) {
                            // 添加监听
                            Emitter.addListener(key, value, vm);
                            target[key] = value;
                            return true;
                        },
                        deleteProperty(target, key) {
                            // 移除监听
                            Emitter.removeListener(key, vm.$options.sockets[key], vm);
                            delete target.key;
                            return true;
                        }
                    });
                    if (sockets) {
                        Object.keys(sockets).forEach((key) => {
                            // 给$options中添加sockets中的key
                            this.$options.sockets[key] = sockets[key];
                        });
                    }
                }
                else {
                    // 将对象密封，不能再进行改变
                    Object.seal(this.$options.sockets);
                    if (sockets) {
                        Object.keys(sockets).forEach((key) => {
                            // 添加监听
                            Emitter.addListener(key, sockets[key], vm);
                        });
                    }
                }
            },
            beforeUnmount() {
                if (hasProxy) {
                    const sockets = this.$options["sockets"];
                    if (sockets) {
                        Object.keys(sockets).forEach((key) => {
                            // 销毁前如果代理存在sockets存在则移除$options中给sockets添加过的key
                            delete this.$options.sockets[key];
                        });
                    }
                }
            }
        });
    }
};
//# sourceMappingURL=Main.js.map