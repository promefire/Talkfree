# 智能合约部署指南

本项目现在支持自动化部署流程，每次部署后会自动更新前端的合约地址配置，无需手动修改。

## 🚀 快速部署

### 方法一：使用便捷命令（推荐）

```bash
# 重新部署所有合约并自动更新前端配置
npm run redeploy
```

### 方法二：单独部署

```bash
# 仅部署合约到本地网络
npm run deploy:local

# 或者使用原始命令
npx hardhat run scripts/deploy.js --network localhost
```

## 📋 部署流程说明

1. **合约部署**：按顺序部署 UserAccount、AccountManager、MessageManager 合约
2. **保存部署信息**：将合约地址和交易哈希保存到 `scripts/deployment.json`
3. **自动更新前端配置**：将合约地址写入 `frontend/src/contracts/addresses.json`
4. **提供后续指导**：显示重启前端服务的建议

## 🔄 重新部署后的步骤

每次重新部署合约后，建议执行以下步骤：

1. **重启前端服务**（如果正在运行）：
   ```bash
   cd frontend
   npm start
   ```

2. **清除浏览器数据**：
   - 清除浏览器缓存
   - 清除本地存储（localStorage）
   - 刷新页面

3. **重新注册用户**：
   - 由于合约地址已更改，需要重新注册用户
   - 可以使用相同的助记词重新注册

## 📁 相关文件

- `scripts/deploy.js` - 主部署脚本（已增强自动更新功能）
- `scripts/redeploy.js` - 便捷重新部署脚本
- `scripts/deployment.json` - 部署信息记录
- `frontend/src/contracts/addresses.json` - 前端合约地址配置

## ⚙️ 配置说明

### 部署脚本功能

- ✅ 自动部署三个核心合约
- ✅ 自动保存部署信息
- ✅ 自动更新前端配置
- ✅ 错误处理和回滚提示
- ✅ 详细的部署日志

### 前端配置自动同步

部署脚本会自动：
- 检查前端合约目录是否存在
- 创建必要的目录结构
- 更新合约地址配置文件
- 提供成功/失败的反馈

## 🛠️ 故障排除

### 前端配置更新失败

如果自动更新前端配置失败，会显示警告信息。此时需要手动更新：

```json
// frontend/src/contracts/addresses.json
{
  "UserAccount": "新的合约地址",
  "AccountManager": "新的合约地址",
  "MessageManager": "新的合约地址"
}
```

### 合约部署失败

1. 确保 Hardhat 本地网络正在运行：
   ```bash
   npx hardhat node
   ```

2. 检查账户余额是否充足

3. 查看详细错误信息并根据提示解决

## 📝 开发建议

1. **开发流程**：每次修改合约后使用 `npm run redeploy` 重新部署
2. **测试流程**：部署后清除浏览器数据，重新测试完整功能
3. **版本管理**：`deployment.json` 文件包含时间戳，便于追踪部署历史

---

通过这个自动化流程，您再也不需要手动修改前端配置文件了！🎉