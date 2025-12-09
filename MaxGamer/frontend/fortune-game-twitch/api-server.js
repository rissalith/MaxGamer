const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 中间件
app.use(cors());
app.use(express.json());

// 存储活跃的直播间连接
const activeRooms = new Map();
const pythonProcesses = new Map();

// 真实直播间监控（调用Python脚本）
class RealLiveRoomMonitor {
    constructor(liveId, io) {
        this.liveId = liveId;
        this.io = io;
        this.pythonProcess = null;
    }

    start() {
        console.log(`[√] 启动真实直播间监控: ${this.liveId}`);
        
        // 使用完整的Python路径
        const pythonCmd = 'C:\\Users\\SIEMENS\\AppData\\Local\\Programs\\Python\\Python314\\python.exe';
        const scriptPath = path.join(__dirname, '..', 'backend', 'test_live.py');
        
        // 启动Python进程
        this.pythonProcess = spawn(pythonCmd, [scriptPath, this.liveId], {
            cwd: path.join(__dirname, '..')
        });

        // 处理Python输出
        this.pythonProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[Python输出] ${output}`);
            
            // 尝试解析JSON消息
            try {
                const lines = output.split('\n');
                for (const line of lines) {
                    if (line.trim().startsWith('{')) {
                        const message = JSON.parse(line);
                        message.live_id = this.liveId;
                        console.log(`[→] 发送真实事件: ${message.type}`);
                        this.io.to(this.liveId).emit('live_message', message);
                    }
                }
            } catch (e) {
                // 不是JSON，忽略
            }
        });

        this.pythonProcess.stderr.on('data', (data) => {
            console.error(`[Python错误] ${data.toString()}`);
        });

        this.pythonProcess.on('close', (code) => {
            console.log(`[X] Python进程退出，代码: ${code}`);
            pythonProcesses.delete(this.liveId);
        });

        pythonProcesses.set(this.liveId, this.pythonProcess);
    }

    stop() {
        if (this.pythonProcess) {
            console.log(`[X] 停止真实直播间监控: ${this.liveId}`);
            this.pythonProcess.kill();
            this.pythonProcess = null;
            pythonProcesses.delete(this.liveId);
        }
    }
}

// API路由
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: '抖音直播间监控服务正在运行（Node.js模拟版）',
        version: '1.0.0',
        active_rooms: Array.from(activeRooms.keys())
    });
});

app.post('/api/live/start', (req, res) => {
    try {
        const { live_id } = req.body;
        
        if (!live_id) {
            return res.status(400).json({
                success: false,
                message: '缺少直播间ID'
            });
        }

        // 如果已经在监听，直接返回成功
        if (activeRooms.has(live_id)) {
            return res.json({
                success: true,
                message: `直播间 ${live_id} 已在监听中`,
                live_id: live_id
            });
        }

        // 创建真实监控器
        const monitor = new RealLiveRoomMonitor(live_id, io);
        activeRooms.set(live_id, monitor);
        
        try {
            monitor.start();
            console.log(`[√] 开始监听直播间: ${live_id}`);
            
            res.json({
                success: true,
                message: `成功开始监听直播间 ${live_id}（真实模式）`,
                live_id: live_id
            });
        } catch (error) {
            activeRooms.delete(live_id);
            throw error;
        }
    } catch (error) {
        console.error('[X] 启动失败:', error);
        res.status(500).json({
            success: false,
            message: `启动失败: ${error.message}`
        });
    }
});

app.post('/api/live/stop', (req, res) => {
    try {
        const { live_id } = req.body;
        
        if (!live_id) {
            return res.status(400).json({
                success: false,
                message: '缺少直播间ID'
            });
        }

        const monitor = activeRooms.get(live_id);
        if (monitor) {
            monitor.stop();
            activeRooms.delete(live_id);
            console.log(`[√] 停止监听直播间: ${live_id}`);
        }

        res.json({
            success: true,
            message: `已停止监听直播间 ${live_id}`
        });
    } catch (error) {
        console.error('[X] 停止失败:', error);
        res.status(500).json({
            success: false,
            message: `停止失败: ${error.message}`
        });
    }
});

app.get('/api/live/status', (req, res) => {
    res.json({
        success: true,
        active_rooms: Array.from(activeRooms.keys()),
        count: activeRooms.size
    });
});

// Socket.IO事件处理
io.on('connection', (socket) => {
    console.log(`[√] 客户端已连接: ${socket.id}`);
    
    socket.emit('connected', { message: '已连接到服务器' });

    socket.on('join', (liveId) => {
        socket.join(liveId);
        console.log(`[√] 客户端 ${socket.id} 加入房间: ${liveId}`);
        socket.emit('joined', { live_id: liveId, message: `已加入直播间 ${liveId}` });
    });

    socket.on('leave', (liveId) => {
        socket.leave(liveId);
        console.log(`[X] 客户端 ${socket.id} 离开房间: ${liveId}`);
        socket.emit('left', { live_id: liveId, message: `已离开直播间 ${liveId}` });
    });

    socket.on('disconnect', () => {
        console.log(`[X] 客户端已断开: ${socket.id}`);
    });
});

// 启动服务器
const PORT = 5001;
server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('抖音直播间监控服务启动中(Node.js + Python)...');
    console.log('='.repeat(50));
    console.log(`服务地址: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log('模式: 真实抖音直播间监控');
    console.log('需要Python环境和相关依赖');
    console.log('='.repeat(50));
});