/**
 * sMsgBus 最小化性能测试脚本
 * 纯粹测试消息库性能，回调只做计数器+1
 * 避免复杂计算干扰测试结果
 */

const sMsgBus = require('./dist/smsgbus.cjs.js');

// 配置参数
const CONFIG = {
  initialRPS: 1000,           // 初始RPS
  rpsIncrement: 1000,         // RPS增量
  maxRPS: 50000,              // 最大RPS限制
  testDuration: 2000,         // 每次测试持续时间（毫秒）
  successThreshold: 0.999,    // 成功率阈值（99.9%）
  maxMemoryMB: 1024,          // 内存阈值
  testModes: [
    { name: '纯广播', type: 'broadcast', ratio: 1.0 },
    { name: '纯单播', type: 'unicast', ratio: 1.0 },
    { name: '1:1混合', type: 'mixed', ratio: 0.5 }
  ]
};

/**
 * 原子计数器类
 * 确保计数器操作的原子性
 */
class AtomicCounter {
  constructor() {
    this._count = 0;
  }

  increment() {
    this._count++;
  }

  get value() {
    return this._count;
  }

  reset() {
    this._count = 0;
  }
}

/**
 * 性能测试器类
 */
class MinimalPerformanceTester {
  constructor(config) {
    this.config = config;
    this.bus = new sMsgBus();
    this.counter = new AtomicCounter();
    this.testResults = [];
    
    // 初始化事件处理器
    this._initEventHandlers();
  }

  /**
   * 初始化事件处理器（最简单的回调）
   */
  _initEventHandlers() {
    // 广播事件处理器
    this.bus.on('minimal.broadcast', () => {
      this.counter.increment();
    });

    // 单播事件处理器
    this.bus.onCall('minimal.unicast', () => {
      this.counter.increment();
      return { success: true };
    });
  }

  /**
   * 清屏函数
   */
  _clearScreen() {
    // Windows和Unix兼容的清屏方式
    process.stdout.write('\x1Bc');
  }

  /**
   * 显示测试头信息
   */
  _showHeader(modeName, currentRPS) {
    this._clearScreen();
    console.log('='.repeat(70));
    console.log('sMsgBus 最小化性能测试');
    console.log('='.repeat(70));
    console.log(`测试模式: ${modeName}`);
    console.log(`目标RPS: ${currentRPS}`);
    console.log('='.repeat(70));
  }

  /**
   * 显示测试进度
   */
  _showProgress(elapsedTime, targetCount, counterValue) {
    const progress = Math.min(100, (elapsedTime / this.config.testDuration) * 100);
    const successRate = targetCount > 0 ? (counterValue / targetCount) * 100 : 0;
    
    process.stdout.write(`\r进度: ${progress.toFixed(1)}% | 完成: ${counterValue}/${targetCount} | 成功率: ${successRate.toFixed(2)}%`);
  }

