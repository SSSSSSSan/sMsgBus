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
        this._triggers = new Map();
    }   

    // 订阅广播事件
    listen(type, callback) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }
        if (typeof callback !== 'function') {
            throw new Error('回调函数必须是函数类型');
        }

        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }
        this._listeners.get(type).push(callback);
        return this;
    }
    // 发布广播事件
    emit(type, data) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        const callbacks = this._listeners.get(type);
        if (!callbacks || callbacks.length === 0) {
            return this;
        }

        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`执行广播事件 ${type} 的回调时出错:`, error);
            }
        });

        return this;
    }

    // 移除广播事件
    removeListening(type, callback) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }
        if (typeof callback !== 'function') {
            throw new Error('回调函数必须是函数类型');
        }

        const callbacks = this._listeners.get(type);
        if (!callbacks) {
            return this;
        }

        const filteredCallbacks = callbacks.filter(cb => cb !== callback);
        if (filteredCallbacks.length === 0) {
            this._listeners.delete(type);
        } else {
            this._listeners.set(type, filteredCallbacks);
        }

        return this;
    }

    // 移除所有广播事件
    _removeAllListening() {
        this._listeners.clear();
        return this;
    }

    // 注册单播事件
    register(type, callback) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }
        if (typeof callback !== 'function') {
            throw new Error('回调函数必须是函数类型');
        }

        this._triggers.set(type, callback);
        return this;
    }
    // 触发单播事件（异步，无返回）
    trigger(type, data) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        const callback = this._triggers.get(type);
        if (!callback) {
            return this;
        }

        // 异步执行
        setTimeout(() => {
            try {
                callback(data);
            } catch (error) {
                console.error(`执行单播事件 ${type} 的回调时出错:`, error);
            }
        }, 0);

        return this;
    }
    // 触发单播事件（同步，有返回）
    triggerSync(type, data) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        const callback = this._triggers.get(type);
        if (!callback) {
            return undefined;
        }

        try {
            return callback(data);
        } catch (error) {
            console.error(`执行单播事件 ${type} 的回调时出错:`, error);
            throw error;
        }
    }
    // 移除单播事件
    removeTrigger(type, callback) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('事件类型必须是非空字符串');
        }

        if (callback && typeof callback !== 'function') {
            throw new Error('回调函数必须是函数类型');
        }

        const registeredCallback = this._triggers.get(type);
        if (!registeredCallback) {
            return this;
        }

        // 如果没有指定 callback 或者指定的 callback 与注册的一致，则删除
        if (!callback || registeredCallback === callback) {
            this._triggers.delete(type);
        }

        return this;
    }
    // 移除所有单播事件
    _removeAllTrigger() {
        this._triggers.clear();
        return this;
    }

}

// ES模块导出
export default sMsgBus;
