import {getDir} from '../tool.mjs'
import path from 'path'
import express from 'express'


let listenUri = process.env['URI_FUND'] || '/fund'
let __dirname = getDir(import.meta.url)

function register(app){
    console.log('register listen uri: '+ listenUri)
    app.use(listenUri, express.static(path.resolve(__dirname, 'pages')))
}
export default register