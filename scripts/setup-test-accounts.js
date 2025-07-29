// 测试账户设置脚本
// 这个脚本提供了 Hardhat 预配置的测试账户信息

const testAccounts = [
  {
    name: "Test Account #0 (推荐)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    balance: "10000 ETH"
  },
  {
    name: "Test Account #1",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    balance: "10000 ETH"
  },
  {
    name: "Test Account #2",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    balance: "10000 ETH"
  }
];

console.log("🔧 Hardhat 测试账户配置信息");
console.log("=" * 50);
console.log("");

testAccounts.forEach((account, index) => {
  console.log(`📱 ${account.name}`);
  console.log(`   地址: ${account.address}`);
  console.log(`   私钥: ${account.privateKey}`);
  console.log(`   余额: ${account.balance}`);
  console.log("");
});

console.log("📋 MetaMask 导入步骤：");
console.log("1. 打开 MetaMask 扩展");
console.log("2. 点击账户图标 → 导入账户");
console.log("3. 选择 '私钥' 导入方式");
console.log("4. 粘贴上面的私钥");
console.log("5. 点击 '导入' 按钮");
console.log("");
console.log("⚠️  注意：这些是测试账户，仅用于本地开发！");
console.log("   请勿在主网或真实网络中使用这些私钥！");

module.exports = { testAccounts };