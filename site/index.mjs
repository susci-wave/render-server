import {getDir} from './tool.mjs'
import path from 'path'

let __dirname = getDir(import.meta.url)

function register(app){
    app.get('/', function(req,res){
        res.sendFile(path.join(__dirname, 'index.html'));
    })
    app.get('/index.html', function(req,res){
        res.sendFile(path.join(__dirname, 'index.html'));
    })
}
export default register


