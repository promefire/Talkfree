const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  // 读取部署信息
  const deploymentPath = path.join(__dirname, 'deployment.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.contracts.UserAccount.address;
  const txHash = deployment.contracts.UserAccount.transactionHash;
  
  console.log('测试合约连接...');
  console.log('合约地址:', contractAddress);
  console.log('部署交易哈希:', txHash);
  
  const provider = ethers.provider;
  
  try {
    // 检查部署交易
    console.log('\n检查部署交易...');
    const tx = await provider.getTransaction(txHash);
    console.log('交易存在:', !!tx);
    if (tx) {
      const receipt = await provider.getTransactionReceipt(txHash);
      console.log('交易状态:', receipt.status === 1 ? '成功' : '失败');
      console.log('合约创建地址:', receipt.contractAddress);
      console.log('Gas使用量:', receipt.gasUsed.toString());
    }
  } catch (error) {
    console.log('检查部署交易失败:', error.message);
  }
  
  try {
    // 检查合约代码
    console.log('\n检查合约代码...');
    const code = await provider.getCode(contractAddress);
    console.log('合约代码长度:', code.length);
    console.log('合约是否部署:', code !== '0x');
    console.log('代码前100字符:', code.substring(0, 100));
  } catch (error) {
    console.log('获取合约代码失败:', error.message);
  }
  
  // 如果合约代码存在，尝试连接
  const code = await provider.getCode(contractAddress);
  if (code !== '0x') {
    try {
      console.log('\n尝试连接合约...');
      const UserAccount = await ethers.getContractFactory('UserAccount');
      const userAccount = UserAccount.attach(contractAddress);
      
      const [deployer] = await ethers.getSigners();
      console.log('测试账户:', deployer.address);
      
      // 尝试调用users函数
      console.log('\n尝试调用users函数...');
      const userInfo = await userAccount.users(deployer.address);
      console.log('用户信息查询成功:', {
        username: userInfo.username,
        exists: userInfo.exists,
        publicKey: userInfo.publicKey
      });
      
      // 如果用户不存在，尝试注册
      if (!userInfo.exists) {
        console.log('\n用户不存在，尝试注册...');
        const tx = await userAccount.createUser('TestUser', 'publickey123');
        await tx.wait();
        console.log('用户注册成功');
        
        // 再次查询用户信息
        const updatedUserInfo = await userAccount.users(deployer.address);
        console.log('注册后用户信息:', {
          username: updatedUserInfo.username,
          exists: updatedUserInfo.exists,
          publicKey: updatedUserInfo.publicKey
        });
      }
    } catch (error) {
      console.log('合约操作失败:', error.message);
      console.log('错误详情:', error);
    }
  } else {
    console.log('\n合约未正确部署，尝试重新部署...');
    try {
      const UserAccount = await ethers.getContractFactory('UserAccount');
      const userAccount = await UserAccount.deploy();
      await userAccount.deployed();
      console.log('重新部署成功，新地址:', userAccount.address);
      
      // 更新部署信息
      deployment.contracts.UserAccount.address = userAccount.address;
      deployment.contracts.UserAccount.transactionHash = userAccount.deployTransaction.hash;
      deployment.timestamp = new Date().toISOString();
      
      fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
      console.log('部署信息已更新');
      
      // 测试新部署的合约
      const [deployer] = await ethers.getSigners();
      const tx = await userAccount.createUser('TestUser', 'publickey123');
      await tx.wait();
      console.log('用户注册成功');
      
      const userInfo = await userAccount.users(deployer.address);
      console.log('用户信息:', {
        username: userInfo.username,
        exists: userInfo.exists,
        publicKey: userInfo.publicKey
      });
    } catch (error) {
      console.log('重新部署失败:', error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });