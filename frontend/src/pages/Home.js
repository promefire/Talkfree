import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  AccountCircle,
  Login as LoginIcon,
  PersonAdd,
  Chat as ChatIcon,
  Security,
  Wallet
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        {/* 标题部分 */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            区块链聊天应用
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            安全、去中心化的点对点通信平台
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            基于区块链技术的安全聊天应用，无需连接钱包，支持PIN码和助记词登录
          </Typography>
        </Box>

        {/* 主要操作按钮 */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                <PersonAdd sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" component="h2" gutterBottom>
                  注册账户
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  创建新账户，我们将为您生成：
                </Typography>
                <Box sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 🔑 私钥和地址
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 💰 预充值的测试ETH
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 📝 12位助记词
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 🔐 自定义PIN码
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleRegister}
                  startIcon={<PersonAdd />}
                  sx={{ py: 1.5 }}
                >
                  立即注册
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                <LoginIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h4" component="h2" gutterBottom>
                  登录账户
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  已有账户？选择您的登录方式：
                </Typography>
                <Box sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 🔐 PIN码快速登录
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 📝 助记词恢复登录
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • 🚫 无需连接钱包
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • ⚡ 安全便捷
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleLogin}
                  startIcon={<LoginIcon />}
                  sx={{ py: 1.5 }}
                >
                  立即登录
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* 特性介绍 */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            应用特性
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  安全可靠
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  基于区块链技术，端到端加密，保护您的隐私和数据安全
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <ChatIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  去中心化
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  无需中心化服务器，点对点直接通信，真正的去中心化体验
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Wallet sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  简单易用
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  无需连接钱包，支持PIN码登录，操作简单，用户体验友好
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home;