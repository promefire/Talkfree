# Web3 Chat API 文档

## 概述

Web3 Chat 是一个基于区块链的点对点聊天应用，提供安全、去中心化的通信服务。

## 基础信息

- **基础URL**: `http://localhost:3001/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证 API

### 生成签名消息

```http
GET /auth/message
```

**响应**:
```json
{
  "message": "请签名此消息以验证您的身份: 1234567890"
}
```

### 验证钱包签名

```http
POST /auth/verify
```

**请求体**:
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "signature": "0x...",
  "message": "请签名此消息以验证您的身份: 1234567890"
}
```

**响应**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "address": "0x1234567890123456789012345678901234567890",
    "username": "用户名"
  }
}
```

## 用户 API

### 获取用户资料

```http
GET /users/profile
Authorization: Bearer <token>
```

**响应**:
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "username": "用户名",
  "publicKey": "0x...",
  "status": "online",
  "createdAt": 1234567890
}
```

### 搜索用户

```http
GET /users/search?query=用户名
Authorization: Bearer <token>
```

**响应**:
```json
[
  {
    "address": "0x1234567890123456789012345678901234567890",
    "username": "用户名",
    "status": "online"
  }
]
```

### 获取好友列表

```http
GET /users/friends
Authorization: Bearer <token>
```

**响应**:
```json
[
  {
    "address": "0x1234567890123456789012345678901234567890",
    "username": "好友名",
    "status": "online",
    "lastMessage": "最后一条消息",
    "unreadCount": 2,
    "lastMessageTime": 1234567890
  }
]
```

## 消息 API

### 获取个人消息

```http
GET /messages/personal/:friendAddress?page=1&limit=20
Authorization: Bearer <token>
```

**响应**:
```json
{
  "messages": [
    {
      "id": "msg_123",
      "from": "0x1234567890123456789012345678901234567890",
      "to": "0x0987654321098765432109876543210987654321",
      "content": "消息内容",
      "timestamp": 1234567890,
      "encrypted": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

### 发送个人消息

```http
POST /messages/personal
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "to": "0x0987654321098765432109876543210987654321",
  "content": "消息内容",
  "encrypted": true
}
```

**响应**:
```json
{
  "success": true,
  "messageId": "msg_123",
  "timestamp": 1234567890
}
```

### 获取群组消息

```http
GET /messages/group/:groupId?page=1&limit=20
Authorization: Bearer <token>
```

### 发送群组消息

```http
POST /messages/group
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "groupId": "group_123",
  "content": "消息内容"
}
```

## 群组 API

### 创建群组

```http
POST /groups
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "name": "群组名称",
  "description": "群组描述",
  "members": ["0x1234567890123456789012345678901234567890"]
}
```

**响应**:
```json
{
  "success": true,
  "groupId": "group_123",
  "name": "群组名称",
  "description": "群组描述",
  "members": ["0x1234567890123456789012345678901234567890"],
  "createdAt": 1234567890
}
```

### 获取群组信息

```http
GET /groups/:groupId
Authorization: Bearer <token>
```

### 添加群组成员

```http
POST /groups/:groupId/members
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "memberAddress": "0x1234567890123456789012345678901234567890"
}
```

### 移除群组成员

```http
DELETE /groups/:groupId/members/:memberAddress
Authorization: Bearer <token>
```

## IPFS API

### 上传数据到IPFS

```http
POST /ipfs/upload
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "data": "要上传的数据",
  "encrypt": true
}
```

**响应**:
```json
{
  "success": true,
  "hash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "size": 1024,
  "encrypted": true
}
```

### 从IPFS获取数据

```http
GET /ipfs/get/:hash?decrypt=true
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": "获取的数据",
  "hash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "decrypted": true
}
```

## WebSocket 事件

### 连接

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 事件列表

#### 客户端发送事件

- `join-chat`: 加入聊天房间
- `leave-chat`: 离开聊天房间
- `send-message`: 发送消息
- `typing-start`: 开始输入
- `typing-stop`: 停止输入

#### 服务端发送事件

- `message-received`: 收到新消息
- `user-online`: 用户上线
- `user-offline`: 用户下线
- `typing-indicator`: 输入状态指示

### 示例

```javascript
// 加入聊天房间
socket.emit('join-chat', {
  type: 'personal', // 或 'group'
  chatId: 'friend-address-or-group-id'
});

// 发送消息
socket.emit('send-message', {
  type: 'personal',
  to: 'friend-address',
  content: '消息内容'
});

// 监听新消息
socket.on('message-received', (message) => {
  console.log('收到新消息:', message);
});
```

## 错误处理

所有API错误都会返回以下格式：

```json
{
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": "详细错误信息"
}
```

### 常见错误码

- `401`: 未授权
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误
- `429`: 请求频率限制

## 速率限制

- 认证API: 每分钟10次请求
- 消息API: 每分钟100次请求
- 其他API: 每分钟50次请求