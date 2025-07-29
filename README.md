# Web3 Chat - 区块链点对点聊天应用

这是一个基于区块链技术的点对点聊天应用，提供安全、去中心化的通信方式。

## 🚀 功能特点

- **🔐 账户管理**：创建账户、备份账户、PIN码保护
- **👥 好友系统**：添加好友、管理联系人、好友请求
- **💬 私聊功能**：端到端加密的一对一聊天
- **👨‍👩‍👧‍👦 群组聊天**：创建和管理群组、群组成员管理
- **🔒 区块链安全**：利用以太坊区块链保证消息的安全性和不可篡改性
- **🌐 去中心化存储**：使用IPFS存储消息内容和文件
- **⚡ 实时通信**：WebSocket实时消息推送
- **📱 响应式设计**：支持桌面和移动设备

## 🛠 技术栈

### 前端
- React.js 18
- Material-UI (MUI)
- Web3.js / Ethers.js
- Socket.IO Client

### 后端
- Node.js + Express
- Socket.IO
- JWT认证
- IPFS HTTP Client

### 区块链
- Solidity 0.8.19
- Hardhat
- OpenZeppelin Contracts
- Ethereum

### 存储
- IPFS (去中心化文件存储)
- 区块链 (消息索引和用户数据)

## 📁 项目结构

```
web3-chat/
├── contracts/                 # 智能合约
│   ├── UserAccount.sol       # 用户账户合约
│   ├── AccountManager.sol    # 账户管理合约
│   └── MessageManager.sol    # 消息管理合约
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── contexts/         # React Context
│   │   ├── pages/           # 页面组件
│   │   └── utils/           # 工具函数
│   └── package.json
├── backend/                  # Node.js后端服务
│   ├── routes/              # API路由
│   ├── middleware/          # 中间件
│   ├── server.js           # 服务器入口
│   └── package.json
├── scripts/                 # 部署和工具脚本
│   ├── deploy.js           # 合约部署脚本
│   ├── setup.js            # 项目设置脚本
│   └── package.json
├── docs/                    # 项目文档
│   └── API.md              # API文档
├── hardhat.config.js       # Hardhat配置
└── package.json            # 根目录配置
```

## 🚀 快速开始

### 前提条件

- Node.js v16+ 
- npm 或 yarn
- MetaMask 浏览器扩展
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone <your-repo-url>
cd web3-chat
```

2. **项目初始化**
```bash
# 运行设置脚本
node scripts/setup.js

# 安装所有依赖
npm run install-all
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp backend/env.example backend/.env

# 编辑环境变量文件
# 配置以太坊RPC URL、私钥、IPFS等
```

4. **编译和部署智能合约**
```bash
# 编译合约
npm run compile

# 部署到本地网络
npm run deploy
```

5. **启动开发服务器**
```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:frontend  # 前端: http://localhost:3000
npm run dev:backend   # 后端: http://localhost:3001
```

## 📖 使用指南

### 1. 连接钱包
- 安装MetaMask扩展
- 创建或导入钱包
- 连接到应用

### 2. 创建账户
- 设置用户名
- 生成恢复短语
- 设置PIN码保护

### 3. 添加好友
- 通过地址或用户名搜索
- 发送好友请求
- 管理好友列表

### 4. 开始聊天
- 选择好友开始私聊
- 创建群组进行群聊
- 发送文本、文件等

### 5. 账户安全
- 备份恢复短语
- 定期更改PIN码
- 保护私钥安全

## 🔧 开发指南

### 智能合约开发

```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到测试网
npx hardhat run scripts/deploy.js --network sepolia
```

### 前端开发

```bash
cd frontend

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

### 后端开发

```bash
cd backend

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

## 📚 API文档

详细的API文档请查看 [docs/API.md](docs/API.md)

### 主要API端点

- `POST /api/auth/verify` - 钱包签名验证
- `GET /api/users/profile` - 获取用户资料
- `POST /api/messages/personal` - 发送私人消息
- `POST /api/groups` - 创建群组
- `POST /api/ipfs/upload` - 上传文件到IPFS

## 🔐 安全特性

- **端到端加密**：消息在发送前加密
- **区块链验证**：所有操作通过智能合约验证
- **去中心化存储**：文件存储在IPFS网络
- **钱包签名**：使用以太坊钱包进行身份验证
- **PIN码保护**：本地数据额外保护层

## 🌐 网络支持

- Ethereum Mainnet
- Sepolia Testnet
- Polygon
- BSC (Binance Smart Chain)
- 本地开发网络

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如果您遇到问题或有疑问：

1. 查看 [Issues](https://github.com/yourusername/web3-chat/issues)
2. 创建新的 Issue
3. 联系开发团队

## 🗺 路线图

- [ ] 移动端应用 (React Native)
- [ ] 语音/视频通话
- [ ] NFT头像支持
- [ ] 多链支持
- [ ] 去中心化域名集成
- [ ] 消息加密增强

---

**注意**：这是一个演示项目，请在生产环境中使用前进行充分的安全审计。