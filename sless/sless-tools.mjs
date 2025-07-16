function toSlessHeader(uuid, targetPort, targetHost) {
    let buffer = Buffer.alloc(2+ uuid.length + 2 + 2 + targetHost.length+4);
    buffer.writeUInt16LE(uuid.length, 0);
    buffer.set(uuid, 2);
    buffer.writeUInt16LE(targetPort, uuid.length+2);
    buffer.writeUInt16LE(targetHost.length, uuid.length+4);
    buffer.set(targetHost, uuid.length+6);
    buffer.writeUInt32LE(Date.now()/1000, uuid.length + 6 + targetHost.length);
    return buffer;
}

function fromSlessHeader(header) {
    let uuidlength = header.readUInt16LE(0);
    let uuid = header.slice(2, 2+uuidlength).toString('ascii');
    let targetPort = header.readUInt16LE(2+uuidlength);
    let targetHostLength = header.readUInt16LE(2+uuidlength+2);
    let targetHost = header.slice(uuidlength+6, uuidlength+6 + targetHostLength).toString('ascii');
    let timestamp = header.readUInt32LE(uuidlength+6+targetHostLength)*1000;
    return {
        uuid,
        targetPort,
        targetHost,
        timestamp
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
