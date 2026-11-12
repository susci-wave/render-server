// 用于 serv00.com 和 node<=16 的兼容入口
// .env 的生成/读取已统一由 app.mjs 首先导入的 env.mjs 处理

async function loadModule() {
    await import('./app.mjs')
}
loadModule()
