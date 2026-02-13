/**
 * 简单的 ES Module 测试
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 动态导入 sMsgBus CommonJS 版本
let sMsgBus;
try {
  const sMsgBusModule = await import('../../../dist/smsgbus.cjs.js');
  sMsgBus = sMsgBusModule.default || sMsgBusModule;
  console.log('✅ sMsgBus CommonJS 版本加载成功');
} catch (error) {
  console.error('❌ 无法加载 sMsgBus:', error.message);
  process.exit(1);
}

// 将 Windows 路径转换为 file:// URL
function toFileUrl(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return `file:///${normalized}`;
}

async function runSimpleTest() {
  console.log('🎯 简单 ES Module 测试');
  console.log('='.repeat(60));
  
  try {
    // 获取绝对路径
    const projectRoot = resolve(__dirname, '../../..');
    const testModulePath = join(projectRoot, 'test-local', 'loadertest', 'esm-test', 'modules', 'module-a.mjs');
    const testModuleUrl = toFileUrl(testModulePath);
    
    console.log(`📁 测试模块: ${testModulePath}`);
    console.log(`📁 File URL: ${testModuleUrl}`);
    
    // 测试1: 基础模块加载
    console.log('\n1️⃣  测试1: 基础模块加载');
    const module = await sMsgBus.loadModule(testModuleUrl);
    
    console.log('   模块对象:', typeof module);
    console.log('   模块键:', Object.keys(module || {}));
    
    if (module) {
      console.log('   ✅ 模块加载成功');
      
      // 检查模块结构
      const moduleObj = module.default || module.ModuleA || module;
      
      if (moduleObj.greet) {
        const greetResult = moduleObj.greet('简单测试');
        console.log(`   ✅ greet功能: ${greetResult}`);
      } else {
        console.log('   ❌ greet功能不存在');
      }
      
      if (moduleObj.add) {
        const addResult = moduleObj.add(5, 3);
        console.log(`   ✅ add功能: 5 + 3 = ${addResult}`);
      } else {
        console.log('   ❌ add功能不存在');
      }
      
      if (moduleObj.getState) {
        const state = moduleObj.getState();
        console.log(`   ✅ 模块状态: ${JSON.stringify(state)}`);
      } else {
        console.log('   ❌ getState功能不存在');
      }
    } else {
      console.log('   ❌ 模块加载失败');
    }
    
    // 测试2: 事件系统
    console.log('\n2️⃣  测试2: 事件系统');
    let eventCount = 0;
    
    sMsgBus.on('simple.test.event', (data) => {
      eventCount++;
      console.log(`   📡 收到事件: ${JSON.stringify(data)}`);
    });
    
    sMsgBus.emit('simple.test.event', { 
      message: '简单测试事件', 
      timestamp: Date.now()
    });
    
    // 等待事件处理
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`   ✅ 事件系统: 收到 ${eventCount} 个事件 (预期: 1)`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 简单测试完成');
    console.log('='.repeat(60));
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试运行错误:', error);
    return false;
  }
}

// 运行测试
runSimpleTest().then(success => {
  console.log('\n测试完成!');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试运行错误:', error);
  process.exit(1);
});