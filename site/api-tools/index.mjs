import {getDir} from '../tool.mjs'
import path from 'path'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import dayjs from 'dayjs'
import express from 'express'

let __dirname = getDir(import.meta.url)

dayjs.extend(utc)
dayjs.extend(timezone)

let listenUri = process.env['URI_API'] || '/api-tool'

function register(app){
    console.log('register listen uri: '+ listenUri)
    
    app.get(listenUri+'/get-data', function(req,res){
        let result = Array.from({length: 1024}, () => Math.floor(Math.random() * 256));
    
        res.send(JSON.stringify({status:'00', data: result}))
    })
}
export default register