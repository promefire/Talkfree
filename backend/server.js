const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// 中间件
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP在窗口期内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/ipfs', require('./routes/ipfs'));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: '服务器内部错误'
  });
});

// Socket.IO 连接处理
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 用户加入
  socket.on('join', (userData) => {
    connectedUsers.set(socket.id, {
      ...userData,
      socketId: socket.id,
      lastSeen: Date.now()
    });
    
    // 通知其他用户该用户上线
    socket.broadcast.emit('user_online', userData);
    
    console.log(`用户 ${userData.username} 已连接`);
  });
  
  // 加入聊天房间
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`用户加入聊天房间: ${chatId}`);
  });
  
  // 离开聊天房间
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
    console.log(`用户离开聊天房间: ${chatId}`);
  });
  
  // 发送消息
  socket.on('send_message', (messageData) => {
    // 转发消息到指定房间
    socket.to(messageData.chatId).emit('receive_message', messageData);
    console.log('消息已转发:', messageData);
  });
  
  // 输入状态
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user_typing', {
      userId: data.userId,
      username: data.username,
      isTyping: data.isTyping
    });
  });
  
  // 用户断开连接
  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      // 通知其他用户该用户下线
      socket.broadcast.emit('user_offline', userData);
      connectedUsers.delete(socket.id);
      console.log(`用户 ${userData.username} 已断开连接`);
    }
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;