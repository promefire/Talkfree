const fs = require('fs');
const path = require('path');

async function setupProject() {
  console.log('开始项目设置...');
  
  // 创建必要的目录
  const directories = [
    'backend/logs',
    'backend/uploads',
    'frontend/build',
    'docs/api'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log('创建目录:', dir);
    }
  });
  
  // 创建环境变量文件
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    const envExample = path.join(__dirname, '..', 'backend', 'env.example');
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envPath);
      console.log('创建.env文件，请配置环境变量');
    }
  }
  
  // 创建Hardhat配置文件
  const hardhatConfig = `require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    sepolia: {
      url: process.env.ETHEREUM_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};`;
  
  const hardhatConfigPath = path.join(__dirname, '..', 'hardhat.config.js');
  if (!fs.existsSync(hardhatConfigPath)) {
    fs.writeFileSync(hardhatConfigPath, hardhatConfig);
    console.log('创建Hardhat配置文件');
  }
  
  // 创建项目根目录的package.json
  const rootPackageJson = {
    "name": "web3-chat",
    "version": "1.0.0",
    "description": "基于区块链的点对点聊天工具",
    "scripts": {
      "install-all": "npm install && cd frontend && npm install && cd ../backend && npm install && cd ../scripts && npm install",
      "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
      "dev:frontend": "cd frontend && npm start",
      "dev:backend": "cd backend && npm run dev",
      "build": "cd frontend && npm run build",
      "deploy": "cd scripts && npm run deploy",
      "test": "npx hardhat test",
      "compile": "npx hardhat compile"
    },
    "keywords": ["blockchain", "chat", "web3", "ethereum", "ipfs"],
    "author": "Web3 Chat Team",
    "license": "MIT",
    "devDependencies": {
      "concurrently": "^8.2.0",
      "hardhat": "^2.17.1",
      "@nomicfoundation/hardhat-toolbox": "^3.0.2"
    }
  };
  
  const rootPackagePath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(rootPackagePath)) {
    fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackageJson, null, 2));
    console.log('创建根目录package.json');
  }
  
  console.log('\n项目设置完成！');
  console.log('\n下一步：');
  console.log('1. 运行 npm run install-all 安装所有依赖');
  console.log('2. 配置 backend/.env 文件');
  console.log('3. 运行 npm run compile 编译智能合约');
  console.log('4. 运行 npm run deploy 部署合约');
  console.log('5. 运行 npm run dev 启动开发服务器');
}

setupProject()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('设置失败:', error);
    process.exit(1);
  });