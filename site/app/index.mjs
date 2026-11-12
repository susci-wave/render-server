import {getDir} from '../tool.mjs'
import path from 'path'

let __dirname = getDir(import.meta.url)

function register(app){
    app.get('/favicon.ico', function(req,res){
        res.sendFile(path.join(__dirname, 'static/favicon.ico'));
    })
    app.get('/favicon.svg', function(req,res){
        res.sendFile(path.join(__dirname, 'static/favicon.svg'));
    })
    app.get('/', function(req,res){
        res.sendFile(path.join(__dirname, 'static/index.html'));
    })
    app.get('/index.html', function(req,res){
        res.sendFile(path.join(__dirname, 'static/index.html'));
    })
    app.get('/sites.js', function(req,res){
        res.sendFile(path.join(__dirname, 'static/sites.js'));
    })
    app.get('/saltline.html', function(req,res){
        res.sendFile(path.join(__dirname, 'static/saltline.html'));
    })
    app.get('/tidewright.html', function(req,res){
        res.sendFile(path.join(__dirname, 'static/tidewright.html'));
    })
    app.get('/clockmaker.html', function(req,res){
        res.sendFile(path.join(__dirname, 'static/clockmaker.html'));
    })
}
export default register


