function toSlessHeader(uuid, targetPort, targetHost) {
    let buffer = Buffer.alloc(2+ uuid.length + 2 + 2 + targetHost.length+4);
    buffer.writeUInt16LE(uuid.length, 0);
    buffer.write(uuid, 2, 'ascii');
    buffer.writeUInt16LE(targetPort, uuid.length+2);
    buffer.writeUInt16LE(targetHost.length, uuid.length+4);
    buffer.write(targetHost, uuid.length+6, 'ascii');
    buffer.writeUInt32LE(Math.floor(Date.now()/1000), uuid.length + 6 + targetHost.length);
    return buffer;
}

// 解析失败返回 null（不再抛 RangeError），调用方负责关闭连接
function fromSlessHeader(header) {
    if (!Buffer.isBuffer(header) || header.length < 8) return null;

    const uuidlength = header.readUInt16LE(0);
    if (uuidlength === 0 || uuidlength > 128) return null;

    const base = 2 + uuidlength;
    if (header.length < base + 6) return null;

    const targetPort = header.readUInt16LE(base);
    const targetHostLength = header.readUInt16LE(base + 2);
    if (!targetPort || !targetHostLength || targetHostLength > 255) return null;

    const hostEnd = base + 4 + targetHostLength;
    if (header.length < hostEnd + 4) return null;

    return {
        uuid: header.subarray(2, base).toString('ascii'),
        targetPort,
        targetHost: header.subarray(base + 4, hostEnd).toString('ascii'),
        timestamp: header.readUInt32LE(hostEnd) * 1000
    }
}
 
function readSocket(header){
    let j=0; 
    while(j++<header.length){
        if(header[j] === 0x0d && header[j+1] === 0x0a && header[j+2] === 0x0d && header[j+3] === 0x0a ){
            break;
        }
    }
    let body = header.slice(j);
    header = header.slice(0,j).toString();
    let lines = header.split('\r\n');
    let method = lines[0].split(' ')[0];
    let hostline = lines.filter(v=>v.startsWith('Host:'))[0].split(':').map(v=>v.trim());
    let host = hostline[1];
    let port = hostline.length == 3 ? parseInt(hostline[2]) : 80;
    lines[0] =  lines[0].replace('http://'+host[1]+(  host[2] ? (":"+host[2]) : '' ), '');

    data = Buffer.concat([Buffer.from(lines.join('\r\n')), body]);

    return {
        method, host, port, data
    }
}
let allowTypeVal = {'DEBUG': 0, 'INFO': 1, 'ERROR': 2}
function logFactory(cid, allowtype) {
    allowtype = allowTypeVal[allowtype || 'INFO'];
    return function(msgtype, msg){
        if(allowTypeVal[msgtype || 'INFO'] >= allowtype)
            console.info(`[${(new Date()).toLocaleString()}] [${cid}-${msgtype}] - ${msg}`);
    }
}

export default {
    toSlessHeader, fromSlessHeader, readSocket, logFactory
}
