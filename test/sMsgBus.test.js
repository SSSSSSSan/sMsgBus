import sMsgBus from '../src/js/sMsgBus.js';

describe('sMsgBus 功能测试', () => {
  let bus;

  beforeEach(() => {
    // 每次测试前创建新的实例
    // 由于是单例模式，我们需要清除实例
    if (sMsgBus.instance) {
      sMsgBus.instance._listeners.clear();
      sMsgBus.instance._triggers.clear();
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
      expect(bus._triggers).toBeInstanceOf(Map);
    });
  });

  describe('广播事件功能测试', () => {
    test('listen 应该正确订阅事件', () => {
      const callback = jest.fn();
      bus.listen('test.event', callback);
      
      expect(bus._listeners.has('test.event')).toBe(true);
      expect(bus._listeners.get('test.event')).toContain(callback);
    });

    test('listen 应该支持链式调用', () => {
      const callback = jest.fn();
      const result = bus.listen('test.event', callback);
      
      expect(result).toBe(bus);
    });

    test('listen 应该验证参数类型', () => {
      expect(() => bus.listen('', jest.fn())).toThrow('事件类型必须是非空字符串');
      expect(() => bus.listen('test', null)).toThrow('回调函数必须是函数类型');
    });

    test('emit 应该触发所有监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const testData = { message: 'test' };
      
      bus.listen('test.event', callback1);
      bus.listen('test.event', callback2);
      bus.emit('test.event', testData);
      
      expect(callback1).toHaveBeenCalledWith(testData);
      expect(callback2).toHaveBeenCalledWith(testData);
    });

    test('emit 应该支持链式调用', () => {
      const callback = jest.fn();
      bus.listen('test.event', callback);
      const result = bus.emit('test.event', {});
      
      expect(result).toBe(bus);
    });

    test('emit 应该处理没有监听器的情况', () => {
      expect(() => bus.emit('nonexistent.event', {})).not.toThrow();
    });

    test('removeListening 应该移除特定监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      bus.listen('test.event', callback1);
      bus.listen('test.event', callback2);
      bus.removeListening('test.event', callback1);
      
      expect(bus._listeners.get('test.event')).not.toContain(callback1);
      expect(bus._listeners.get('test.event')).toContain(callback2);
    });

    test('removeListening 应该支持链式调用', () => {
      const callback = jest.fn();
      bus.listen('test.event', callback);
      const result = bus.removeListening('test.event', callback);
      
      expect(result).toBe(bus);
    });

    test('_removeAllListening 应该清除所有广播监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      bus.listen('event1', callback1);
      bus.listen('event2', callback2);
      bus._removeAllListening();
      
      expect(bus._listeners.size).toBe(0);
    });
  });

  describe('单播事件功能测试', () => {
    test('register 应该正确注册单播事件', () => {
      const callback = jest.fn();
      bus.register('test.trigger', callback);
      
      expect(bus._triggers.get('test.trigger')).toBe(callback);
    });

    test('register 应该支持链式调用', () => {
      const callback = jest.fn();
      const result = bus.register('test.trigger', callback);
      
      expect(result).toBe(bus);
    });

    test('register 应该验证参数类型', () => {
      expect(() => bus.register('', jest.fn())).toThrow('事件类型必须是非空字符串');
      expect(() => bus.register('test', null)).toThrow('回调函数必须是函数类型');
    });

    test('trigger 应该异步触发单播事件', (done) => {
      const callback = jest.fn(() => {
        expect(callback).toHaveBeenCalledWith({ data: 'test' });
        done();
      });
      
      bus.register('test.trigger', callback);
      bus.trigger('test.trigger', { data: 'test' });
    });

    test('trigger 应该支持链式调用', () => {
      const callback = jest.fn();
      bus.register('test.trigger', callback);
      const result = bus.trigger('test.trigger', {});
      
      expect(result).toBe(bus);
    });

    test('trigger 应该处理未注册的事件', () => {
      expect(() => bus.trigger('nonexistent.trigger', {})).not.toThrow();
    });

    test('triggerSync 应该同步触发单播事件并返回值', () => {
      const callback = jest.fn(() => 'result');
      bus.register('test.trigger', callback);
      
      const result = bus.triggerSync('test.trigger', { data: 'test' });
      
      expect(result).toBe('result');
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    test('triggerSync 应该返回 undefined 当事件未注册时', () => {
      const result = bus.triggerSync('nonexistent.trigger', {});
      
      expect(result).toBeUndefined();
    });

    test('removeTrigger 应该移除单播事件', () => {
      const callback = jest.fn();
      bus.register('test.trigger', callback);
      bus.removeTrigger('test.trigger', callback);
      
      expect(bus._triggers.has('test.trigger')).toBe(false);
    });

    test('removeTrigger 应该支持链式调用', () => {
      const callback = jest.fn();
      bus.register('test.trigger', callback);
      const result = bus.removeTrigger('test.trigger', callback);
      
      expect(result).toBe(bus);
    });

    test('_removeAllTrigger 应该清除所有单播触发器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      bus.register('trigger1', callback1);
      bus.register('trigger2', callback2);
      bus._removeAllTrigger();
      
      expect(bus._triggers.size).toBe(0);
    });
  });

  describe('错误处理测试', () => {
    test('emit 应该处理监听器中的错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      
      bus.listen('test.event', errorCallback);
      expect(() => bus.emit('test.event', {})).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    test('trigger 应该处理异步回调中的错误', (done) => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      
      bus.register('test.trigger', errorCallback);
      bus.trigger('test.trigger', {});
      
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
        done();
      }, 10);
    });

    test('triggerSync 应该抛出回调中的错误', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      
      bus.register('test.trigger', errorCallback);
      expect(() => bus.triggerSync('test.trigger', {})).toThrow('Test error');
    });
  });
});

