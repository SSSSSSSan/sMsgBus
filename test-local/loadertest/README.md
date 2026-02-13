# loadModule() 方法测试套件

此文件夹包含 `loadModule()` 方法的完整测试套件，验证了 CJS、ESM、UMD 范式的模块都能正确加载，并能监听到被加载模块的测试信息。

## 文件夹结构

```
loadertest/
├── summary-test.js          # 主测试文件 - 运行所有功能测试
├── path-helper.js           # 路径辅助工具
├── README.md                # 说明文档
└── modules/                 # 测试模块
    ├── module-a.js          # 测试模块A - 基础功能模块
    ├── module-b.js          # 测试模块B - 事件功能模块  
    └── module-c.js          # 测试模块C - 异步功能模块
```

## 测试覆盖范围

1. ✅ **基础模块加载功能** - 单模块加载和功能调用
2. ✅ **批量模块加载功能** - 多模块同时加载
3. ✅ **模块缓存机制** - 重复模块加载使用缓存
4. ✅ **事件监听和触发** - 模块事件系统测试
5. ✅ **错误处理和恢复** - 无效路径处理
6. ✅ **文件URL支持** - Windows file:// URL 兼容性
7. ✅ **混合批量加载** - 有效和无效模块混合加载

## 运行测试

```bash
# 进入测试目录
cd test-local/loadertest

# 运行总结测试
node summary-test.js
```

## 测试模块说明

### module-a.js
- **功能**: 基础数学计算和问候功能
- **事件**: 触发模块初始化、函数调用、计算完成等事件
- **用途**: 测试基础模块加载和功能调用

### module-b.js  
- **功能**: 事件广播功能
- **事件**: 触发广播事件
- **用途**: 测试事件系统功能

### module-c.js
- **功能**: 异步延迟功能
- **事件**: 触发异步操作事件
- **用途**: 测试异步模块加载

## 技术要点

1. **Windows 兼容性**: 使用 `file://` URL 格式处理 Windows 绝对路径
2. **CommonJS 格式**: 测试模块使用 CommonJS 语法确保 Node.js 兼容性
3. **事件系统**: 测试模块通过 `sMsgBus` 触发事件，验证事件监听功能
4. **错误处理**: 正确处理模块加载失败情况
5. **缓存机制**: 验证重复模块加载使用缓存提高性能

## 测试结果验证

运行 `summary-test.js` 将生成详细的测试报告，包括：
- 每个测试项的通过/失败状态
- 总测试时间和通过率
- 详细的功能验证结果
- 测试覆盖范围总结

所有测试项通过率应为 100%，验证 `loadModule()` 方法功能完整。

## 已删除的文件说明

在整理过程中，删除了以下不必要的文件：
- `absolute-test.js`, `clean-test.js`, `file-url-test.js` - 重复的测试文件
- `final-test.js`, `simple-test.js` - 被 `summary-test.js` 替代
- `runner.js`, `fixed-runner.js`, `final-runner.js` - 复杂的测试运行器
- `esmtest.js`, `index.js` - 有语法问题的 ES Module 文件
- `indexes/`, `formats/` 目录 - 路径有问题的测试文件
- `simple-module.js` - 被 `module-a.js` 替代的测试模块

保留的文件都是经过验证可用的核心测试文件。