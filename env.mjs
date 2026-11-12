import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {fileURLToPath} from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(rootDir, '.env')

// 生成随机地址
function randomUrl(prefix) {
    return prefix + crypto.randomBytes(8).toString('hex')
}

// 初始化默认配置（value 为函数时表示每次启动按需随机生成）
const CONFIG_VALS = [
    {key: 'APP_PORT', value: '8080', desc: '端口'},
    {key: 'REDIRECT_HOST', value: '', desc: '强制跳转 HTTPS 的域名（如 xxx.serv00.net，留空则不启用）'},
    {key: 'URI_AF', value: '/animefilter', desc: 'animefilter 地址'},
    {key: 'URI_IT_TOOLS', value: '/it-tools', desc: 'it-tools 地址'},

    {key: 'SLESS_UUID', value: () => crypto.randomUUID(), desc: 'sless的UUID'},
    {key: 'URI_CFLOG', value: () => randomUrl('/cloudflare_'), desc: 'cflog地址'},
    {key: 'URI_FUND', value: () => randomUrl('/fund_'), desc: 'fund地址'},
    {key: 'URI_HK1', value: () => randomUrl('/hk1_'), desc: 'hk1地址'},
    {key: 'URI_API', value: () => randomUrl('/api_'), desc: 'api地址'},
]

// Node < 20.12 的兜底读取（规则同原 app.js：忽略空行/注释，去掉值两侧引号，已有环境变量优先）
function loadEnvFileFallback() {
    let content
    try {
        content = fs.readFileSync(envPath, 'utf8')
    } catch (err) {
        console.warn(`[env] 读取 .env 失败：${err.message}`)
        return
    }

    for (let line of content.split(/\r?\n/)) {
        line = line.trim()
        if (!line || line.startsWith('#')) continue

        const i = line.indexOf('=')
        if (i === -1) continue

        const key = line.slice(0, i).trim()
        const val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
        if (process.env[key] === undefined) process.env[key] = val
    }
}

// 判断存在，存在则读取：优先用 Node 内置 process.loadEnvFile，没有再用兜底实现
const envExists = fs.existsSync(envPath)
if (envExists) {
    if (typeof process.loadEnvFile === 'function') {
        try {
            process.loadEnvFile(envPath)
        } catch (err) {
            console.warn(`[env] process.loadEnvFile 读取失败，改用兜底解析：${err.message}`)
            loadEnvFileFallback()
        }
    } else {
        loadEnvFileFallback()
    }
}

// 已有的不覆盖，缺失的按默认值/随机值补齐
const missing = []
for (const item of CONFIG_VALS) {
    if (process.env[item.key] !== undefined) continue
    process.env[item.key] = typeof item.value === 'function' ? item.value() : item.value
    missing.push(item)
}

function buildLines(items) {
    return items.flatMap((item) => [`# ${item.desc}`, `${item.key}=${process.env[item.key]}`])
}

// 文件不存在时创建；存在但缺少配置时只追加缺失项，不覆盖已有值
try {
    if (!envExists && missing.length > 0) {
        const header = [
            '# 由 env.mjs 自动生成，请勿提交到仓库',
            '# 修改后重启生效；SLESS_UUID 泄露需重新生成并同步客户端',
            '',
        ]
        fs.writeFileSync(envPath, [...header, ...buildLines(CONFIG_VALS), ''].join('\n'), {
            encoding: 'utf8',
            mode: 0o600,
        })
        console.log(`[env] .env 不存在，已自动生成：${envPath}`)
    } else if (missing.length > 0) {
        fs.appendFileSync(envPath, buildLines(missing).join('\n') + '\n', 'utf8')
        console.log(`[env] .env 缺少 ${missing.length} 项，已追加：${missing.map((i) => i.key).join(', ')}`)
    }
} catch (err) {
    // 只读文件系统或权限不足时不阻断启动，交给平台环境变量
    console.warn(`[env] 无法写入 .env（本次生成的值重启后会变）：${err.message}`)
}
