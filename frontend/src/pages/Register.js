import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Web3Context } from '../contexts/Web3Context';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  ContentCopy,
  AccountBalanceWallet,
  Security,
  CheckCircle
} from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const { provider } = useContext(Web3Context);
  
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [generatedWallet, setGeneratedWallet] = useState(null);
  const [accountBalance, setAccountBalance] = useState('0');

  const steps = ['基本信息', '生成账户', '保存信息', '完成注册'];

  // 生成新的钱包账户
  const generateNewAccount = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 生成随机助记词
      const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
      setGeneratedMnemonic(mnemonic);
      
      // 从助记词创建钱包
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      
      // 如果有provider，连接到网络
      let connectedWallet = wallet;
      if (provider) {
        connectedWallet = wallet.connect(provider);
        
        // 获取账户余额
        try {
          const balance = await provider.getBalance(wallet.address);
          setAccountBalance(ethers.utils.formatEther(balance));
        } catch (err) {
          console.log('获取余额失败:', err);
          setAccountBalance('0');
        }
        
        // 如果是本地测试网络，尝试给账户转一些ETH
        try {
          const network = await provider.getNetwork();
          if (network.chainId === 1337) { // Hardhat本地网络
            // 使用第一个测试账户给新账户转账
            const testAccounts = await provider.listAccounts();
            if (testAccounts.length > 0) {
              const signer = provider.getSigner(testAccounts[0]);
              const tx = await signer.sendTransaction({
                to: wallet.address,
                value: ethers.utils.parseEther('10') // 转10 ETH
              });
              await tx.wait();
              
              // 重新获取余额
              const newBalance = await provider.getBalance(wallet.address);
              setAccountBalance(ethers.utils.formatEther(newBalance));
            }
          }
        } catch (err) {
          console.log('转账失败:', err);
        }
      }
      
      setGeneratedWallet(connectedWallet);
      setActiveStep(1); // 进入下一步
      
    } catch (error) {
      console.error('生成账户时出错:', error);
      setError('生成账户失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!generatedWallet) {
        setError('请先生成账户');
        return;
      }
      
      if (!provider) {
        setError('未连接到区块链网络');
        return;
      }
      
      // 确保新钱包有足够的资金
      try {
        const network = await provider.getNetwork();
        if (network.chainId === 1337) { // Hardhat本地网络
          const balance = await provider.getBalance(generatedWallet.address);
          if (balance.eq(0)) {
            console.log('新钱包余额为0，正在转账...');
            // 使用第一个测试账户给新账户转账
            const testAccounts = await provider.listAccounts();
            if (testAccounts.length > 0) {
              const signer = provider.getSigner(testAccounts[0]);
              const tx = await signer.sendTransaction({
                to: generatedWallet.address,
                value: ethers.utils.parseEther('10') // 转10 ETH
              });
              await tx.wait();
              console.log('转账成功');
              
              // 重新获取余额
              const newBalance = await provider.getBalance(generatedWallet.address);
              setAccountBalance(ethers.utils.formatEther(newBalance));
            }
          }
        }
      } catch (err) {
        console.log('转账失败:', err);
        setError('转账失败: ' + err.message);
        return;
      }
      
      // 导入合约ABI
      const UserAccountABI = require('../contracts/abis/UserAccount.json');
      const AccountManagerABI = require('../contracts/abis/AccountManager.json');
      const addresses = require('../contracts/addresses.json');
      
      // 创建合约实例，使用生成的钱包
      const userAccountContract = new ethers.Contract(addresses.UserAccount, UserAccountABI.abi, generatedWallet);
      const accountManagerContract = new ethers.Contract(addresses.AccountManager, AccountManagerABI.abi, generatedWallet);
      
      // 生成随机公钥（实际应用中应使用真实的加密密钥对）
      const publicKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // 创建用户
      console.log('创建用户...', { username, publicKey, address: generatedWallet.address });
      const createUserTx = await userAccountContract.createUser(username, publicKey);
      await createUserTx.wait();
      console.log('用户创建成功');
      
      // 计算PIN码的哈希值
      const pinHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(pin));
      
      // 助记词哈希
      const backupHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(generatedMnemonic));
      
      // 创建账户管理
      console.log('创建账户管理...', { pinHash, backupHash });
      const createAccountTx = await accountManagerContract.createAccount(pinHash, backupHash);
      await createAccountTx.wait();
      console.log('账户管理创建成功');
      
      // 保存用户信息到本地存储
      const userInfo = {
        username,
        address: generatedWallet.address,
        mnemonic: generatedMnemonic,
        pinHash,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('userAccount', JSON.stringify(userInfo));
      
      setActiveStep(3); // 完成注册
      
    } catch (error) {
      console.error('注册时出错:', error);
      setError('注册时出错: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理登录导航
  const handleLoginClick = () => {
    navigate('/login');
  };

  // 处理返回主页
  const handleBackToHome = () => {
    navigate('/');
  };

  // 切换PIN码可见性
  const handleTogglePinVisibility = () => {
    setShowPin(!showPin);
  };

  // 切换确认PIN码可见性
  const handleToggleConfirmPinVisibility = () => {
    setShowConfirmPin(!showConfirmPin);
  };

  // 复制到剪贴板
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label}已复制到剪贴板`);
    });
  };

  // 验证PIN码
  const isPinValid = pin.length >= 6 && pin === confirmPin;

  // 验证助记词确认
  const isMnemonicConfirmed = recoveryPhrase.trim() === generatedMnemonic.trim();

  // 进入下一步
  const handleNext = () => {
    if (activeStep === 0 && username && isPinValid) {
      generateNewAccount();
    } else if (activeStep === 1) {
      setActiveStep(2);
    } else if (activeStep === 2 && isMnemonicConfirmed) {
      handleRegister();
    }
  };

  // 返回上一步
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          注册新账户
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          创建您的区块链聊天账户，无需连接钱包
        </Typography>

        {/* 步骤指示器 */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Paper elevation={3} sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 步骤 0: 基本信息 */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                设置基本信息
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                请输入您的用户名和PIN码
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="用户名"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                helperText="用于在聊天中显示的名称"
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="pin"
                label="PIN码（至少6位）"
                type={showPin ? 'text' : 'password'}
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                helperText="用于快速登录的PIN码"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle pin visibility"
                        onClick={handleTogglePinVisibility}
                        edge="end"
                      >
                        {showPin ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPin"
                label="确认PIN码"
                type={showConfirmPin ? 'text' : 'password'}
                id="confirmPin"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                error={confirmPin && pin !== confirmPin}
                helperText={confirmPin && pin !== confirmPin ? "PIN码不匹配" : ""}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm pin visibility"
                        onClick={handleToggleConfirmPinVisibility}
                        edge="end"
                      >
                        {showConfirmPin ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {/* 步骤 1: 生成账户 */}
          {activeStep === 1 && generatedWallet && (
            <Box>
              <Typography variant="h6" gutterBottom>
                账户已生成
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                您的区块链账户已成功生成
              </Typography>

              <Card sx={{ mb: 3, backgroundColor: '#e8f5e8' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountBalanceWallet sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">账户信息</Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    地址:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography 
                      variant="body2" 
                      fontFamily="monospace" 
                      sx={{ flexGrow: 1, wordBreak: 'break-all', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}
                    >
                      {generatedWallet.address}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(generatedWallet.address, '地址')}
                      sx={{ ml: 1 }}
                    >
                      <ContentCopy />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    私钥:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography 
                      variant="body2" 
                      fontFamily="monospace" 
                      sx={{ flexGrow: 1, wordBreak: 'break-all', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}
                    >
                      {generatedWallet.privateKey}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(generatedWallet.privateKey, '私钥')}
                      sx={{ ml: 1 }}
                    >
                      <ContentCopy />
                    </IconButton>
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    账户余额:
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    {parseFloat(accountBalance).toFixed(4)} ETH
                  </Typography>
                </CardContent>
              </Card>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  您的账户已自动获得测试ETH，可以开始使用聊天功能了！
                </Typography>
              </Alert>
            </Box>
          )}

          {/* 步骤 2: 保存信息 */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                保存恢复信息
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                请妥善保存您的助记词，这是恢复账户的唯一方式
              </Typography>

              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>重要提醒：</strong>请将助记词保存在安全的地方。如果丢失助记词，您将无法恢复账户！
                </Typography>
              </Alert>

              <Card sx={{ mb: 3, backgroundColor: '#fff3e0' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h6">助记词</Typography>
                  </Box>
                  
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, backgroundColor: '#f5f5f5', mb: 2 }}
                  >
                    <Typography variant="body1" fontFamily="monospace" sx={{ lineHeight: 1.8 }}>
                      {generatedMnemonic}
                    </Typography>
                  </Paper>
                  
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(generatedMnemonic, '助记词')}
                    sx={{ mb: 2 }}
                  >
                    复制助记词
                  </Button>
                </CardContent>
              </Card>

              <Typography variant="body2" gutterBottom>
                请在下方输入您的助记词以确认您已保存：
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                multiline
                rows={3}
                name="recoveryPhrase"
                label="确认助记词"
                id="recoveryPhrase"
                value={recoveryPhrase}
                onChange={(e) => setRecoveryPhrase(e.target.value)}
                error={recoveryPhrase && !isMnemonicConfirmed}
                helperText={recoveryPhrase && !isMnemonicConfirmed ? "助记词不匹配" : "请输入上方显示的助记词"}
              />
            </Box>
          )}

          {/* 步骤 3: 完成注册 */}
          {activeStep === 3 && (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                注册成功！
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                您的区块链聊天账户已创建完成
              </Typography>

              <Card sx={{ mb: 3, backgroundColor: '#e8f5e8' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    账户摘要
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    用户名: <strong>{username}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    地址: <strong>{generatedWallet?.address.slice(0, 10)}...{generatedWallet?.address.slice(-8)}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    余额: <strong>{parseFloat(accountBalance).toFixed(4)} ETH</strong>
                  </Typography>
                </CardContent>
              </Card>

              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  您现在可以使用PIN码或助记词登录，开始使用聊天功能！
                </Typography>
              </Alert>

              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ mr: 2 }}
              >
                立即登录
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={handleBackToHome}
              >
                返回首页
              </Button>
            </Box>
          )}

          {/* 操作按钮 */}
          {activeStep < 3 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={activeStep === 0 ? handleBackToHome : handleBack}
                disabled={loading}
              >
                {activeStep === 0 ? '返回首页' : '上一步'}
              </Button>
              
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  loading || 
                  (activeStep === 0 && (!username || !isPinValid)) ||
                  (activeStep === 2 && !isMnemonicConfirmed)
                }
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  activeStep === 0 ? '生成账户' : 
                  activeStep === 1 ? '下一步' : 
                  '完成注册'
                )}
              </Button>
            </Box>
          )}

          {/* 登录链接 */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="#" variant="body2" onClick={handleLoginClick}>
              已有账户？立即登录
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;