// 生成测试助记词和私钥信息
const { ethers } = require('ethers');

// Hardhat 默认助记词
const testMnemonic = "test test test test test test test test test test test junk";

// 从助记词生成钱包
const wallet = ethers.Wallet.fromMnemonic(testMnemonic);

console.log("🔐 测试账户信息");
console.log("=" * 40);
console.log("");
console.log("📝 助记词:");
console.log(testMnemonic);
console.log("");
console.log("🔑 私钥 (带 0x):");
console.log(wallet.privateKey);
console.log("");
console.log("🔑 私钥 (不带 0x):");
console.log(wallet.privateKey.slice(2));
console.log("");
console.log("📍 地址:");
console.log(wallet.address);
console.log("");
console.log("💡 导入建议:");
console.log("1. 优先尝试带 0x 的私钥");
console.log("2. 如果失败，尝试不带 0x 的私钥");
console.log("3. 如果都失败，使用助记词导入");