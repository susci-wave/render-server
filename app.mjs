// 必须放在其它 import 之前：确保 .env 已生成并在各模块读取 process.env 前加载
import './env.mjs'
import http from 'http'
import express from 'express'

import wssServer from './sless/server-sless.mjs'

import site_app from './site/app/index.mjs'
import animefilter_app from './site/animefilter/index.mjs'
import api_tool_app from './site/api-tools/index.mjs'
import cflog_app from './site/cloudflare-log/index.mjs'
import fund_app from './site/fund/index.mjs'
import hk1_app from './site/hk1/index.mjs'
import it_tool_app from './site/it-tools/index.mjs'

const uuid = process.env.SLESS_UUID;
const port = process.env.APP_PORT || 80;
// 跳转目标只从配置读取，不再使用请求里的 Host 头，避免开放重定向
const redirectHost = (process.env.REDIRECT_HOST || '').trim().toLowerCase();
// 仅在 serv00 环境启用强制 HTTPS；PWD 缺失时用 cwd 兜底
const isServ00 = (process.env.PWD || process.cwd()).includes('serv00');
const app = express();

app.use((req, res, next) => {
    if (isServ00) {
      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      if (proto !== 'https') {
        if (!redirectHost) {
          return res.status(503).type('text/plain').send('503 no redirectHost');
        }
        return res.redirect(301, `https://${redirectHost}${req.originalUrl}`);
      }
    }

    return next();
});


site_app(app)
animefilter_app(app)
api_tool_app(app)
cflog_app(app)
fund_app(app)
hk1_app(app)
it_tool_app(app)

// 统一错误处理：客户端只看到通用错误，堆栈/路径仅写入服务端日志
app.use((err, req, res, next) => {
  const status = Number.isInteger(err && err.status) ? err.status
    : Number.isInteger(err && err.statusCode) ? err.statusCode
    : 500
  const code = status >= 400 && status <= 599 ? status : 500

  if (code >= 500) {
    console.error('[app] unhandled error:', err && err.stack ? err.stack : err)
  } else {
    console.warn('[app] request error:', code, err && err.message ? err.message : err)
  }

  if (res.headersSent) return next(err)
  res.status(code).type('text/plain').send(code >= 500 ? 'Internal Server Error' : 'Request Error')
})

const server = http.createServer(app);
server.listen(port);
wssServer(server, uuid);

server.on('listening', ()=>{
    console.log('listening on: http://127.0.0.1:' + server.address().port)
});
server.on('error', console.log);
