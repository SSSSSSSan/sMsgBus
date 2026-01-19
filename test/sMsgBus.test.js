import sMsgBus from '../src/js/sMsgBus.js';

describe('sMsgBus 功能测试', () => {
  let bus;

  beforeEach(() => {
    // 每次测试前创建新的实例
    // 由于是单例模式，我们需要清除实例
    if (sMsgBus.instance) {
      sMsgBus.instance._listeners.clear();
      sMsgBus.instance._calls.clear();
    }
    bus = new sMsgBus();
  });

  describe('单例模式测试', () => {
    test('应该是单例模式', () => {
      const instance1 = new sMsgBus();
      const instance2 = new sMsgBus();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(sMsgBus);
    });

    test('应该具有内部 Map 属性', () => {
      expect(bus._listeners).toBeInstanceOf(Map);
      expect(bus._calls).toBeInstanceOf(Map);
    });
  });

  describe('广播事件功能测试', () => {
    test('on 应该正确订阅事件', () => {
      const callback = jest.fn();
      bus.on('test.event', callback);
      
      expect(bus._listeners.has('test.event')).toBe(true);
      const listeners = bus._listeners.get('test.event');
      expect(listeners).toHaveLength(1);
      expect(listeners[0].callback).toBe(callback);
      expect(listeners[0].thisArg).toBe(null);
    });

    test('on 应该支持链式调用', () => {
      const callback = jest.fn();
      const result = bus.on('test.event', callback);
      
      expect(result).toBe(bus);
    });

    test('on 应该验证参数类型', () => {
      expect(() => bus.on('', jest.fn())).toThrow('事件类型必须是非空字符串');
      expect(() => bus.on('test', null)).toThrow('回调函数必须是函数类型');
    });

    test('emit 应该触发所有监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const testData = { message: 'test' };
      
      bus.on('test.event', callback1);
      bus.on('test.event', callback2);
      bus.emit('test.event', testData);
      
      expect(callback1).toHaveBeenCalledWith(testData);
      expect(callback2).toHaveBeenCalledWith(testData);
    });

    test('emit 应该支持链式调用', () => {
      const callback = jest.fn();
      bus.on('test.event', callback);
      const result = bus.emit('test.event', {});
      
      expect(result).toBe(bus);
    });

    test('emit 应该处理没有监听器的情况', () => {
      expect(() => bus.emit('nonexistent.event', {})).not.toThrow();
    });

    test('off 应该移除特定监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      bus.on('test.event', callback1);
      bus.on('test.event', callback2);
      bus.off('test.event', callback1);
      
      const listeners = bus._listeners.get('test.event');
      expect(listeners).toHaveLength(1);
      expect(listeners[0].callback).toBe(callback2);
    });

    test('off 应该支持链式调用', () => {
      const callback = jest.fn();
      bus.on('test.event', callback);
      const result = bus.off('test.event', callback);
      
      expect(result).toBe(bus);
    });

    test('_clearOn 应该清除所有广播监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      bus.on('event1', callback1);
      bus.on('event2', callback2);
      bus._clearOn();
      
      expect(bus._listeners.size).toBe(0);
    });
  });

  describe('调用事件功能测试', () => {
    test('onCall 应该正确注册调用事件', () => {
      const callback = jest.fn();
      bus.onCall('test.call', callback);
      
      const callInfo = bus._calls.get('test.call');
      expect(callInfo).toBeDefined();
      expect(callInfo.callback).toBe(callback);
      expect(callInfo.thisArg).toBe(null);
    });

    test('onCall 应该支持链式调用', () => {
      const callback = jest.fn();
      const result = bus.onCall('test.call', callback);
      
      expect(result).toBe(bus);
    });

    test('onCall 应该验证参数类型', () => {
      expect(() => bus.onCall('', jest.fn())).toThrow('事件类型必须是非空字符串');
      expect(() => bus.onCall('test', null)).toThrow('回调函数必须是函数类型');
    });

    test('onCall 重复注册应该警告但保持链式调用', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      // 第一次注册
      const result1 = bus.onCall('test.call', callback1);
      const callInfo1 = bus._calls.get('test.call');
      expect(callInfo1.callback).toBe(callback1);
      expect(result1).toBe(bus);
      
      // 第二次注册（重复）
      const result2 = bus.onCall('test.call', callback2);
      // 应该警告但返回this保持链式调用
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('调用事件 test.call 已注册，跳过重复注册'));
      // 回调函数应该仍然是第一个
      const callInfo2 = bus._calls.get('test.call');
      expect(callInfo2.callback).toBe(callback1);
      expect(result2).toBe(bus);
      
      consoleSpy.mockRestore();
    });

    test('call 应该异步触发调用事件并返回Promise', (done) => {
      const callback = jest.fn(() => {
        expect(callback).toHaveBeenCalledWith({ data: 'test' });
        return 'result';
      });
      
      bus.onCall('test.call', callback);
      bus.call('test.call', { data: 'test' }).then(result => {
        expect(result).toBe('result');
        done();
      });
    });

    test('call 应该返回Promise', () => {
      const callback = jest.fn(() => 'result');
      bus.onCall('test.call', callback);
      const result = bus.call('test.call', {});
      
      expect(result).toBeInstanceOf(Promise);
      return result.then(value => {
        expect(value).toBe('result');
      });
    });

    test('call 应该处理未注册的事件并返回已解析的Promise', () => {
      const promise = bus.call('nonexistent.call', {});
      
      expect(promise).toBeInstanceOf(Promise);
      return promise.then(value => {
        expect(value).toBeUndefined();
      });
    });

    test('callSync 应该同步触发调用事件并返回值', () => {
      const callback = jest.fn(() => 'result');
      bus.onCall('test.call', callback);
      
      const result = bus.callSync('test.call', { data: 'test' });
      
      expect(result).toBe('result');
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    test('callSync 应该返回 undefined 当事件未注册时', () => {
      const result = bus.callSync('nonexistent.call', {});
      
      expect(result).toBeUndefined();
    });

    test('offCall 应该移除调用事件', () => {
      const callback = jest.fn();
      bus.onCall('test.call', callback);
      bus.offCall('test.call', callback);
      
      expect(bus._calls.has('test.call')).toBe(false);
    });

    test('offCall 应该支持链式调用', () => {
      const callback = jest.fn();
      bus.onCall('test.call', callback);
      const result = bus.offCall('test.call', callback);
      
      expect(result).toBe(bus);
    });

    test('_clearCall 应该清除所有调用事件', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      bus.onCall('call1', callback1);
      bus.onCall('call2', callback2);
      bus._clearCall();
      
      expect(bus._calls.size).toBe(0);
    });

    test('check 应该正确返回事件注册状态', () => {
      // 初始状态
      expect(bus.check('test.event')).toEqual({ on: 0, call: false });
      
      // 注册广播事件
      const callback1 = jest.fn();
      bus.on('test.event', callback1);
      expect(bus.check('test.event')).toEqual({ on: 1, call: false });
      
      // 添加第二个广播监听器
      const callback2 = jest.fn();
      bus.on('test.event', callback2);
      expect(bus.check('test.event')).toEqual({ on: 2, call: false });
      
      // 注册调用事件
      const callCallback = jest.fn();
      bus.onCall('test.call', callCallback);
      expect(bus.check('test.call')).toEqual({ on: 0, call: true });
      
      // 移除广播监听器
      bus.off('test.event', callback1);
      expect(bus.check('test.event')).toEqual({ on: 1, call: false });
      
      // 移除调用事件
      bus.offCall('test.call', callCallback);
      expect(bus.check('test.call')).toEqual({ on: 0, call: false });
    });

    test('check 应该验证参数类型', () => {
      expect(() => bus.check('')).toThrow('事件类型必须是非空字符串');
    });

    test('on 应该支持thisArg参数', () => {
      const context = { name: 'testContext' };
      const callback = jest.fn(function() {
        expect(this).toBe(context);
      });
      
      bus.on('test.event', callback, context);
      bus.emit('test.event', { data: 'test' });
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('onCall 应该支持thisArg参数', () => {
      const context = { name: 'testContext' };
      const callback = jest.fn(function() {
        expect(this).toBe(context);
        return 'result';
      });
      
      bus.onCall('test.call', callback, context);
      const result = bus.callSync('test.call', { data: 'test' });
      
      expect(result).toBe('result');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('onCall 应该支持thisArg参数并返回Promise', () => {
      const context = { name: 'testContext' };
      const callback = jest.fn(function() {
        expect(this).toBe(context);
        return Promise.resolve('async result');
      });
      
      bus.onCall('test.call', callback, context);
      return bus.call('test.call', { data: 'test' }).then(result => {
        expect(result).toBe('async result');
      });
    });
  });

  describe('错误处理测试', () => {
    test('emit 应该处理监听器中的错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      
      bus.on('test.event', errorCallback);
      expect(() => bus.emit('test.event', {})).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    test('call 应该处理异步回调中的错误并返回rejected Promise', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      
      bus.onCall('test.call', errorCallback);
      const promise = bus.call('test.call', {});
      
      expect(promise).toBeInstanceOf(Promise);
      return promise.catch(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Test error');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    test('call 应该处理异步Promise回调中的错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = jest.fn(() => {
        return Promise.reject(new Error('Async error'));
      });
      
      bus.onCall('test.call', errorCallback);
      const promise = bus.call('test.call', {});
      
      expect(promise).toBeInstanceOf(Promise);
      return promise.catch(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Async error');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    test('callSync 应该抛出回调中的错误', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      
      bus.onCall('test.call', errorCallback);
      expect(() => bus.callSync('test.call', {})).toThrow('Test error');
    });
  });
});

describe('sMsgBus 压力测试', () => {
  let bus;

  beforeEach(() => {
    if (sMsgBus.instance) {
      sMsgBus.instance._listeners.clear();
      sMsgBus.instance._calls.clear();
    }
    bus = new sMsgBus();
  });

  test('广播消息压力测试 - 1万条消息', () => {
    const callback = jest.fn();
    const eventCount = 10000;
    
    // 订阅事件
    bus.on('pressure.broadcast', callback);
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 发送1万条广播消息
    for (let i = 0; i < eventCount; i++) {
      bus.emit('pressure.broadcast', { index: i, timestamp: Date.now() });
    }
    
    // 记录结束时间
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 验证回调被调用了1万次
    expect(callback).toHaveBeenCalledTimes(eventCount);
    
    // 输出性能信息
    console.log(`广播压力测试: ${eventCount}条消息，耗时${duration}ms，平均${(duration/eventCount).toFixed(3)}ms/条`);
    
    // 性能断言：1万条消息应该在合理时间内完成
    expect(duration).toBeLessThan(5000); // 5秒内完成
  });

  test('调用消息压力测试 - 1万条消息', (done) => {
    let callbackCount = 0;
    const eventCount = 10000;
    const promises = [];
    
    // 注册调用事件
    bus.onCall('pressure.call', (data) => {
      callbackCount++;
      return `result-${data.index}`;
    });
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 发送1万条调用消息并收集Promise
    for (let i = 0; i < eventCount; i++) {
      promises.push(bus.call('pressure.call', { index: i, timestamp: Date.now() }));
    }
    
    // 等待所有Promise完成
    Promise.all(promises).then(results => {
      // 记录结束时间
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 验证所有Promise都解析了
      expect(results.length).toBe(eventCount);
      expect(callbackCount).toBe(eventCount);
      
      // 输出性能信息
      console.log(`调用压力测试: ${eventCount}条消息，耗时${duration}ms，平均${(duration/eventCount).toFixed(3)}ms/条`);
      
      // 性能断言：1万条消息应该在合理时间内完成
      expect(duration).toBeLessThan(10000); // 10秒内完成（异步需要更多时间）
      done();
    });
  });

  test('混合消息压力测试 - 5000广播 + 5000调用', (done) => {
    let broadcastCount = 0;
    let callCount = 0;
    const eventCount = 5000;
    const totalEvents = eventCount * 2;
    
    // 订阅广播事件
    bus.on('pressure.mixed.broadcast', () => {
      broadcastCount++;
      checkCompletion();
    });
    
    // 注册调用事件
    bus.onCall('pressure.mixed.call', () => {
      callCount++;
      checkCompletion();
    });
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 发送混合消息
    for (let i = 0; i < eventCount; i++) {
      bus.emit('pressure.mixed.broadcast', { index: i });
      bus.call('pressure.mixed.call', { index: i });
    }
    
    function checkCompletion() {
      if (broadcastCount + callCount === totalEvents) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 验证回调次数
        expect(broadcastCount).toBe(eventCount);
        expect(callCount).toBe(eventCount);
        
        // 输出性能信息
        console.log(`混合压力测试: ${totalEvents}条消息（${eventCount}广播 + ${eventCount}调用），耗时${duration}ms，平均${(duration/totalEvents).toFixed(3)}ms/条`);
        
        // 性能断言
        expect(duration).toBeLessThan(8000); // 8秒内完成
        done();
      }
    }
  });

  test('内存使用测试 - 大量事件监听器', () => {
    const listenerCount = 1000;
    const callbacks = [];
    
    // 创建大量监听器
    for (let i = 0; i < listenerCount; i++) {
      const callback = jest.fn();
      callbacks.push(callback);
      bus.on(`event.${i}`, callback);
    }
    
    // 验证监听器数量
    expect(bus._listeners.size).toBe(listenerCount);
    
    // 触发所有事件
    for (let i = 0; i < listenerCount; i++) {
      bus.emit(`event.${i}`, { data: 'test' });
    }
    
    // 验证所有回调都被调用
    callbacks.forEach(callback => {
      expect(callback).toHaveBeenCalledTimes(1);
    });
    
    // 清理监听器
    for (let i = 0; i < listenerCount; i++) {
      bus.off(`event.${i}`, callbacks[i]);
    }
    
    // 验证清理后没有监听器
    expect(bus._listeners.size).toBe(0);
  });
});
