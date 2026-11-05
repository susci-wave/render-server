import {getDir} from '../tool.mjs'
import path from 'path'
import express from 'express'

let __dirname = getDir(import.meta.url)
const listenUri = process.env['URI_HK1'] || '/it-tools'; // 编译内容中固定了

function register(app){
    console.log('register listen uri: '+ listenUri)

    app.use(listenUri, express.static(path.resolve(__dirname, 'pages')))
}
export default register