describe('sMsgBus 压力测试', () => {
  let bus;

  beforeEach(() => {
    if (sMsgBus.instance) {
      sMsgBus.instance._listeners.clear();
      sMsgBus.instance._triggers.clear();
    }
    bus = new sMsgBus();
  });

  test('广播消息压力测试 - 1万条消息', () => {
    const callback = jest.fn();
    const eventCount = 10000;
    
    // 订阅事件
    bus.listen('pressure.broadcast', callback);
    
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

  test('单播消息压力测试 - 1万条消息', (done) => {
    let callbackCount = 0;
    const eventCount = 10000;
    
    // 注册单播事件
    bus.register('pressure.unicast', (data) => {
      callbackCount++;
      
      // 当所有回调都完成后
      if (callbackCount === eventCount) {
        // 记录结束时间
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 验证回调被调用了1万次
        expect(callbackCount).toBe(eventCount);
        
        // 输出性能信息
        console.log(`单播压力测试: ${eventCount}条消息，耗时${duration}ms，平均${(duration/eventCount).toFixed(3)}ms/条`);
        
        // 性能断言：1万条消息应该在合理时间内完成
        expect(duration).toBeLessThan(10000); // 10秒内完成（异步需要更多时间）
        done();
      }
    });
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 发送1万条单播消息
    for (let i = 0; i < eventCount; i++) {
      bus.trigger('pressure.unicast', { index: i, timestamp: Date.now() });
    }
  });

  test('混合消息压力测试 - 5000广播 + 5000单播', (done) => {
    let broadcastCount = 0;
    let unicastCount = 0;
    const eventCount = 5000;
    const totalEvents = eventCount * 2;
    
    // 订阅广播事件
    bus.listen('pressure.mixed.broadcast', () => {
      broadcastCount++;
      checkCompletion();
    });
    
    // 注册单播事件
    bus.register('pressure.mixed.unicast', () => {
      unicastCount++;
      checkCompletion();
    });
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 发送混合消息
    for (let i = 0; i < eventCount; i++) {
      bus.emit('pressure.mixed.broadcast', { index: i });
      bus.trigger('pressure.mixed.unicast', { index: i });
    }
    
    function checkCompletion() {
      if (broadcastCount + unicastCount === totalEvents) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 验证回调次数
        expect(broadcastCount).toBe(eventCount);
        expect(unicastCount).toBe(eventCount);
        
        // 输出性能信息
        console.log(`混合压力测试: ${totalEvents}条消息（${eventCount}广播 + ${eventCount}单播），耗时${duration}ms，平均${(duration/totalEvents).toFixed(3)}ms/条`);
        
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
      bus.listen(`event.${i}`, callback);
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
      bus.removeListening(`event.${i}`, callbacks[i]);
    }
    
    // 验证清理后没有监听器
    expect(bus._listeners.size).toBe(0);
  });
});
