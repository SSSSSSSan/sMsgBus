/**
 * 测试模块A - 基础功能模块 (ES Module 版本)
 * 提供简单的数学计算和问候功能
 * 用于测试模块加载和基本功能调用
 */

// 模块内部状态
const moduleState = {
  name: 'ModuleA',
  version: '1.0.0',
  loaded: false,
  callCount: 0,
  lastOperation: null
};

// 初始化模块
function initialize() {
  moduleState.loaded = true;
  moduleState.initializedAt = new Date().toISOString();
  
  // 触发模块初始化事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.initialized', {
      module: 'ModuleA',
      state: { ...moduleState },
      timestamp: moduleState.initializedAt
    });
  }
  
  console.log(`[ModuleA] 模块初始化完成 at ${moduleState.initializedAt}`);
  return moduleState;
}

// 基础功能：问候
function greet(name = 'World') {
  moduleState.callCount++;
  moduleState.lastOperation = 'greet';
  
  const message = `Hello, ${name}! From ModuleA`;
  
  // 触发功能调用事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.function.called', {
      module: 'ModuleA',
      function: 'greet',
      args: { name },
      result: message,
      callCount: moduleState.callCount
    });
  }
  
  console.log(`[ModuleA] greet called: ${message}`);
  return message;
}

// 基础功能：数学计算
function add(a, b) {
  moduleState.callCount++;
  moduleState.lastOperation = 'add';
  
  const result = a + b;
  
  // 触发计算完成事件
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.calculation.complete', {
      module: 'ModuleA',
      operation: 'add',
      args: { a, b },
      result: result,
      callCount: moduleState.callCount
    });
  }
  
  console.log(`[ModuleA] add called: ${a} + ${b} = ${result}`);
  return result;
}

function multiply(a, b) {
  moduleState.callCount++;
  moduleState.lastOperation = 'multiply';
  
  const result = a * b;
  
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.calculation.complete', {
      module: 'ModuleA',
      operation: 'multiply',
      args: { a, b },
      result: result,
      callCount: moduleState.callCount
    });
  }
  
  console.log(`[ModuleA] multiply called: ${a} * ${b} = ${result}`);
  return result;
}

// 获取模块状态
function getState() {
  return { ...moduleState };
}

// 重置模块状态
function reset() {
  const oldState = { ...moduleState };
  moduleState.callCount = 0;
  moduleState.lastOperation = null;
  
  if (typeof globalThis !== 'undefined' && globalThis.sMsgBus) {
    globalThis.sMsgBus.emit('module.reset', {
      module: 'ModuleA',
      oldState,
      newState: { ...moduleState },
      timestamp: new Date().toISOString()
    });
  }
  
  console.log('[ModuleA] 模块状态已重置');
  return moduleState;
}

// 模块导出对象
const ModuleA = {
  // 基本信息
  name: moduleState.name,
  version: moduleState.version,
  
  // 功能函数
  greet,
  add,
  multiply,
  
  // 状态管理
  initialize,
  getState,
  reset,
  
  // 工具函数
  describe() {
    return `${this.name} v${this.version} - 基础功能模块`;
  }
};

// 自动初始化
initialize();

// ES Module 导出
export default ModuleA;
export { ModuleA };