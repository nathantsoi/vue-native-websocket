export class Emitter<T = any> {
    private listeners;
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 添加事件监听
     * @param label 事件名称
     * @param callback 回调函数
     * @param vm this对象
     * @return {boolean}
     */
    addListener(label: T, callback: (...params: T[]) => void, vm: T): boolean {
        if (typeof callback === "function") {
            // label不存在就添加
            this.listeners.has(label) || this.listeners.set(label, []);
            // 向label添加回调函数
            this.listeners.get(label).push({ callback: callback, vm: vm });
            return true;
        }
        return false;
    }

    /**
     * 移除监听
     * @param label 事件名称
     * @param callback 回调函数
     * @param vm this对象
     * @return {boolean}
     */
    removeListener(label: T, callback: () => void, vm: T): boolean {
        // 从监听列表中获取当前事件
        const listeners = this.listeners.get(label);
        let index;

        if (listeners && listeners.length) {
            // 寻找当前事件在事件监听列表的位置
            index = listeners.reduce((i: any, listener: any, index: T) => {
                if (typeof listener.callback === "function" && listener.callback === callback && listener.vm === vm) {
                    i = index;
                }
                return i;
            }, -1);

            if (index > -1) {
                // 移除事件
                listeners.splice(index, 1);
                this.listeners.set(label, listeners);
                return true;
            }
        }
        return false;
    }

    /**
     * 触发监听
     * @param label 事件名称
     * @param args 参数
     * @return {boolean}
     */
    emit(label: string, ...args: T[]): boolean {
        // 获取事件列表中存储的事件
        const listeners = this.listeners.get(label);

        if (listeners && listeners.length) {
            listeners.forEach((listener: { callback: (...params: T[]) => void; vm: T }) => {
                // 扩展callback函数,让其拥有listener.vm中的方法
                listener.callback.call(listener.vm, ...args);
            });
            return true;
        }
        return false;
    }
}

export default new Emitter();
