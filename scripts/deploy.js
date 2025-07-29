require('dotenv').config();
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('开始部署智能合约...');
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  
  console.log('部署账户:', deployer.address);
  console.log('账户余额:', ethers.utils.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');
  
  // 部署UserAccount合约
  console.log('\n部署UserAccount合约...');
  const UserAccount = await ethers.getContractFactory('UserAccount');
  const userAccount = await UserAccount.deploy();
  await userAccount.deployed();
  const userAccountAddress = userAccount.address;
  console.log('UserAccount合约地址:', userAccountAddress);
  
  // 部署AccountManager合约
  console.log('\n部署AccountManager合约...');
  const AccountManager = await ethers.getContractFactory('AccountManager');
  const accountManager = await AccountManager.deploy();
  await accountManager.deployed();
  const accountManagerAddress = accountManager.address;
  console.log('AccountManager合约地址:', accountManagerAddress);
  
  // 部署MessageManager合约
  console.log('\n部署MessageManager合约...');
  const MessageManager = await ethers.getContractFactory('MessageManager');
  const messageManager = await MessageManager.deploy(userAccountAddress);
  await messageManager.deployed();
  const messageManagerAddress = messageManager.address;
  console.log('MessageManager合约地址:', messageManagerAddress);
  
  const deploymentInfo = {
    network: 'localhost',
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      UserAccount: {
        address: userAccountAddress,
        transactionHash: userAccount.deployTransaction.hash
      },
      AccountManager: {
        address: accountManagerAddress,
        transactionHash: accountManager.deployTransaction.hash
      },
      MessageManager: {
        address: messageManagerAddress,
        transactionHash: messageManager.deployTransaction.hash
      }
    }
  };
  
  // 保存部署信息
  const deploymentPath = path.join(__dirname, 'deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('\n部署完成！');
  console.log('部署信息已保存到:', deploymentPath);
  console.log('\n合约地址:');
  console.log('UserAccount:', userAccountAddress);
  console.log('AccountManager:', accountManagerAddress);
  console.log('MessageManager:', messageManagerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('部署失败:', error);
    process.exit(1);
  });