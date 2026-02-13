/**
 * 测试模块C - 异步功能模块
 * 测试异步加载和通信
 * 提供延迟执行、Promise操作等异步功能
 */

// 模块内部状态
const moduleState = {
  name: 'ModuleC',
  version: '1.0.0',
  loaded: false,
  asyncOperations: 0,
  pendingOperations: new Map(),
  completedOperations: [],
  lastAsyncResult: null
};

// 初始化模块（异步）
async function initialize() {
  return new Promise((resolve) => {
    setTimeout(() => {
      moduleState.loaded = true;
      moduleState.initializedAt = new Date().toISOString();
      
      // 触发模块初始化事件
      if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
        globalThis.sMsgBus.emit('module.initialized', {
          module: 'ModuleC',
          state: { ...moduleState },
          timestamp: moduleState.initializedAt,
          async: true
        });
      }
      
      console.log(`[ModuleC] 异步模块初始化完成 at ${moduleState.initializedAt}`);
      resolve(moduleState);
    }, 100); // 模拟异步初始化
  });
}

// 异步延迟执行
function delay(ms, value = null) {
  const operationId = `delay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  moduleState.asyncOperations++;
  
  // 记录待处理操作
  moduleState.pendingOperations.set(operationId, {
    type: 'delay',
    ms,
    startedAt: new Date().toISOString(),
    status: 'pending'
  });
  
  // 触发操作开始事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.async.started', {
      module: 'ModuleC',
      operationId,
      type: 'delay',
      ms,
      asyncOperations: moduleState.asyncOperations
    });
  }
  
  console.log(`[ModuleC] 开始延迟操作: ${ms}ms, ID: ${operationId}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = value !== null ? value : `延迟 ${ms}ms 完成`;
      
      // 更新操作状态
      moduleState.pendingOperations.delete(operationId);
      moduleState.completedOperations.push({
        operationId,
        type: 'delay',
        ms,
        result,
        completedAt: new Date().toISOString(),
        duration: ms
      });
      
      moduleState.lastAsyncResult = {
        operationId,
        type: 'delay',
        result,
        timestamp: new Date().toISOString()
      };
      
      // 触发操作完成事件
      if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
        globalThis.sMsgBus.emit('module.async.completed', {
          module: 'ModuleC',
          operationId,
          type: 'delay',
          result,
          asyncOperations: moduleState.asyncOperations,
          completedOperations: moduleState.completedOperations.length
        });
      }
      
      console.log(`[ModuleC] 延迟操作完成: ${operationId}, 结果: ${result}`);
      resolve(result);
    }, ms);
  });
}

// 异步数据处理
async function processData(data, processor) {
  const operationId = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  moduleState.asyncOperations++;
  
  moduleState.pendingOperations.set(operationId, {
    type: 'processData',
    dataType: typeof data,
    startedAt: new Date().toISOString(),
    status: 'processing'
  });
  
  // 触发处理开始事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.async.started', {
      module: 'ModuleC',
      operationId,
      type: 'processData',
      dataType: typeof data,
      asyncOperations: moduleState.asyncOperations
    });
  }
  
  console.log(`[ModuleC] 开始数据处理: ${operationId}`);
  
  try {
    // 模拟异步处理
    const result = await new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const processed = processor ? processor(data) : `处理后的数据: ${JSON.stringify(data)}`;
          resolve(processed);
        } catch (error) {
          reject(error);
        }
      }, 200);
    });
    
    // 更新操作状态
    moduleState.pendingOperations.delete(operationId);
    moduleState.completedOperations.push({
      operationId,
      type: 'processData',
      result,
      completedAt: new Date().toISOString()
    });
    
    moduleState.lastAsyncResult = {
      operationId,
      type: 'processData',
      result,
      timestamp: new Date().toISOString()
    };
    
    // 触发处理完成事件
    if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
      globalThis.sMsgBus.emit('module.async.completed', {
        module: 'ModuleC',
        operationId,
        type: 'processData',
        result,
        asyncOperations: moduleState.asyncOperations,
        completedOperations: moduleState.completedOperations.length
      });
    }
    
    console.log(`[ModuleC] 数据处理完成: ${operationId}`);
    return result;
  } catch (error) {
    // 触发错误事件
    if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
      globalThis.sMsgBus.emit('module.async.error', {
        module: 'ModuleC',
        operationId,
        type: 'processData',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.error(`[ModuleC] 数据处理错误: ${operationId}`, error);
    throw error;
  }
}

// 批量异步操作
async function batchProcess(items, concurrency = 3) {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 触发批量开始事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.batch.started', {
      module: 'ModuleC',
      batchId,
      itemCount: items.length,
      concurrency,
      timestamp: new Date().toISOString()
    });
  }
  
  console.log(`[ModuleC] 开始批量处理: ${batchId}, 项目数: ${items.length}, 并发数: ${concurrency}`);
  
  const results = [];
  const batches = [];
  
  // 分批处理
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    batches.push(batch);
  }
  
  // 处理每个批次
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchPromises = batch.map((item, itemIndex) => 
      processData(item, (data) => `处理: ${data} (批次${batchIndex + 1}, 项目${itemIndex + 1})`)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 触发批次完成事件
    if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
      globalThis.sMsgBus.emit('module.batch.progress', {
        module: 'ModuleC',
        batchId,
        batchIndex: batchIndex + 1,
        totalBatches: batches.length,
        completedItems: results.length,
        totalItems: items.length,
        progress: Math.round((results.length / items.length) * 100)
      });
    }
    
    console.log(`[ModuleC] 批次 ${batchIndex + 1}/${batches.length} 完成`);
  }
  
  // 触发批量完成事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.batch.completed', {
      module: 'ModuleC',
      batchId,
      totalItems: items.length,
      results,
      timestamp: new Date().toISOString()
    });
  }
  
  console.log(`[ModuleC] 批量处理完成: ${batchId}, 总结果数: ${results.length}`);
  return results;
}

