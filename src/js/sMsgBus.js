/**
 * 一个提供广播处理
 * 定向访问的类
 */

class sMsgBus {
    constructor() {
        if (sMsgBus.instance) return sMsgBus.instance;
        sMsgBus.instance = this;

        this._init();
        return this;
    }

    _init() {
        this._listeners = new Map();
        this._calls = new Map();
    }   

    // 订阅广播事件
    on(type, callback, thisArg = null) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }
        if (typeof callback !== 'function') {
            throw new Error('回调函数必须是函数类型');
        }

        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }
        this._listeners.get(type).push({ callback, thisArg });
        return this;
    }
    // 发布广播事件
    emit(type, data) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        const listeners = this._listeners.get(type);
        if (!listeners || listeners.length === 0) {
            return this;
        }

        listeners.forEach(({ callback, thisArg }) => {
            try {
                callback.call(thisArg, data);
            } catch (error) {
                console.error(`执行广播事件 ${type} 的回调时出错:`, error);
            }
        });

        return this;
    }

    // 移除广播事件
    off(type, callback, thisArg = null) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }
        if (typeof callback !== 'function') {
            throw new Error('回调函数必须是函数类型');
        }

        const listeners = this._listeners.get(type);
        if (!listeners) {
            return this;
        }

        // 过滤掉匹配callback和thisArg的监听器
        const filteredListeners = listeners.filter(
            ({ callback: cb, thisArg: ta }) => !(cb === callback && ta === thisArg)
        );
        
        if (filteredListeners.length === 0) {
            this._listeners.delete(type);
        } else {
            this._listeners.set(type, filteredListeners);
        }

        return this;
    }

    // 移除所有广播事件
    _clearOn() {
        this._listeners.clear();
        return this;
    }

    // 注册调用事件
    onCall(type, callback, thisArg = null) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }
        if (typeof callback !== 'function') {
            throw new Error('回调函数必须是函数类型');
        }

        // 检查是否已注册，避免覆盖
        if (this._calls.has(type)) {
            console.warn(`调用事件 ${type} 已注册，跳过重复注册`);
            return this; // 返回this保持链式调用
        }

        this._calls.set(type, { callback, thisArg });
        return this;
    }
    // 调用事件（异步，返回Promise）
    call(type, data) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        const callInfo = this._calls.get(type);
        if (!callInfo) {
            // 如果事件未注册，返回一个立即解析的Promise
            return Promise.resolve(undefined);
        }

        const { callback, thisArg } = callInfo;

        // 返回Promise以支持异步结果
        return new Promise((resolve, reject) => {
            // 使用setTimeout确保异步执行
            setTimeout(() => {
                try {
                    const result = callback.call(thisArg, data);
                    // 如果回调返回Promise，等待它
                    if (result && typeof result.then === 'function') {
                        result.then(resolve).catch(error => {
                            console.error(`执行调用事件 ${type} 的回调时出错:`, error);
                            reject(error);
                        });
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    console.error(`执行调用事件 ${type} 的回调时出错:`, error);
                    reject(error);
                }
            }, 0);
        });
    }
    // 调用事件（同步，有返回）
    callSync(type, data) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        const callInfo = this._calls.get(type);
        if (!callInfo) {
            return undefined;
        }

        const { callback, thisArg } = callInfo;

        try {
            return callback.call(thisArg, data);
        } catch (error) {
            console.error(`执行调用事件 ${type} 的回调时出错:`, error);
            throw error;
        }
    }
    // 移除调用事件
    offCall(type, callback, thisArg = null) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        if (callback && typeof callback !== 'function') {
            throw new Error('回调函数必须是函数类型');
        }

        const callInfo = this._calls.get(type);
        if (!callInfo) {
            return this;
        }

        const { callback: registeredCallback, thisArg: registeredThisArg } = callInfo;

        // 如果没有指定 callback 或者指定的 callback 与注册的一致，则删除
        // 同时检查thisArg是否匹配
        if (!callback || (registeredCallback === callback && registeredThisArg === thisArg)) {
            this._calls.delete(type);
        }

        return this;
    }
    // 移除所有调用事件
    _clearCall() {
        this._calls.clear();
        return this;
    }

    // 检查事件类型是否被注册
    check(type) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        const listeners = this._listeners.get(type);
        return {
            on: listeners ? listeners.length : 0,  // 返回监听者数量，0表示没有监听者
            call: this._calls.has(type)  // 返回布尔值，是否已注册调用事件
        };
    }

}

// ES模块导出
export default sMsgBus;
