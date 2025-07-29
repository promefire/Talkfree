const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('检查区块链上的地址...');
  
  const provider = ethers.provider;
  
  // 获取当前区块号
  const currentBlock = await provider.getBlockNumber();
  console.log('当前区块号:', currentBlock);
  
  // 获取Hardhat预设的测试账户
  const accounts = await ethers.getSigners();
  console.log('\nHardhat预设账户 (共', accounts.length, '个):');
  for (let i = 0; i < accounts.length; i++) {
    const balance = await provider.getBalance(accounts[i].address);
    console.log(`${i + 1}. ${accounts[i].address} - 余额: ${ethers.utils.formatEther(balance)} ETH`);
  }
  
  // 检查所有区块中的交易，找出所有涉及的地址
  console.log('\n扫描区块链交易记录...');
  const allAddresses = new Set();
  
  // 添加预设账户到集合中
  accounts.forEach(account => allAddresses.add(account.address.toLowerCase()));
  
  // 扫描所有区块
  for (let blockNumber = 0; blockNumber <= currentBlock; blockNumber++) {
    try {
      const block = await provider.getBlockWithTransactions(blockNumber);
      
      if (block.transactions.length > 0) {
        console.log(`区块 ${blockNumber}: ${block.transactions.length} 笔交易`);
        
        block.transactions.forEach(tx => {
          if (tx.from) allAddresses.add(tx.from.toLowerCase());
          if (tx.to) allAddresses.add(tx.to.toLowerCase());
        });
      }
    } catch (error) {
      console.log(`获取区块 ${blockNumber} 失败:`, error.message);
    }
  }
  
  console.log('\n所有在区块链上有活动的地址:');
  const addressArray = Array.from(allAddresses);
  
  for (let i = 0; i < addressArray.length; i++) {
    const address = addressArray[i];
    try {
      const balance = await provider.getBalance(address);
      const txCount = await provider.getTransactionCount(address);
      
      // 检查是否是预设账户
      const isPresetAccount = accounts.some(account => 
        account.address.toLowerCase() === address.toLowerCase()
      );
      
      console.log(`${i + 1}. ${address}`);
      console.log(`   余额: ${ethers.utils.formatEther(balance)} ETH`);
      console.log(`   交易数: ${txCount}`);
      console.log(`   类型: ${isPresetAccount ? 'Hardhat预设账户' : '新创建账户'}`);
      console.log('');
    } catch (error) {
      console.log(`   获取地址 ${address} 信息失败:`, error.message);
    }
  }
  
  console.log(`\n总结:`);
  console.log(`- Hardhat预设账户: ${accounts.length} 个`);
  console.log(`- 区块链上活跃地址总数: ${addressArray.length} 个`);
  console.log(`- 新创建的地址: ${addressArray.length - accounts.length} 个`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });