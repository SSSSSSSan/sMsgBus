/**
 * 测试模块B - 事件通信模块
 * 专门用于测试消息总线通信
 * 提供事件发布/订阅功能
 */

// 模块内部状态
const moduleState = {
  name: 'ModuleB',
  version: '1.0.0',
  loaded: false,
  eventCount: 0,
  subscribers: new Map(),
  lastEvent: null
};

// 初始化模块
function initialize() {
  moduleState.loaded = true;
  moduleState.initializedAt = new Date().toISOString();
  
  // 触发模块初始化事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.initialized', {
      module: 'ModuleB',
      state: { 
        ...moduleState,
        subscribers: Array.from(moduleState.subscribers.keys())
      },
      timestamp: moduleState.initializedAt
    });
  }
  
  console.log(`[ModuleB] 事件通信模块初始化完成 at ${moduleState.initializedAt}`);
  return moduleState;
}

// 订阅事件
function subscribe(eventName, callback) {
  if (!moduleState.subscribers.has(eventName)) {
    moduleState.subscribers.set(eventName, []);
  }
  
  moduleState.subscribers.get(eventName).push(callback);
  
  // 触发订阅事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.event.subscribed', {
      module: 'ModuleB',
      event: eventName,
      callback: callback.name || 'anonymous',
      totalSubscribers: moduleState.subscribers.get(eventName).length
    });
  }
  
  console.log(`[ModuleB] 订阅事件: ${eventName}, 当前订阅者: ${moduleState.subscribers.get(eventName).length}`);
  
  // 返回取消订阅函数
  return () => {
    const subscribers = moduleState.subscribers.get(eventName);
    if (subscribers) {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
        console.log(`[ModuleB] 取消订阅事件: ${eventName}`);
      }
    }
  };
}

// 发布事件
function publish(eventName, data) {
  moduleState.eventCount++;
  moduleState.lastEvent = {
    name: eventName,
    data,
    timestamp: new Date().toISOString()
  };
  
  // 触发模块内部事件
  const subscribers = moduleState.subscribers.get(eventName);
  if (subscribers && subscribers.length > 0) {
    subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[ModuleB] 事件 ${eventName} 回调错误:`, error);
      }
    });
  }
  
  // 触发全局事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.event.published', {
      module: 'ModuleB',
      event: eventName,
      data,
      eventCount: moduleState.eventCount,
      subscriberCount: subscribers ? subscribers.length : 0,
      timestamp: moduleState.lastEvent.timestamp
    });
  }
  
  console.log(`[ModuleB] 发布事件: ${eventName}, 数据:`, data, `, 总事件数: ${moduleState.eventCount}`);
  return moduleState.eventCount;
}

// 广播消息到所有模块
function broadcast(message, type = 'info') {
  const eventData = {
    from: 'ModuleB',
    message,
    type,
    timestamp: new Date().toISOString()
  };
  
  // 触发广播事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.broadcast', eventData);
  }
  
  // 同时发布内部事件
  publish('broadcast', eventData);
  
  console.log(`[ModuleB] 广播消息: ${message} (${type})`);
  return eventData;
}

// 请求-响应模式
function request(action, params = {}) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const requestData = {
    requestId,
    action,
    params,
    from: 'ModuleB',
    timestamp: new Date().toISOString()
  };
  
  // 触发请求事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.request', requestData);
  }
  
  console.log(`[ModuleB] 发送请求: ${action}, ID: ${requestId}`);
  
  // 返回一个Promise，等待响应
  return new Promise((resolve) => {
    // 设置响应监听
    const responseEvent = `response.${requestId}`;
    
    if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
      const unsubscribe = globalThis.sMsgBus.on(responseEvent, (response) => {
        resolve(response);
        unsubscribe();
      });
      
      // 设置超时
      setTimeout(() => {
        resolve({
          requestId,
          action,
          status: 'timeout',
          message: '请求超时',
          timestamp: new Date().toISOString()
        });
      }, 5000);
    } else {
      // 如果没有消息总线，立即返回模拟响应
      setTimeout(() => {
        resolve({
          requestId,
          action,
          status: 'success',
          result: `模拟响应 for ${action}`,
          timestamp: new Date().toISOString()
        });
      }, 100);
    }
  });
}

// 获取模块状态
function getState() {
  return {
    ...moduleState,
    subscribers: Array.from(moduleState.subscribers.entries()).map(([event, callbacks]) => ({
      event,
      callbackCount: callbacks.length
    }))
  };
}

// 重置模块状态
function reset() {
  const oldState = { ...moduleState };
  moduleState.eventCount = 0;
  moduleState.subscribers.clear();
  moduleState.lastEvent = null;
  
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.reset', {
      module: 'ModuleB',
      oldState: {
        ...oldState,
        subscribers: Array.from(oldState.subscribers.keys())
      },
      newState: { ...moduleState },
      timestamp: new Date().toISOString()
    });
  }
  
  console.log('[ModuleB] 事件通信模块状态已重置');
  return moduleState;
}

// 模块导出对象
const ModuleB = {
  // 基本信息
  name: moduleState.name,
  version: moduleState.version,
  
  // 事件功能
  subscribe,
  publish,
  broadcast,
  request,
  
  // 状态管理
  initialize,
  getState,
  reset,
  
  // 工具函数
  describe() {
    return `${this.name} v${this.version} - 事件通信模块`;
  },
  
  // 快捷方法
  on: subscribe,
  emit: publish
};

// 自动初始化
initialize();

// 根据环境导出模块
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS 环境
  module.exports = ModuleB;
} else if (typeof define === 'function' && define.amd) {
  // AMD 环境
  define([], function() {
    return ModuleB;
  });
} else if (typeof exports !== 'undefined') {
  // ES Module 或 CommonJS
  exports.default = ModuleB;
  exports.ModuleB = ModuleB;
} else {
  // 浏览器全局环境
  if (typeof window !== 'undefined') {
    window.ModuleB = ModuleB;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.ModuleB = ModuleB;
  }
}

// ES Module 导出
export default ModuleB;
export { subscribe, publish, broadcast, request, initialize, getState, reset };