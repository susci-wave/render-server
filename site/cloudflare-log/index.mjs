import {getDir} from '../tool.mjs'
import path from 'path'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import dayjs from 'dayjs'
import express from 'express'

let __dirname = getDir(import.meta.url)

dayjs.extend(utc)
dayjs.extend(timezone)

let listenUri = process.env['URI_CFLOG'] || '/cloudflare-log'
let logCache = [];

function register(app){
    console.log('register listen uri: '+ listenUri)
    app.use(listenUri, express.static(path.resolve(__dirname, 'page')))
    app.use(listenUri, express.text())

    app.post(listenUri+'/push', function(req,res){
        logCache.push(dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')+"> "+req.body)
        if(logCache.length > 500) logCache.splice(0,200)
        res.end();
    });
    app.get(listenUri+'/pull', function(req,res){
        res.send(JSON.stringify(logCache))
        logCache=[];
    });
}
export default register