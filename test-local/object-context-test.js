/**
 * sMsgBus 对象上下文压力测试脚本
 * 使用对象状态跟踪回调完成情况，延迟验证确保准确性
 * 广播和单播调用比例为2:5
 */

const sMsgBus = require('./dist/smsgbus.cjs.js');

// 配置参数
const CONFIG = {
  initialRPS: 10,                // 初始每秒请求数
  rpsIncrement: 10,              // 每秒请求数增量
  maxRPS: 10000,                 // 最大每秒请求数限制
  testDuration: 1000,            // 每次负载测试的持续时间（毫秒）
  checkAtTime: 800,              // 在测试开始后多少毫秒检查性能（0.8秒）
  verificationDelay: 200,        // 验证延迟（毫秒），调用完成后等待的时间
  broadcastRatio: 2,             // 广播调用比例
  unicastRatio: 5,               // 单播调用比例
  eventTypes: {
    broadcast: ['broadcast.event1', 'broadcast.event2', 'broadcast.event3'],
    unicast: ['unicast.task1', 'unicast.task2', 'unicast.task3', 'unicast.task4']
  },
  performanceThreshold: 0.9,     // 性能阈值：完成率低于90%时停止
  maxMemoryMB: 1024              // 内存阈值（MB）
};

/**
 * 测试上下文类
 * 用于跟踪回调完成状态
 */
class TestContext {
  constructor(id) {
    this.id = id;
    this.completionCount = 0;      // 实际完成的回调计数
    this.targetCount = 0;          // 目标回调计数
    this.isCompleted = false;      // 是否全部完成
    this.startTime = null;         // 开始时间
    this.endTime = null;           // 结束时间
  }

  /**
   * 重置上下文
   * @param {number} targetCount 目标回调数
   */
  reset(targetCount) {
    this.completionCount = 0;
    this.targetCount = targetCount;
    this.isCompleted = false;
    this.startTime = Date.now();
    this.endTime = null;
  }

  /**
   * 标记一个回调完成
   */
  markComplete() {
    this.completionCount++;
    if (this.completionCount >= this.targetCount) {
      this.isCompleted = true;
      this.endTime = Date.now();
    }
  }

  /**
   * 获取完成率
   */
  getCompletionRate() {
    return this.targetCount > 0 ? this.completionCount / this.targetCount : 0;
  }

  /**
   * 获取实际RPS
   */
  getActualRPS() {
    if (!this.endTime || !this.startTime) return 0;
    const duration = (this.endTime - this.startTime) / 1000; // 秒
    return duration > 0 ? this.completionCount / duration : 0;
  }

  /**
   * 等待完成或超时
   * @param {number} timeoutMs 超时时间（毫秒）
   */
  async waitForCompletion(timeoutMs = 5000) {
    const startWait = Date.now();
    while (!this.isCompleted && (Date.now() - startWait) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (!this.isCompleted) {
      this.endTime = Date.now();
    }
    return this.isCompleted;
  }
}

/**
 * 性能监控器类
 * 负责监控CPU和内存使用情况
 */
class PerformanceMonitor {
  constructor(config) {
    this.config = config;
    this.lastCpuUsage = process.cpuUsage(); // 初始CPU使用量
    this.lastCheckTime = Date.now();         // 上次检查时间
    this.currentCpuUsage = 0;                // 当前CPU使用率（百分比）
    this.currentMemoryUsage = 0;             // 当前内存使用量（字节）
    this.peakCpuUsage = 0;                   // 峰值CPU使用率
    this.peakMemoryUsage = 0;                // 峰值内存使用量
    this.checkpointCpuUsage = 0;             // 检查点CPU使用率（0.8秒时）
    this.checkpointMemoryUsage = 0;          // 检查点内存使用量（0.8秒时）
    this.isRunning = false;                  // 监控是否运行
  }

  /**
   * 开始监控
   */
  start() {
    this.isRunning = true;
    this.lastCpuUsage = process.cpuUsage();
    this.lastCheckTime = Date.now();
    this.checkpointCpuUsage = 0;
    this.checkpointMemoryUsage = 0;
    console.log('性能监控已启动');
  }

  /**
   * 停止监控
   */
  stop() {
    this.isRunning = false;
    console.log('性能监控已停止');
  }

