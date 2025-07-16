import {getDir} from '../tool.mjs'
import path from 'path'
import express from 'express'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

let listenUri = process.env['URI_HK1'] || 'hk1-app'
let __dirname = getDir(import.meta.url)
let apps = {}

function register(app){
    console.log('register listen uri: '+ listenUri)
    app.use(listenUri, express.static(path.resolve(__dirname, 'page')))
    app.use(listenUri, express.json())

    app.get(listenUri+'/svrs', function(req,res){
        res.send(JSON.stringify(Object.keys(apps).map(key=>apps[key])))
    })
    app.post(listenUri+'/reg', function(req,res){
        if(!req.body.gid){
            return res.send('{"status":"01","msg":"gid is required"}')
        }

        apps[req.body.gid] = {
            gid:req.body.gid,
            gname:req.body.gname,
            urls:[ 
                {name:'U-TIME',url: dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')},
                ...req.body.urls.map(v=>({name:v.name,url:v.url}))
            ],
        }
        res.send(JSON.stringify({status:'00'}))
        // res.send(JSON.stringify(apps))
    })

    // console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    // console.log(dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))
    // console.log(dayjs().add(8,'hours').tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))
}
export default register