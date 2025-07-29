const { ethers } = require('hardhat');

async function main() {
  console.log('='.repeat(60));
  console.log('Talkfree 地址管理说明');
  console.log('='.repeat(60));
  
  const provider = ethers.provider;
  const accounts = await ethers.getSigners();
  
  console.log('\n1. Hardhat 预设账户说明:');
  console.log('   - Hardhat 启动时会自动生成 20 个测试账户');
  console.log('   - 这些账户的私钥是固定的，每次重启都相同');
  console.log('   - 每个账户初始余额为 10000 ETH');
  console.log('   - 这些账户主要用于开发和测试');
  
  console.log('\n2. 新注册用户地址说明:');
  console.log('   - 用户注册时会生成全新的随机地址和私钥');
  console.log('   - 这些地址不会出现在 Hardhat 的预设账户列表中');
  console.log('   - 但它们确实存在于区块链上，可以进行交易');
  console.log('   - 可以通过区块链浏览器或脚本查看这些地址');
  
  // 检查合约地址
  const addresses = require('../frontend/src/contracts/addresses.json');
  
  console.log('\n3. 当前区块链状态:');
  
  // 检查合约
  console.log('\n   智能合约地址:');
  for (const [contractName, contractAddress] of Object.entries(addresses)) {
    const code = await provider.getCode(contractAddress);
    const isContract = code !== '0x';
    console.log(`   - ${contractName}: ${contractAddress} ${isContract ? '✓' : '✗'}`);
  }
  
  // 扫描所有活跃地址
  console.log('\n   活跃地址统计:');
  const currentBlock = await provider.getBlockNumber();
  const allAddresses = new Set();
  
  // 添加预设账户
  accounts.forEach(account => allAddresses.add(account.address.toLowerCase()));
  
  // 扫描交易
  for (let blockNumber = 0; blockNumber <= currentBlock; blockNumber++) {
    try {
      const block = await provider.getBlockWithTransactions(blockNumber);
      block.transactions.forEach(tx => {
        if (tx.from) allAddresses.add(tx.from.toLowerCase());
        if (tx.to) allAddresses.add(tx.to.toLowerCase());
      });
    } catch (error) {
      // 忽略错误
    }
  }
  
  const userAddresses = [];
  const contractAddresses = [];
  
  for (const address of allAddresses) {
    const isPresetAccount = accounts.some(account => 
      account.address.toLowerCase() === address.toLowerCase()
    );
    
    if (!isPresetAccount) {
      const code = await provider.getCode(address);
      const isContract = code !== '0x';
      
      if (isContract) {
        contractAddresses.push(address);
      } else {
        const balance = await provider.getBalance(address);
        const txCount = await provider.getTransactionCount(address);
        userAddresses.push({
          address,
          balance: ethers.utils.formatEther(balance),
          txCount
        });
      }
    }
  }
  
  console.log(`   - Hardhat 预设账户: ${accounts.length} 个`);
  console.log(`   - 部署的智能合约: ${contractAddresses.length} 个`);
  console.log(`   - 新注册用户地址: ${userAddresses.length} 个`);
  
  if (userAddresses.length > 0) {
    console.log('\n   新注册用户详情:');
    userAddresses.forEach((user, index) => {
      console.log(`   ${index + 1}. 地址: ${user.address}`);
      console.log(`      余额: ${user.balance} ETH`);
      console.log(`      交易数: ${user.txCount}`);
    });
  }
  
  console.log('\n4. 总结:');
  console.log('   ✓ 新注册用户的地址确实存在于区块链上');
  console.log('   ✓ 这些地址可以正常进行交易和合约调用');
  console.log('   ✓ 它们不会出现在 Hardhat 预设账户列表中，这是正常的');
  console.log('   ✓ 可以通过区块链浏览器或自定义脚本查看这些地址');
  
  console.log('\n5. 如何查看新地址:');
  console.log('   - 使用本脚本: npx hardhat run scripts/explainAddresses.js --network localhost');
  console.log('   - 查看前端控制台日志中的地址信息');
  console.log('   - 使用区块链浏览器(如果有的话)');
  console.log('   - 检查本地存储中的用户信息');
  
  console.log('\n' + '='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });