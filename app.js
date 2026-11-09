
# 用于serv00.com和node<=16

const fs = require('fs');
const path = require('path');
env_file = path.resolve('.env')

if (!fs.existsSync(env_file)){
    console.error('.env not found!');
}

for (let line of fs.readFileSync(env_file, 'utf8').split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = val;
}

async function loadModule() {
  const module = await import('./app.mjs');
  console.log(module);
}
loadModule();

