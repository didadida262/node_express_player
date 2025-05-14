const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // 引入 CORS 模块

const app = express();
const PORT = 3001;

// 使用 CORS 中间件
app.use(cors({
    origin: '*', // 允许所有域名进行跨域调用
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 允许的 HTTP 请求方法
    credentials: true // 允许携带凭证（如 cookies）
}));

// 视频文件路径，可替换为实际视频路径
const videoPath = path.join(__dirname, 'test.mp4');
// 深度搜索
async function deepreadDirectory(dirPath) {
    try {
        // 注意这里使用 fs.promises.readdir
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                const subFiles = await readDirectory(fullPath);
                files.push(...subFiles);
            } else {
                const fileType = path.extname(entry.name).replace('.', '') || 'unknown';
                files.push({
                    name: entry.name,
                    type: fileType,
                    fullPath: fullPath
                });
            }
        }

        return files;
    } catch (err) {
        console.error(`读取目录 ${dirPath} 时出错:`, err);
        return [];
    }
}

// 一级扫描
async function readDirectory(dirPath) {
    try {
        // 注意这里使用 fs.promises.readdir
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // if (entry.isDirectory()) {
            //     const subFiles = await readDirectory(fullPath);
            //     files.push(...subFiles);
            const fileType = path.extname(entry.name).replace('.', '') || 'unknown';
            files.push({
                name: entry.name,
                type: entry.isDirectory() ? 'dir' : fileType,
                fullPath: fullPath
            });
        }

        return files;
    } catch (err) {
        console.error(`读取目录 ${dirPath} 时出错:`, err);
        return [];
    }
}

app.get('/getFiles', async (req, res) => {
    const files = await readDirectory('D:\\RESP');
    console.log('files>>>', files)
    res.json(files);
})

app.get('/video', (req, res) => {
    console.log('接收到请求>>>')
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});