  /**
   * 检查当前性能指标
   * @returns {Object} 包含CPU使用率、内存使用量的信息
   */
  check() {
    if (!this.isRunning) {
      return { cpuUsage: 0, memoryUsage: 0, memoryUsageMB: '0.00' };
    }

    // 计算CPU使用率
    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.lastCheckTime; // 毫秒
    
    // 将微秒转换为毫秒，并计算CPU使用率百分比
    const cpuTime = (currentCpuUsage.user + currentCpuUsage.system) / 1000; // 转换为毫秒
    const cpuUsagePercent = elapsedTime > 0 ? (cpuTime / elapsedTime) * 100 : 0;
    
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed;
    
    // 更新状态
    this.currentCpuUsage = cpuUsagePercent;
    this.currentMemoryUsage = heapUsed;
    
    // 更新峰值
    if (cpuUsagePercent > this.peakCpuUsage) {
      this.peakCpuUsage = cpuUsagePercent;
    }
    if (heapUsed > this.peakMemoryUsage) {
      this.peakMemoryUsage = heapUsed;
    }
    
    // 更新上次检查数据
    this.lastCpuUsage = process.cpuUsage();
    this.lastCheckTime = currentTime;
    
    return {
      cpuUsage: cpuUsagePercent,
      memoryUsage: heapUsed,
      memoryUsageMB: (heapUsed / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * 记录检查点性能（在0.8秒时调用）
   */
  recordCheckpoint() {
    this.checkpointCpuUsage = this.currentCpuUsage;
    this.checkpointMemoryUsage = this.currentMemoryUsage;
  }

  /**
   * 获取性能摘要
   */
  getSummary() {
    return {
      peakCpuUsage: this.peakCpuUsage.toFixed(2) + '%',
      peakMemoryUsage: (this.peakMemoryUsage / (1024 * 1024)).toFixed(2) + ' MB',
      checkpointCpuUsage: this.checkpointCpuUsage.toFixed(2) + '%',
      checkpointMemoryUsage: (this.checkpointMemoryUsage / (1024 * 1024)).toFixed(2) + ' MB',
      currentCpuUsage: this.currentCpuUsage.toFixed(2) + '%',
      currentMemoryUsage: (this.currentMemoryUsage / (1024 * 1024)).toFixed(2) + ' MB'
    };
  }
}

/**
 * 对象上下文压力测试引擎类
 */
class ObjectContextTestEngine {
  constructor(config, monitor) {
    this.config = config;
    this.monitor = monitor;
    this.bus = new sMsgBus();
    this.testContexts = new Map(); // 存储测试上下文
    this.currentTestId = 0;
    this.isRunning = false;
    this.startTime = null;
    this.totalOperations = 0;
    this.totalBroadcast = 0;
    this.totalUnicast = 0;
    
    // 初始化事件处理器
    this._initEventHandlers();
  }

  /**
   * 初始化事件处理器
   */
  _initEventHandlers() {
    // 初始化广播事件处理器
    this.config.eventTypes.broadcast.forEach(eventType => {
      this.bus.on(eventType, function(data) {
        // 模拟实际工作负载
        let result = 0;
        for (let i = 0; i < 1000; i++) {
          result += Math.sqrt(i) * Math.random();
        }
        
        // 如果data包含testId，则标记对应的测试上下文完成
        if (data && data.testId !== undefined) {
          const context = this.testContexts.get(data.testId);
          if (context) {
            context.markComplete();
          }
        }
        
        return result;
      }.bind(this)); // 绑定this以访问testContexts
    });

    // 初始化单播事件处理器
    this.config.eventTypes.unicast.forEach(eventType => {
      this.bus.onCall(eventType, function(data) {
        // 模拟实际工作负载
        let result = 0;
        for (let i = 0; i < 1500; i++) {
          result += Math.sin(i) * Math.cos(i) * Math.random();
        }
        
        // 如果data包含testId，则标记对应的测试上下文完成
        if (data && data.testId !== undefined) {
          const context = this.testContexts.get(data.testId);
          if (context) {
            context.markComplete();
          }
        }
        
        return { processed: true, value: result, ...data };
      }.bind(this)); // 绑定this以访问testContexts
    });
  }

  /**
   * 创建新的测试上下文
   */
  _createTestContext() {
    const testId = this.currentTestId++;
    const context = new TestContext(testId);
    this.testContexts.set(testId, context);
    return { testId, context };
  }

  /**
   * 清理测试上下文
   */
  _cleanupTestContext(testId) {
    this.testContexts.delete(testId);
  }

  /**
   * 执行指定数量的操作（使用对象上下文跟踪）
   * @param {number} targetOperations 目标操作数
   * @param {number} durationMs 持续时间（毫秒）
   * @returns {Object} 测试结果
   */
  async _runObjectContextTest(targetOperations, durationMs) {
    // 创建测试上下文
    const { testId, context } = this._createTestContext();
    context.reset(targetOperations);
    
    const startTime = Date.now();
    const endTime = startTime + durationMs;
    let operationsInitiated = 0;
    let broadcastInitiated = 0;
    let unicastInitiated = 0;
    let checkpointRecorded = false;
    
    // 发起操作
    while (Date.now() < endTime && operationsInitiated < targetOperations) {
      const ratioSum = this.config.broadcastRatio + this.config.unicastRatio;
      const operationType = operationsInitiated % ratioSum;
      
      if (operationType < this.config.broadcastRatio) {
        // 发起广播操作
        const eventType = this.config.eventTypes.broadcast[
          broadcastInitiated % this.config.eventTypes.broadcast.length
        ];
        this.bus.emit(eventType, {
          testId: testId,
          index: broadcastInitiated,
          timestamp: Date.now(),
          targetRPS: targetOperations
        });
        broadcastInitiated++;
      } else {
        // 发起单播操作
        const eventType = this.config.eventTypes.unicast[
          unicastInitiated % this.config.eventTypes.unicast.length
        ];
        this.bus.call(eventType, {
          testId: testId,
          index: unicastInitiated,
          timestamp: Date.now(),
          targetRPS: targetOperations
        }).catch(() => {
          // 忽略错误
        });
        unicastInitiated++;
      }
      
      operationsInitiated++;
      
      // 在0.8秒时记录检查点
      const elapsed = Date.now() - startTime;
      if (!checkpointRecorded && elapsed >= this.config.checkAtTime) {
        this.monitor.recordCheckpoint();
        checkpointRecorded = true;
      }
      
      // 定期让出事件循环
      if (operationsInitiated % 100 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // 等待所有回调完成（延迟验证）
    await new Promise(resolve => setTimeout(resolve, this.config.verificationDelay));
    
    // 等待剩余的回调完成（最多等待2秒）
    await context.waitForCompletion(2000);
    
    // 获取实际完成情况
    const operationsCompleted = context.completionCount;
    const broadcastCompleted = Math.floor(operationsCompleted * (this.config.broadcastRatio / (this.config.broadcastRatio + this.config.unicastRatio)));
    const unicastCompleted = operationsCompleted - broadcastCompleted;
    const completionRate = operationsCompleted / targetOperations;
    
    // 更新总计数
    this.totalOperations += operationsCompleted;
    this.totalBroadcast += broadcastCompleted;
    this.totalUnicast += unicastCompleted;
    
    // 清理测试上下文
    this._cleanupTestContext(testId);
    
    const actualDuration = Date.now() - startTime;
    
    return {
      targetOperations,
      operationsInitiated,
      operationsCompleted,
      broadcastInitiated,
      broadcastCompleted,
      unicastInitiated,
      unicastCompleted,
      completionRate,
      durationMs: actualDuration,
      actualRPS: (operationsCompleted / (actualDuration / 1000)).toFixed(2),
      checkpointRecorded,
      testId
    };
  }

  /**
   * 开始动态负载压力测试
   */
  async start() {
    if (this.isRunning) {
      console.log('压力测试已经在运行中');
      return;
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.totalOperations = 0;
    this.totalBroadcast = 0;
    this.totalUnicast = 0;
    
    console.log('对象上下文压力测试开始...');
    console.log(`配置: 广播:单播 = ${this.config.broadcastRatio}:${this.config.unicastRatio}`);
    console.log(`初始RPS: ${this.config.initialRPS}, 增量: ${this.config.rpsIncrement}`);
    console.log(`验证延迟: ${this.config.verificationDelay}ms, 内存阈值: ${this.config.maxMemoryMB}MB`);
    console.log('='.repeat(70));
    
    // 启动监控
    this.monitor.start();
    
    let currentRPS = this.config.initialRPS;
    let testRound = 1;
    let stopReason = '';
    
    // 动态负载测试循环
    while (this.isRunning && currentRPS <= this.config.maxRPS) {
      console.log(`\n测试轮次 ${testRound}: 目标RPS = ${currentRPS}`);
      
      // 运行对象上下文测试
      const result = await this._runObjectContextTest(currentRPS, this.config.testDuration);
      
      // 获取当前性能数据
      const performance = this.monitor.check();
      const memoryMB = parseFloat(performance.memoryUsageMB);
      
      // 输出本轮测试结果
      console.log(`  发起/完成: ${result.operationsInitiated}/${result.operationsCompleted}`);
      console.log(`  完成率: ${(result.completionRate * 100).toFixed(1)}%`);
      console.log(`  实际RPS: ${result.actualRPS}`);
      console.log(`  广播: ${result.broadcastCompleted}, 单播: ${result.unicastCompleted}`);
      console.log(`  当前CPU: ${performance.cpuUsage.toFixed(2)}%, 内存: ${performance.memoryUsageMB} MB`);
      
      // 检查停止条件
      if (result.completionRate < this.config.performanceThreshold) {
        stopReason = `无法完成目标RPS (完成率: ${(result.completionRate * 100).toFixed(1)}% < ${this.config.performanceThreshold * 100}%)`;
        break;
      }
      
      if (memoryMB >= this.config.maxMemoryMB) {
        stopReason = `内存使用超过阈值 (${memoryMB.toFixed(2)}MB >= ${this.config.maxMemoryMB}MB)`;
        break;
      }
      
      if (performance.cpuUsage >= 95) {
        stopReason = `CPU使用率过高 (${performance.cpuUsage.toFixed(2)}% >= 95%)`;
        break;
      }
      
      // 增加负载，继续下一轮测试
      currentRPS += this.config.rpsIncrement;
      testRound++;
      
      // 短暂休息，让系统稳定
      if (testRound % 5 === 0) {
        console.log('  短暂休息...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 如果因为达到最大RPS而停止
    if (currentRPS > this.config.maxRPS) {
      stopReason = `达到最大RPS限制 (${this.config.maxRPS})`;
    }
    
    // 停止测试
    await this.stop(stopReason || '测试完成');
  }

  /**
   * 停止压力测试
   * @param {string} reason 停止原因
   */
  async stop(reason = '手动停止') {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.monitor.stop();
    
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    // 输出测试结果
    console.log('\n' + '='.repeat(70));
    console.log('对象上下文压力测试完成');
    console.log('='.repeat(70));
    console.log(`停止原因: ${reason}`);
    console.log(`总测试时长: ${(duration / 1000).toFixed(2)} 秒`);
    console.log(`总完成操作数: ${this.totalOperations}`);
    console.log(`总广播次数: ${this.totalBroadcast}`);
    console.log(`总单播次数: ${this.totalUnicast}`);
    console.log(`最终比例: ${this.totalBroadcast}:${this.totalUnicast} (目标: ${this.config.broadcastRatio}:${this.config.unicastRatio})`);
    console.log(`平均RPS: ${(this.totalOperations / (duration / 1000)).toFixed(2)}`);
    
    // 输出性能摘要
    const perfSummary = this.monitor.getSummary();
    console.log('\n性能摘要:');
    console.log(`峰值CPU使用率: ${perfSummary.peakCpuUsage}`);
    console.log(`峰值内存使用: ${perfSummary.peakMemoryUsage}`);
    console.log(`0.8秒检查点CPU: ${perfSummary.checkpointCpuUsage}`);
    console.log(`0.8秒检查点内存: ${perfSummary.checkpointMemoryUsage}`);
    console.log(`最终CPU使用率: ${perfSummary.currentCpuUsage}`);
    console.log(`最终内存使用: ${perfSummary.currentMemoryUsage}`);
    console.log('='.repeat(70));
    
    // 清理资源
    this._cleanup();
  }

  /**
   * 清理资源
   */
  _cleanup() {
    // 清理所有测试上下文
    this.testContexts.clear();
    
    // 清理事件监听器
    this.config.eventTypes.broadcast.forEach(eventType => {
      this.bus._clearOn();
    });
    
    // 清理调用事件
    this.config.eventTypes.unicast.forEach(eventType => {
      this.bus._clearCall();
    });
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('sMsgBus 对象上下文压力测试脚本启动');
    console.log('='.repeat(70));
    console.log('测试说明:');
    console.log('1. 使用对象上下文跟踪回调完成状态');
    console.log('2. 延迟验证确保回调真正完成');
    console.log('3. 逐渐增加每秒请求数(RPS)，直到无法完成目标');
    console.log('4. 广播和单播调用比例为2:5');
    console.log('5. 当完成率低于90%或内存超过1GB时停止测试');
    console.log('='.repeat(70));
    
    // 创建监控器和测试引擎
    const monitor = new PerformanceMonitor(CONFIG);
    const engine = new ObjectContextTestEngine(CONFIG, monitor);
    
    // 启动压力测试
    await engine.start();
    
    console.log('\n测试完成，程序退出');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

// 导出模块（便于其他脚本引用）
module.exports = {
  TestContext,
  PerformanceMonitor,
  ObjectContextTestEngine,
  CONFIG
};