// 获取模块状态
function getState() {
  return {
    ...moduleState,
    pendingOperations: Array.from(moduleState.pendingOperations.entries()).map(([id, op]) => ({
      id,
      ...op
    })),
    completedOperations: moduleState.completedOperations.slice(-10) // 最近10个操作
  };
}

// 重置模块状态
async function reset() {
  const oldState = { ...moduleState };
  
  // 等待所有待处理操作完成
  const pendingIds = Array.from(moduleState.pendingOperations.keys());
  if (pendingIds.length > 0) {
    console.log(`[ModuleC] 等待 ${pendingIds.length} 个待处理操作完成...`);
    await delay(100); // 给一点时间让操作完成
  }
  
  moduleState.asyncOperations = 0;
  moduleState.pendingOperations.clear();
  moduleState.completedOperations = [];
  moduleState.lastAsyncResult = null;
  
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.reset', {
      module: 'ModuleC',
      oldState: {
        ...oldState,
        pendingOperations: pendingIds.length,
        completedOperations: oldState.completedOperations.length
      },
      newState: { ...moduleState },
      timestamp: new Date().toISOString(),
      async: true
    });
  }
  
  console.log('[ModuleC] 异步模块状态已重置');
  return moduleState;
}

// 模块导出对象
const ModuleC = {
  // 基本信息
  name: moduleState.name,
  version: moduleState.version,
  
  // 异步功能
  delay,
  processData,
  batchProcess,
  
  // 状态管理
  initialize,
  getState,
  reset,
  
  // 工具函数
  describe() {
    return `${this.name} v${this.version} - 异步功能模块`;
  },
  
  // 状态检查
  isReady() {
    return moduleState.loaded;
  },
  
  // 统计信息
  getStats() {
    return {
      totalAsyncOperations: moduleState.asyncOperations,
      pendingOperations: moduleState.pendingOperations.size,
      completedOperations: moduleState.completedOperations.length,
      lastResult: moduleState.lastAsyncResult
    };
  }
};

// 异步初始化
initialize().then(() => {
  console.log('[ModuleC] 模块初始化完成');
});

// 根据环境导出模块
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS 环境
  module.exports = ModuleC;
} else if (typeof define === 'function' && define.amd) {
  // AMD 环境
  define([], function() {
    return ModuleC;
  });
} else if (typeof exports !== 'undefined') {
  // ES Module 或 CommonJS
  exports.default = ModuleC;
  exports.ModuleC = ModuleC;
} else {
  // 浏览器全局环境
  if (typeof window !== 'undefined') {
    window.ModuleC = ModuleC;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.ModuleC = ModuleC;
  }
}

// ES Module 导出
export default ModuleC;
export { delay, processData, batchProcess, initialize, getState, reset };