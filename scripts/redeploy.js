const { exec } = require('child_process');
const path = require('path');

/**
 * 重新部署合约并重启前端的便捷脚本
 * 这个脚本会：
 * 1. 重新部署所有合约
 * 2. 自动更新前端配置
 * 3. 提示重启前端服务
 */

async function redeploy() {
  console.log('🚀 开始重新部署流程...');
  
  try {
    console.log('\n📦 重新部署智能合约...');
    
    // 执行部署脚本
    await new Promise((resolve, reject) => {
      exec('npx hardhat run scripts/deploy.js --network localhost', (error, stdout, stderr) => {
        if (error) {
          console.error('部署失败:', error);
          reject(error);
          return;
        }
        
        console.log(stdout);
        if (stderr) {
          console.warn('警告:', stderr);
        }
        
        resolve();
      });
    });
    
    console.log('\n✅ 重新部署完成！');
    console.log('\n📋 接下来的步骤:');
    console.log('1. 前端合约地址配置已自动更新');
    console.log('2. 如果前端正在运行，建议重启前端服务以确保使用最新配置');
    console.log('3. 清除浏览器缓存和本地存储数据');
    console.log('4. 重新注册用户以使用新的合约地址');
    
    console.log('\n🔧 重启前端服务命令:');
    console.log('   cd frontend && npm start');
    
  } catch (error) {
    console.error('❌ 重新部署失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  redeploy();
}

module.exports = { redeploy };