  /**
   * 运行单次测试
   */
  async _runSingleTest(mode, targetRPS) {
    const targetCount = Math.floor(targetRPS * (this.config.testDuration / 1000));
    let broadcastCount = 0;
    let unicastCount = 0;
    
    // 重置计数器
    this.counter.reset();
    
    const startTime = Date.now();
    const endTime = startTime + this.config.testDuration;
    
    // 根据测试模式确定调用比例
    let broadcastTarget, unicastTarget;
    if (mode.type === 'broadcast') {
      broadcastTarget = targetCount;
      unicastTarget = 0;
    } else if (mode.type === 'unicast') {
      broadcastTarget = 0;
      unicastTarget = targetCount;
    } else { // mixed
      broadcastTarget = Math.floor(targetCount * mode.ratio);
      unicastTarget = targetCount - broadcastTarget;
    }
    
    // 执行测试
    while (Date.now() < endTime && (broadcastCount < broadcastTarget || unicastCount < unicastTarget)) {
      // 执行广播调用
      if (broadcastCount < broadcastTarget) {
        this.bus.emit('minimal.broadcast', { index: broadcastCount });
        broadcastCount++;
      }
      
      // 执行单播调用
      if (unicastCount < unicastTarget) {
        this.bus.call('minimal.unicast', { index: unicastCount })
          .catch(() => { /* 忽略错误 */ });
        unicastCount++;
      }
      
      // 显示进度
      const elapsed = Date.now() - startTime;
      if (elapsed % 100 === 0) { // 每100ms更新一次进度
        this._showProgress(elapsed, targetCount, this.counter.value);
      }
      
      // 避免阻塞事件循环
      if ((broadcastCount + unicastCount) % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // 等待剩余回调完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const actualDuration = Date.now() - startTime;
    const actualCount = this.counter.value;
    const successRate = targetCount > 0 ? actualCount / targetCount : 0;
    const actualRPS = actualDuration > 0 ? (actualCount / (actualDuration / 1000)) : 0;
    
    // 获取性能数据
    const memoryUsage = process.memoryUsage();
    const memoryMB = memoryUsage.heapUsed / (1024 * 1024);
    
    return {
      mode: mode.name,
      targetRPS,
      targetCount,
      actualCount,
      successRate,
      actualRPS,
      durationMs: actualDuration,
      memoryMB,
      broadcastCount,
      unicastCount
    };
  }

  /**
   * 运行完整测试套件
   */
  async runTestSuite() {
    console.log('开始sMsgBus最小化性能测试...\n');
    
    for (const mode of this.config.testModes) {
      console.log(`\n准备测试: ${mode.name}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let currentRPS = this.config.initialRPS;
      let round = 1;
      
      while (currentRPS <= this.config.maxRPS) {
        // 显示测试头信息
        this._showHeader(mode.name, currentRPS);
        
        // 运行测试
        const result = await this._runSingleTest(mode, currentRPS);
        
        // 显示结果
        this._clearScreen();
        console.log('='.repeat(70));
        console.log(`测试完成: ${mode.name} - 第${round}轮`);
        console.log('='.repeat(70));
        console.log(`目标RPS: ${result.targetRPS}`);
        console.log(`目标调用数: ${result.targetCount}`);
        console.log(`实际完成: ${result.actualCount}`);
        console.log(`成功率: ${(result.successRate * 100).toFixed(2)}%`);
        console.log(`实际RPS: ${result.actualRPS.toFixed(2)}`);
        console.log(`耗时: ${(result.durationMs / 1000).toFixed(3)}秒`);
        console.log(`广播调用: ${result.broadcastCount}`);
        console.log(`单播调用: ${result.unicastCount}`);
        console.log(`内存使用: ${result.memoryMB.toFixed(2)} MB`);
        console.log('='.repeat(70));
        
        // 保存结果
        this.testResults.push(result);
        
        // 检查是否继续测试
        if (result.successRate < this.config.successThreshold) {
          console.log(`\n⚠️  成功率低于${this.config.successThreshold * 100}%，停止测试`);
          break;
        }
        
        if (result.memoryMB >= this.config.maxMemoryMB) {
          console.log(`\n⚠️  内存使用超过${this.config.maxMemoryMB}MB，停止测试`);
          break;
        }
        
        // 增加RPS，继续下一轮
        currentRPS += this.config.rpsIncrement;
        round++;
        
        // 短暂休息
        console.log('\n准备下一轮测试...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 模式间休息
      if (mode !== this.config.testModes[this.config.testModes.length - 1]) {
        console.log('\n' + '='.repeat(70));
        console.log(`完成 ${mode.name} 测试，准备下一个测试模式...`);
        console.log('='.repeat(70));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 显示最终汇总
    this._showFinalSummary();
  }

  /**
   * 显示最终汇总
   */
  _showFinalSummary() {
    this._clearScreen();
    console.log('='.repeat(70));
    console.log('sMsgBus 性能测试最终汇总');
    console.log('='.repeat(70));
    
    for (const mode of this.config.testModes) {
      const modeResults = this.testResults.filter(r => r.mode === mode.name);
      if (modeResults.length === 0) continue;
      
      const bestResult = modeResults.reduce((best, current) => 
        current.successRate >= this.config.successThreshold && 
        current.actualRPS > best.actualRPS ? current : best
      );
      
      console.log(`\n${mode.name}:`);
      console.log(`  最佳RPS: ${bestResult.actualRPS.toFixed(2)}`);
      console.log(`  成功率: ${(bestResult.successRate * 100).toFixed(2)}%`);
      console.log(`  耗时: ${(bestResult.durationMs / 1000).toFixed(3)}秒`);
      console.log(`  内存: ${bestResult.memoryMB.toFixed(2)} MB`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('测试完成！');
    console.log('='.repeat(70));
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.bus._clearOn();
    this.bus._clearCall();
  }
}

/**
 * 主函数
 */
async function main() {
  const tester = new MinimalPerformanceTester(CONFIG);
  
  try {
    await tester.runTestSuite();
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    tester.cleanup();
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

// 导出模块
module.exports = {
  MinimalPerformanceTester,
  AtomicCounter,
  CONFIG
};
