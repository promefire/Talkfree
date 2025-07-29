# Web3 Chat 安装部署完整指南

本文档提供了 Web3 Chat 项目的完整安装、配置和部署流程。

## 📋 系统要求

### 必需软件
- **Node.js**: 版本 16.0 或更高
- **npm**: 版本 8.0 或更高
- **Git**: 用于克隆项目
- **MetaMask**: 浏览器钱包插件

### 推荐配置
- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **内存**: 至少 4GB RAM
- **存储**: 至少 2GB 可用空间
- **浏览器**: Chrome, Firefox, Edge (最新版本)

## 🚀 快速开始

### 1. 克隆项目

```bash
# 克隆仓库
git clone <repository-url>
cd Talkfree
```

### 2. 安装依赖

```bash
# 安装所有项目依赖（推荐）
npm run install-all

# 或者分别安装
npm install                    # 根目录依赖
cd frontend && npm install     # 前端依赖
cd ../backend && npm install   # 后端依赖
cd ../scripts && npm install   # 脚本依赖
```

### 3. 配置环境

#### 3.1 后端环境配置

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# IPFS配置
IPFS_API_URL=http://localhost:5001

# CORS配置
CORS_ORIGIN=http://localhost:3000
```

#### 3.2 IPFS 节点配置

**下载并安装 IPFS (Kubo)**

1. 访问 [IPFS官网](https://ipfs.tech/install/) 下载 Kubo
2. 解压到项目目录的 `kubo` 文件夹
3. 初始化 IPFS 节点：

```bash
cd kubo
./ipfs init
```

**配置 CORS 设置**

```bash
# 停止 IPFS 守护进程（如果正在运行）
./ipfs shutdown

# 配置 CORS
./ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000", "http://127.0.0.1:3000", "https://webui.ipfs.io"]'
./ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
```

### 4. 启动服务

#### 4.1 启动区块链网络

```bash
# 在项目根目录启动本地区块链
npx hardhat node --verbose
```

保持此终端运行，它将显示本地区块链的账户信息。

#### 4.2 启动 IPFS 节点

```bash
# 新开终端，启动 IPFS 守护进程
cd kubo
./ipfs daemon
```

#### 4.3 部署智能合约

```bash
# 新开终端，部署合约
npm run redeploy
```

成功部署后，合约地址会自动更新到前端配置文件。

#### 4.4 启动前端应用

```bash
# 启动前端开发服务器
cd frontend
npm start
```

前端应用将在 `http://localhost:3000` 启动。

#### 4.5 启动后端服务（可选）

```bash
# 新开终端，启动后端服务
cd backend
npm run dev
```

后端服务将在 `http://localhost:3001` 启动。

## 🔧 详细配置

### MetaMask 配置

1. **安装 MetaMask 浏览器插件**
2. **添加本地网络**：
   - 网络名称: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - 链 ID: `31337`
   - 货币符号: `ETH`

3. **导入测试账户**：
   - 复制 Hardhat 节点输出的私钥
   - 在 MetaMask 中导入账户

### 智能合约配置

项目包含三个核心合约：

- **UserAccount.sol**: 用户账户管理
- **AccountManager.sol**: 账户注册和认证
- **MessageManager.sol**: 消息传递管理

合约部署后的地址会保存在：
- `scripts/deployment.json` - 部署记录
- `frontend/src/contracts/addresses.json` - 前端配置

### IPFS 高级配置

**存储配置**
```bash
# 设置存储限制
./ipfs config Datastore.StorageMax 10GB

# 配置网关
./ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8080
```

**网络配置**
```bash
# 配置 Swarm 地址
./ipfs config --json Addresses.Swarm '["/ip4/0.0.0.0/tcp/4001", "/ip6/::/tcp/4001"]'
```

## 🔄 开发工作流

### 日常开发流程

1. **启动开发环境**：
   ```bash
   # 终端1: 区块链网络
   npx hardhat node
   
   # 终端2: IPFS节点
   cd kubo && ./ipfs daemon
   
   # 终端3: 前端应用
   cd frontend && npm start
   ```

2. **修改合约后重新部署**：
   ```bash
   npm run redeploy
   ```

3. **清除浏览器数据**：
   - 清除缓存和本地存储
   - 刷新页面
   - 重新连接 MetaMask

### 测试流程

```bash
# 编译合约
npm run compile

# 运行测试
npm run test

# 部署到本地网络
npm run deploy:local
```

## 📦 生产部署

### 前端构建

```bash
cd frontend
npm run build
```

构建文件将生成在 `frontend/build/` 目录。

### 环境变量配置

生产环境需要配置：

```env
# 生产环境配置
NODE_ENV=production
PORT=3001

# 安全配置
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-domain.com

# IPFS配置
IPFS_API_URL=https://your-ipfs-node.com:5001
```

### 部署到主网

1. **配置网络**：
   ```javascript
   // hardhat.config.js
   networks: {
     mainnet: {
       url: "https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
       accounts: ["YOUR-PRIVATE-KEY"]
     }
   }
   ```

2. **部署合约**：
   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```

## 🛠 故障排除

### 常见问题

**1. 合约部署失败**
```bash
# 检查网络连接
npx hardhat node --verbose

# 清理缓存
npx hardhat clean
npx hardhat compile
```

**2. IPFS 连接失败**
```bash
# 检查 IPFS 状态
./ipfs id

# 重启 IPFS
./ipfs shutdown
./ipfs daemon
```

**3. MetaMask 连接问题**
- 检查网络配置
- 重置 MetaMask 账户
- 清除浏览器缓存

**4. 前端编译错误**
```bash
# 清除依赖
rm -rf node_modules package-lock.json
npm install
```

### 日志查看

```bash
# Hardhat 日志
npx hardhat node --verbose

# IPFS 日志
./ipfs log tail

# 前端日志
# 浏览器开发者工具 Console
```

## 📚 相关资源

- [Hardhat 文档](https://hardhat.org/docs)
- [IPFS 文档](https://docs.ipfs.tech/)
- [MetaMask 文档](https://docs.metamask.io/)
- [React 文档](https://reactjs.org/docs)
- [Material-UI 文档](https://mui.com/)

## 🆘 获取帮助

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目的 Issues 页面
3. 查看相关技术文档
4. 提交新的 Issue 并提供详细信息

---

**注意**: 本项目仅用于学习和开发目的。在生产环境中使用前，请确保进行充分的安全审计和测试。