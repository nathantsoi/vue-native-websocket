export declare class Emitter<T = any> {
    private listeners;
    constructor();
    /**
     * 添加事件监听
     * @param label 事件名称
     * @param callback 回调函数
     * @param vm this对象
     * @return {boolean}
     */
    addListener(label: T, callback: (...params: T[]) => void, vm: T): boolean;
    /**
     * 移除监听
     * @param label 事件名称
     * @param callback 回调函数
     * @param vm this对象
     * @return {boolean}
     */
    removeListener(label: T, callback: () => void, vm: T): boolean;
    /**
     * 触发监听
     * @param label 事件名称
     * @param args 参数
     * @return {boolean}
     */
    emit(label: string, ...args: T[]): boolean;
}
declare const _default: Emitter<any>;
export default _default;
