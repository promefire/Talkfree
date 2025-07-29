const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  // 读取部署信息
  const deploymentPath = path.join(__dirname, 'deployment.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // 获取合约实例
  const UserAccount = await ethers.getContractFactory('UserAccount');
  const userAccount = UserAccount.attach(deployment.contracts.UserAccount.address);
  
  // 获取测试账户
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log('测试用户注册功能...');
  console.log('部署者地址:', deployer.address);
  console.log('用户1地址:', user1.address);
  console.log('用户2地址:', user2.address);
  
  // 检查用户是否已注册
  console.log('\n检查用户注册状态...');
  
  try {
    const deployerUser = await userAccount.users(deployer.address);
    console.log('部署者用户信息:', {
      username: deployerUser.username,
      exists: deployerUser.exists,
      publicKey: deployerUser.publicKey
    });
  } catch (error) {
    console.log('查询部署者用户信息失败:', error.message);
  }
  
  try {
    const user1Info = await userAccount.users(user1.address);
    console.log('用户1信息:', {
      username: user1Info.username,
      exists: user1Info.exists,
      publicKey: user1Info.publicKey
    });
  } catch (error) {
    console.log('查询用户1信息失败:', error.message);
  }
  
  // 如果用户1未注册，则注册
  try {
    const user1Info = await userAccount.users(user1.address);
    if (!user1Info.exists) {
      console.log('\n用户1未注册，正在注册...');
      const tx = await userAccount.connect(user1).createUser('TestUser1', 'publickey123');
      await tx.wait();
      console.log('用户1注册成功');
      
      // 重新查询用户信息
      const updatedUser1Info = await userAccount.users(user1.address);
      console.log('用户1更新后信息:', {
        username: updatedUser1Info.username,
        exists: updatedUser1Info.exists,
        publicKey: updatedUser1Info.publicKey
      });
    } else {
      console.log('用户1已注册');
    }
  } catch (error) {
    console.log('注册用户1失败:', error.message);
  }
  
  // 如果用户2未注册，则注册
  try {
    const user2Info = await userAccount.users(user2.address);
    if (!user2Info.exists) {
      console.log('\n用户2未注册，正在注册...');
      const tx = await userAccount.connect(user2).createUser('TestUser2', 'publickey456');
      await tx.wait();
      console.log('用户2注册成功');
      
      // 重新查询用户信息
      const updatedUser2Info = await userAccount.users(user2.address);
      console.log('用户2更新后信息:', {
        username: updatedUser2Info.username,
        exists: updatedUser2Info.exists,
        publicKey: updatedUser2Info.publicKey
      });
    } else {
      console.log('用户2已注册');
    }
  } catch (error) {
    console.log('注册用户2失败:', error.message);
  }
  
  // 测试好友请求功能
  console.log('\n=== 测试好友请求 ===');
  try {
    // 检查是否已经是好友
    const areFriends = await userAccount.isFriend(user1.address, user2.address);
    if (!areFriends) {
      // 用户1向用户2发送好友请求
      console.log('用户1向用户2发送好友请求...');
      const tx = await userAccount.connect(user1).sendFriendRequest(user2.address);
      await tx.wait();
      console.log('好友请求发送成功');
    } else {
      console.log('用户1和用户2已经是好友');
    }
    
    // 查询用户2收到的好友请求
    const receivedRequests = await userAccount.getReceivedFriendRequests(user2.address);
    console.log('用户2收到的好友请求数量:', receivedRequests.length);
    
    if (receivedRequests.length > 0) {
      const requestInfo = await userAccount.friendRequests(receivedRequests[0]);
      console.log('好友请求信息:', {
        from: requestInfo.from,
        to: requestInfo.to,
        status: requestInfo.status.toString()
      });
    }
  } catch (error) {
    console.error('测试好友请求失败:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });