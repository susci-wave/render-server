import http from 'http'
import express from 'express'

import wssServer from './sless/server-sless.mjs'

import site_app from './site/index.mjs'
import animefilter_app from './site/animefilter/index.mjs'
import api_tool_app from './site/api-tools/index.mjs'
import cflog_app from './site/cloudflare-log/index.mjs'
import fund_app from './site/fund/index.mjs'
import hk1_app from './site/hk1/index.mjs'
import it_tool_app from './site/it-tools/index.mjs'

const uuid = process.env.SLESS_UUID;
const port = process.env.APP_PORT || 80;
const app = express();

site_app(app)
animefilter_app(app)
api_tool_app(app)
cflog_app(app)
fund_app(app)
hk1_app(app)
it_tool_app(app)

const server = http.createServer(app);
server.listen(port);
wssServer(server, uuid);

server.on('listening', ()=>{
    console.log('listening on: http://127.0.0.1:' + server.address().port)
});
server.on('error', console.log);
