# @san/smsgbus

纯JavaScript消息总线库，Node.js和浏览器环境均可使用。

## 环境

- 测试框架：Jest
- 构建工具：Rollup + Babel
- 支持环境：Node.js ≥10.0.0，现代浏览器

## 安装
*还不能这么装，没推送到npm仓库呢*
```bash
npm install @san/smsgbus
```

## 使用方法

### 基本使用

```javascript
import sMsgBus from '@san/smsgbus';

const bus = new sMsgBus();

// 广播事件（发布/订阅）
bus.on('event', (data) => {
  console.log('收到数据:', data);
});

bus.emit('event', { message: 'Hello' });

// 调用事件（请求/响应）
bus.onCall('getData', () => ({ data: 'test' }));

bus.call('getData').then(result => {
  console.log('调用结果:', result);
});
```

### API

- `on(type, callback, thisArg)` - 订阅广播事件
- `emit(type, data)` - 发布广播事件
- `off(type, callback, thisArg)` - 取消订阅
- `onCall(type, callback, thisArg)` - 注册调用事件
- `call(type, data)` - 异步调用（返回Promise）
- `callSync(type, data)` - 同步调用
- `offCall(type, callback, thisArg)` - 取消注册调用事件
- `check(type)` - 检查事件注册状态

## 编译文件

`dist/` 目录包含以下构建文件：

- `smsgbus.cjs.js` - CommonJS格式，用于Node.js
- `smsgbus.esm.js` - ES模块格式，用于现代前端构建工具（Webpack、Vite等）
- `smsgbus.umd.js` - UMD格式，用于浏览器直接引用
- `smsgbus.umd.min.js` - 压缩版UMD格式，生产环境使用

### 使用场景

- **Node.js项目**：使用 `smsgbus.cjs.js`
- **现代前端项目**（Vue/React）：使用 `smsgbus.esm.js`
- **浏览器直接引用**：使用 `smsgbus.umd.js` 或 `smsgbus.umd.min.js`

```html
<!-- 浏览器直接使用 -->
<script src="https://github.com/SSSSSSSan/sMsgBus/releases/download/v.0.1.0/smsgbus.umd.min.js"></script>
<script>
  const bus = new sMsgBus();
  // ... 使用API
</script>
```
*这里用的github连接，头铁可以不改*

## 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建
npm run build

# 开发模式（监听文件变化）
npm run dev
```

## 许可证

MIT
