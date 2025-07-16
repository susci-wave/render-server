import net from 'net'
import * as WebSocket from 'ws'
import slessTool from './sless-tools.mjs'

let uuid = '';
let uuid2 = '';

let i = 100000;
let appLog = slessTool.logFactory(i,'INFO');

function slessConnect(ws){
    let log = slessTool.logFactory('SLESS-'+ ++i,'INFO');
    log('INFO', "on connection");
    ws.once('message', msg => {
        let opts = slessTool.fromSlessHeader(msg)
        log('DEBUG',`on message: ${msg.length} ${uuid} ${opts.uuid} ${opts.targetHost} ${opts.targetPort} ${opts.timestamp}`);
        if(opts.uuid !== uuid || opts.timestamp < Date.now() - 1000*60){
            log('ERROR', "uuid is invalid");
            ws.send(Buffer.from('Time:' + new Date()));
            ws.close();
            return;
        }
        log('INFO',`connect to ${opts.targetHost}:${opts.targetPort}`);
        const duplex = WebSocket.createWebSocketStream(ws);
        net.connect({ host: opts.targetHost, port: opts.targetPort }, function () {
            ws.send([0,0]);
            this.once('error', err=>{
                log('ERROR', `NET TO WS ERROR: ${err.code}: ${err.message}\r\n${err}`);
                duplex.end();duplex.destroy();
            });
            duplex.once('error', err=>{
                log('ERROR', `WS TO NET ERROR: ${err.code}: ${err.message}\r\n${err}`);
                this.end();this.destroy();
            });
            duplex.pipe(this);
            this.pipe(duplex);
        }).on('error', err=>{
            log('ERROR', `NET CONN ERROR> ${opts.targetHost}:${opts.targetPort} : ${err.code}: ${err.message}\r\n${err}`);
        });
    }).on('error', err=>{
        log('ERROR', `WSS ERROR: ${err.code}: ${err.message}\r\n${err}`);
    });
}

function vlessConnect(ws){
    let log = slessTool.logFactory('VLESS-'+ ++i,'INFO');
    log('INFO', "on connection");
    ws.once('message', msg => {
        const [VERSION] = msg;
        const id = msg.slice(1, 17);
        if (!id.every((v, i) => v === parseInt(uuid2.substr(i * 2, 2), 16))){
            log('ERROR', "uuid is invalid");
            ws.send(Buffer.from('Time:' + new Date()));
            ws.close();
            return;
        }
        let i = msg.slice(17, 18).readUInt8() + 19;
        const targetPort = msg.slice(i, i += 2).readUInt16BE(0);
        const ATYP = msg.slice(i, i += 1).readUInt8();
        const host = ATYP === 1 ? msg.slice(i, i += 4).join('.') : // IPV4
            (ATYP === 2 ? new TextDecoder().decode(msg.slice(i + 1, i += 1 + msg.slice(i, i + 1).readUInt8())) : // domain
                (ATYP === 3 ? msg.slice(i, i += 16).reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), []).map(b => b.readUInt16BE(0).toString(16)).join(':') : '')); // IPV6

        log('INFO',`connect to ${host}:${targetPort}`);
        const duplex = WebSocket.createWebSocketStream(ws);
        net.connect({ host, port: targetPort }, function () {
            ws.send(new Uint8Array([VERSION, 0]));
            this.once('error', err=>{
                log('ERROR', `NET TO WS ERROR: ${err.code}: ${err.message}\r\n${err}`);
                duplex.end();duplex.destroy();
            });
            duplex.once('error', err=>{
                log('ERROR', `WS TO NET ERROR: ${err.code}: ${err.message}\r\n${err}`);
                this.end();this.destroy();
            });
            this.write(msg.slice(i));
            duplex.pipe(this);
            this.pipe(duplex);
        }).on('error', err=>{
            log('ERROR', `NET CONN ERROR> ${host}:${targetPort} : ${err.code}: ${err.message}\r\n${err}`);
        });
    }).on('error', err=>{
        log('ERROR', `WSS ERROR: ${err.code}: ${err.message}\r\n${err}`);
    });
}

export default (server, _uuid) => {
    if(!_uuid){
        appLog('ERROR', "uuid is unset!");
        return;
    }
    uuid = _uuid;
    uuid2 = _uuid.replaceAll('-','')

    new WebSocket.WebSocketServer({ server })
    .on('connection', (wss,req)=>{
        req.headers['x-sless'] ? slessConnect(wss) : vlessConnect(wss);
    });
    appLog('INFO', "WS Server is running!");
}