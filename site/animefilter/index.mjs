import {getDir} from '../tool.mjs'
import path from 'path'
import express from 'express'

let __dirname = getDir(import.meta.url)

let listenUri = process.env['URI_AF'] || '/animefilter'

function register(app){
    console.log('register listen uri: '+ listenUri)
    app.use((req,res,next)=>{
        if(req.url == '/animefilter/index.html' || req.url == '/animefilter/'){
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        }
        next()
    })

    app.use(listenUri, express.static(path.resolve(__dirname, 'static')))

}
export default register