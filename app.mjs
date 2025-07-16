import http from 'http'
import express from 'express'
import path from 'path'
import hk1_app from './site/hk1-app/index.mjs'
import cloudFlareLog from './site/cloudflare-log/index.mjs'
import animefilter from './site/animefilter/index.mjs'
import wssServer from './sless/server-sless.mjs'

const uuid = process.env.UUID;
const port = process.env.APP_PORT || 80;
const app = express();

hk1_app(app)
cloudFlareLog(app)
animefilter(app)

app.get('/', function(req,res){
    res.sendStatus(200)
})

app.get('/favicon.ico', function(req,res){
    res.sendFile(path.resolve('.', 'site/favicon.ico'))
})

const server = http.createServer(app);
console.log('using port:'+port)
server.listen(port);

wssServer(server, uuid);

server.on('error', console.log);
server.on('listening', ()=>{
    console.log('listening on:' + server.address().port)
});
