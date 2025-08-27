import {getDir} from '../tool.mjs'
import path from 'path'
import express from 'express'
import fs from 'node:fs'
import multer from 'multer';

// 创建 multer 实例
const upload = multer();

let listenUri = process.env['URI_FUND'] || '/fund'
let UPLOAD_TOKEN = process.env['FUND_UPLOAD_TOKEN']
let __dirname = getDir(import.meta.url)

function register(app){
    console.log('register listen uri: '+ listenUri)
    app.use(listenUri, express.static(path.resolve(__dirname, 'pages')))

    app.use(express.json());

    // 处理带文件的 form-data
    app.post(listenUri+'/push', upload.single('file'), (req, res) => {
        if(!UPLOAD_TOKEN || UPLOAD_TOKEN !== req.headers['x-fund-upload-token']){
            res.json({
                message: 'token is invalid',
            });
            return;
        }
        try {
            if(!req.file || !req.file.originalname){
                res.json({
                    message: '未指定文件',
                });
                return;
            }
            const { originalname, buffer } = req.file;
            
            if (!originalname || buffer === undefined) {
                return res.status(400).json({ 
                    success: false, 
                    message: '请提供文件名(originalname)和文件内容(buffer)' 
                });
            }

            const filePath = path.join(__dirname, 'pages/data/data-json/', originalname);

            fs.writeFileSync(filePath, buffer);

            res.json({
                success: true,
                message: '文件上传成功',
                filePath: filePath
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '文件上传失败',
                error: error.message
            });
        }
    })
}
export default register