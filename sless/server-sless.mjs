import net from 'net'
import * as WebSocket from 'ws'
import slessTool from './sless-tools.mjs'

let uuid = '';
let uuid2 = '';

let i = 100000;
let appLog = slessTool.logFactory(i,'INFO');

const AUTH_WINDOW_MS = 60 * 1000;
// 单帧上限：默认 100MB 容易被滥用；正常隧道分片远小于该值
const MAX_PAYLOAD = 1024 * 1024;

function closeQuietly(ws, code, reason) {
    try { ws.close(code, reason) } catch {}
}

function logError(log, prefix, err) {
    log('ERROR', `${prefix}: ${err && err.stack ? err.stack : err}`);
}

// 解析 VLESS 首帧，格式非法时返回 null（不抛异常）
function parseVlessRequest(msg) {
    if (!Buffer.isBuffer(msg) || msg.length < 18) return null;

    const version = msg[0];
    const id = msg.subarray(1, 17);
    // version(1) + uuid(16) + addonsLen(1) + addons + command(1)
    let i = 19 + msg[17];
    if (i + 3 > msg.length) return null;

    const targetPort = msg.readUInt16BE(i);
    i += 2;
    const atyp = msg[i];
    i += 1;

    let host;
    if (atyp === 1) { // IPv4
        if (i + 4 > msg.length) return null;
        host = Array.from(msg.subarray(i, i + 4)).join('.');
        i += 4;
    } else if (atyp === 2) { // domain
        if (i + 1 > msg.length) return null;
        const len = msg[i];
        i += 1;
        if (len === 0 || i + len > msg.length) return null;
        host = msg.subarray(i, i + len).toString('utf8');
        i += len;
    } else if (atyp === 3) { // IPv6
        if (i + 16 > msg.length) return null;
        const groups = [];
        for (let g = 0; g < 8; g++) groups.push(msg.readUInt16BE(i + g * 2).toString(16));
        host = groups.join(':');
        i += 16;
    } else {
        return null;
    }

    if (!targetPort || !host) return null;
    return { version, id, host, targetPort, payload: msg.subarray(i) };
}

// 定长比较，避免逐字节短路带来的时序差
function uuidMatches(id) {
    if (typeof uuid2 !== 'string' || uuid2.length !== 32) return false;
    let diff = 0;
    for (let n = 0; n < 16; n++) {
        diff |= id[n] ^ parseInt(uuid2.substr(n * 2, 2), 16);
    }
    return diff === 0;
}

// 建立到目标 TCP 的连接，并把 ws 与 socket 双向对接
function openTunnel(ws, log, targetHost, targetPort, reply, initialPayload) {
    const duplex = WebSocket.createWebSocketStream(ws);

    let socket;
    try {
        socket = net.connect({ host: targetHost, port: targetPort });
    } catch (err) {
        logError(log, 'NET CONNECT THROW', err);
        duplex.destroy();
        closeQuietly(ws, 1011, 'connect failed');
        return;
    }

    socket.on('error', err => {
        logError(log, 'NET TO WS ERROR', err);
        duplex.destroy();
        closeQuietly(ws, 1011, 'connect failed');
    });

    duplex.on('error', err => {
        logError(log, 'WS TO NET ERROR', err);
        socket.destroy();
    });

    ws.once('close', () => {
        socket.destroy();
        duplex.destroy();
    });

    socket.once('connect', () => {
        try {
            ws.send(reply);
            if (initialPayload && initialPayload.length > 0) socket.write(initialPayload);
        } catch (err) {
            logError(log, 'WS SEND ERROR', err);
            socket.destroy();
            duplex.destroy();
            closeQuietly(ws, 1011, 'send failed');
            return;
        }

        duplex.pipe(socket);
        socket.pipe(duplex);
    });
}

function slessConnect(ws){
    let log = slessTool.logFactory('SLESS-'+ ++i,'INFO');
    log('INFO', "on connection");

    ws.once('message', msg => {
        try {
            const opts = slessTool.fromSlessHeader(msg);
            if (!opts) {
                log('ERROR', 'invalid sless header');
                closeQuietly(ws, 1002, 'invalid frame');
                return;
            }

            log('DEBUG', `on message: ${msg.length} ${opts.targetHost} ${opts.targetPort} ${opts.timestamp}`);
            if(opts.uuid !== uuid || opts.timestamp < Date.now() - AUTH_WINDOW_MS){
                log('ERROR', "uuid is invalid");
                try { ws.send(Buffer.from('Time:' + new Date())) } catch {}
                closeQuietly(ws, 1008, 'auth failed');
                return;
            }

            log('INFO', `connect to ${opts.targetHost}:${opts.targetPort}`);
            openTunnel(ws, log, opts.targetHost, opts.targetPort, Buffer.from([0,0]), null);
        } catch (err) {
            logError(log, 'SLESS HANDLER ERROR', err);
            closeQuietly(ws, 1002, 'invalid frame');
        }
    }).on('error', err=>{
        logError(log, 'WSS ERROR', err);
    });
}

function vlessConnect(ws){
    let log = slessTool.logFactory('VLESS-'+ ++i,'INFO');
    log('INFO', "on connection");

    ws.once('message', msg => {
        try {
            const req = parseVlessRequest(msg);
            if (!req) {
                log('ERROR', 'invalid vless frame');
                closeQuietly(ws, 1002, 'invalid frame');
                return;
            }

            if (!uuidMatches(req.id)) {
                log('ERROR', "uuid is invalid");
                try { ws.send(Buffer.from('Time:' + new Date())) } catch {}
                closeQuietly(ws, 1008, 'auth failed');
                return;
            }

            log('INFO', `connect to ${req.host}:${req.targetPort}`);
            openTunnel(ws, log, req.host, req.targetPort, new Uint8Array([req.version, 0]), req.payload);
        } catch (err) {
            logError(log, 'VLESS HANDLER ERROR', err);
            closeQuietly(ws, 1002, 'invalid frame');
        }
    }).on('error', err=>{
        logError(log, 'WSS ERROR', err);
    });
}

export default (server, _uuid) => {
    if(!_uuid){
        appLog('ERROR', "uuid is unset!");
        return;
    }
    uuid = _uuid;
    uuid2 = _uuid.replaceAll('-','')

    const wss = new WebSocket.WebSocketServer({ server, maxPayload: MAX_PAYLOAD });
    wss.on('error', err => {
        appLog('ERROR', `WSS SERVER ERROR: ${err && err.message ? err.message : err}`);
    });
    wss.on('connection', (ws, req)=>{
        (req.headers['x-sless'] || req.headers['cookie']?.indexOf('x-sless=1') > -1) ? slessConnect(ws) : vlessConnect(ws);
    });
    appLog('INFO', "WS Server is running!");
}
