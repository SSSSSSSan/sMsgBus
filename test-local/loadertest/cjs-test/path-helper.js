/**
 * 路径辅助工具
 * 帮助生成正确的模块路径
 */

const path = require('path');

// 从项目根目录到测试模块的路径
const MODULE_PATHS = {
  'module-a': '../../test-local/loadertest/modules/module-a.js',
  'module-b': '../../test-local/loadertest/modules/module-b.js',
  'module-c': '../../test-local/loadertest/modules/module-c.js'
};

// 获取模块路径
function getModulePath(moduleName) {
  if (MODULE_PATHS[moduleName]) {
    return MODULE_PATHS[moduleName];
  }
  throw new Error(`未知模块: ${moduleName}`);
}

// 获取所有模块路径
function getAllModulePaths() {
  return Object.values(MODULE_PATHS);
}

// 获取模块名称列表
function getModuleNames() {
  return Object.keys(MODULE_PATHS);
}

// 创建批量加载路径
function createBatchPaths(count = 3) {
  const paths = [];
  const modules = getModuleNames();
  
  for (let i = 0; i < count; i++) {
    const moduleName = modules[i % modules.length];
    paths.push(getModulePath(moduleName));
  }
  
  return paths;
}

// 创建混合路径（包含有效和无效路径）
function createMixedPaths() {
  return [
    getModulePath('module-a'),
    '../../test-local/loadertest/modules/nonexistent-module.js',
    getModulePath('module-b'),
    './invalid/path/module.js',
    getModulePath('module-c')
  ];
}

module.exports = {
  getModulePath,
  getAllModulePaths,
  getModuleNames,
  createBatchPaths,
  createMixedPaths,
  MODULE_PATHS
};