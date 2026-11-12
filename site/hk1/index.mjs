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

// 内存注册表的硬上限，避免未认证接口被用来无限占用内存
const MAX_APPS = 200
const MAX_URLS = 20
const MAX_GID_LEN = 64
const MAX_NAME_LEN = 64
const MAX_URL_LEN = 2048

// 使用 Map 而不是普通对象：gid 不再作为对象键，避免 __proto__ 等键污染原型
const apps = new Map()

function fail(res, code, msg) {
    return res.status(code).json({status:'01', msg})
}

function register(app){
    console.log('register listen uri: '+ listenUri)
    app.use(listenUri, express.static(path.resolve(__dirname, 'page')))
    app.use(listenUri, express.json({limit: '64kb'}))

    app.get(listenUri+'/svrs', function(req,res){
        res.json(Array.from(apps.values()))
    })
    app.post(listenUri+'/reg', function(req,res,next){
        try {
            const body = req.body
            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                return fail(res, 400, 'invalid body')
            }

            const gid = typeof body.gid === 'string' ? body.gid.trim() : ''
            if (!gid || gid.length > MAX_GID_LEN) {
                return fail(res, 400, 'gid is required')
            }

            const gname = body.gname == null ? '' : body.gname
            if (typeof gname !== 'string' || gname.trim().length > MAX_NAME_LEN) {
                return fail(res, 400, 'invalid gname')
            }

            if (!Array.isArray(body.urls)) {
                return fail(res, 400, 'urls must be an array')
            }
            if (body.urls.length > MAX_URLS) {
                return fail(res, 400, 'too many urls')
            }
            if (!apps.has(gid) && apps.size >= MAX_APPS) {
                return fail(res, 429, 'too many apps')
            }

            const urls = []
            for (const item of body.urls) {
                if (!item || typeof item !== 'object' || Array.isArray(item)) {
                    return fail(res, 400, 'invalid url item')
                }

                const name = typeof item.name === 'string' ? item.name.trim() : ''
                if (!name || name.length > MAX_NAME_LEN) {
                    return fail(res, 400, 'invalid url name')
                }

                const rawUrl = typeof item.url === 'string' ? item.url.trim() : ''
                if (!rawUrl || rawUrl.length > MAX_URL_LEN) {
                    return fail(res, 400, 'invalid url')
                }

                let parsed
                try {
                    parsed = new URL(rawUrl)
                } catch {
                    return fail(res, 400, 'invalid url')
                }
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                    return fail(res, 400, 'only http/https url is allowed')
                }

                urls.push({name, url: parsed.href})
            }

            apps.set(gid, {
                gid,
                gname: gname.trim(),
                urls:[
                    {name:'U-TIME',url: dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')},
                    ...urls
                ],
            })
            res.json({status:'00'})
        } catch (err) {
            next(err)
        }
    })

    // console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    // console.log(dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))
    // console.log(dayjs().add(8,'hours').tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))
}
export default register