import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Web3Context } from '../contexts/Web3Context';
import { AuthContext } from '../contexts/AuthContext';
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
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Pin,
  VpnKey,
  Home as HomeIcon
} from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { provider } = useContext(Web3Context);
  const { isAuthenticated, setUser } = useContext(AuthContext);
  
  const [loginMethod, setLoginMethod] = useState(0); // 0: PIN码, 1: 助记词
  const [pin, setPin] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查用户是否已认证，如果是则重定向到仪表板
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // 处理PIN码登录
  const handlePinLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!pin) {
        setError('请输入PIN码');
        return;
      }

      // 从本地存储获取用户信息
      const userInfo = localStorage.getItem('userAccount');
      if (!userInfo) {
        setError('未找到账户信息，请先注册');
        return;
      }

      const userData = JSON.parse(userInfo);
      
      // 验证PIN码
      const pinHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(pin));
      if (pinHash !== userData.pinHash) {
        setError('PIN码错误');
        return;
      }

      // 从助记词恢复钱包
      const wallet = ethers.Wallet.fromMnemonic(userData.mnemonic);
      
      // 连接到provider
      let connectedWallet = wallet;
      if (provider) {
        connectedWallet = wallet.connect(provider);
      }

      // 设置用户登录状态（使用AuthContext的setUser方法）
      setUser({
        username: userData.username,
        address: wallet.address,
        wallet: connectedWallet
      });

      // 同时设置认证状态为true
      localStorage.setItem('isAuthenticated', 'true');

      navigate('/dashboard');
      
    } catch (error) {
      console.error('PIN码登录失败:', error);
      setError('登录失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理助记词登录
  const handleMnemonicLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!mnemonic.trim()) {
        setError('请输入助记词');
        return;
      }

      // 验证助记词格式
      const words = mnemonic.trim().split(/\s+/);
      if (words.length !== 12) {
        setError('助记词应该包含12个单词');
        return;
      }

      // 从助记词恢复钱包
      let wallet;
      try {
        wallet = ethers.Wallet.fromMnemonic(mnemonic.trim());
      } catch (err) {
        setError('无效的助记词');
        return;
      }

      // 连接到provider
      let connectedWallet = wallet;
      if (provider) {
        connectedWallet = wallet.connect(provider);
      }

      // 检查本地是否有对应的账户信息
      const userInfo = localStorage.getItem('userAccount');
      let username = '用户';
      
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        if (userData.address === wallet.address) {
          username = userData.username;
        }
      }

      // 如果没有找到本地账户信息，尝试从区块链获取
      if (!userInfo || JSON.parse(userInfo).address !== wallet.address) {
        try {
          // 导入合约ABI
          const UserAccountABI = require('../contracts/abis/UserAccount.json');
          const addresses = require('../contracts/addresses.json');
          
          if (provider && addresses.UserAccount) {
            const userAccountContract = new ethers.Contract(addresses.UserAccount, UserAccountABI.abi, connectedWallet);
            const userExists = await userAccountContract.userExists(wallet.address);
            
            if (userExists) {
              const userData = await userAccountContract.getUser(wallet.address);
              username = userData.username || '用户';
            } else {
              // 用户不存在，自动创建用户账户
              console.log('用户不存在，正在创建用户账户...');
              
              // 生成随机公钥
              const publicKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
              
              // 使用默认用户名
              const defaultUsername = `用户${wallet.address.slice(-6)}`;
              
              try {
                const createUserTx = await userAccountContract.createUser(defaultUsername, publicKey);
                await createUserTx.wait();
                username = defaultUsername;
                console.log('用户账户创建成功:', defaultUsername);
              } catch (createError) {
                console.error('创建用户账户失败:', createError);
                setError('无法创建用户账户，请检查网络连接或余额');
                return;
              }
            }
          }
        } catch (err) {
          console.log('从区块链获取用户信息失败:', err);
        }
      }

      // 设置用户登录状态（使用AuthContext的setUser方法）
      setUser({
        username: username,
        address: wallet.address,
        wallet: connectedWallet
      });

      // 同时设置认证状态为true
      localStorage.setItem('isAuthenticated', 'true');

      navigate('/dashboard');
      
    } catch (error) {
      console.error('助记词登录失败:', error);
      setError('登录失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理登录
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (loginMethod === 0) {
      await handlePinLogin();
    } else {
      await handleMnemonicLogin();
    }
  };

  // 处理注册导航
  const handleRegisterClick = () => {
    navigate('/register');
  };

  // 处理返回主页
  const handleBackToHome = () => {
    navigate('/');
  };

  // 切换PIN码可见性
  const handleTogglePinVisibility = () => {
    setShowPin(!showPin);
  };

  // 切换登录方式
  const handleTabChange = (event, newValue) => {
    setLoginMethod(newValue);
    setError('');
    setPin('');
    setMnemonic('');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          登录账户
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          使用PIN码或助记词登录您的区块链聊天账户
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 登录方式选择 */}
          <Tabs 
            value={loginMethod} 
            onChange={handleTabChange} 
            centered 
            sx={{ mb: 3 }}
          >
            <Tab 
              icon={<Pin />} 
              label="PIN码登录" 
              iconPosition="start"
            />
            <Tab 
              icon={<VpnKey />} 
              label="助记词登录" 
              iconPosition="start"
            />
          </Tabs>

          <Divider sx={{ mb: 3 }} />

          <Box component="form" onSubmit={handleLogin} noValidate>
            {/* PIN码登录 */}
            {loginMethod === 0 && (
              <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    PIN码快速登录
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    输入您注册时设置的6位PIN码
                  </Typography>
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="pin"
                    label="PIN码"
                    type={showPin ? 'text' : 'password'}
                    id="pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="请输入6位PIN码"
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
                </CardContent>
              </Card>
            )}

            {/* 助记词登录 */}
            {loginMethod === 1 && (
              <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    助记词恢复登录
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    输入您的12位助记词来恢复账户
                  </Typography>
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    multiline
                    rows={3}
                    name="mnemonic"
                    label="助记词"
                    id="mnemonic"
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="请输入12个助记词，用空格分隔"
                    helperText="例如: word1 word2 word3 ... word12"
                  />
                </CardContent>
              </Card>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || (loginMethod === 0 ? !pin : !mnemonic.trim())}
              sx={{ mt: 2, mb: 3, py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                loginMethod === 0 ? '使用PIN码登录' : '使用助记词登录'
              )}
            </Button>

            {/* 提示信息 */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {loginMethod === 0 
                  ? '💡 PIN码登录更快捷，适合日常使用'
                  : '🔐 助记词登录更安全，可在任何设备上恢复账户'
                }
              </Typography>
            </Alert>
            
            {/* 底部链接 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="#" variant="body2" onClick={handleRegisterClick}>
                没有账户？立即注册
              </Link>
              <Button
                startIcon={<HomeIcon />}
                onClick={handleBackToHome}
                variant="text"
                size="small"
              >
                返回首页
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;