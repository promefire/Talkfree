import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Context';
import { AuthContext } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';

const Profile = () => {
  const navigate = useNavigate();
  const { connected, account } = useContext(Web3Context);
  const { isAuthenticated, currentUser, updateUser } = useContext(AuthContext);
  
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 检查认证状态
  useEffect(() => {
    if (!connected || !isAuthenticated) {
      navigate('/login');
    }
  }, [connected, isAuthenticated, navigate]);
  
  // 初始化表单数据
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setStatus(currentUser.status || '');
    }
  }, [currentUser]);
  
  // 处理返回
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  // 处理编辑模式切换
  const handleEditToggle = () => {
    if (editing) {
      // 取消编辑，恢复原始数据
      setUsername(currentUser.username || '');
      setStatus(currentUser.status || '');
      setError('');
      setSuccess('');
    }
    setEditing(!editing);
  };
  
  // 处理保存个人资料
  const handleSaveProfile = async () => {
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await updateUser(username, status);
      
      setSuccess('个人资料已更新');
      setEditing(false);
    } catch (error) {
      setError('更新个人资料时出错: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 生成随机颜色
  const getRandomColor = () => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // 根据用户名生成一致的颜色
  const getUserColor = (username) => {
    if (!username) return '#9e9e9e';
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ];
    return colors[Math.abs(hash) % colors.length];
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1">
            个人资料
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: { md: 4 }, mb: { xs: 3, md: 0 } }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                fontSize: 48,
                bgcolor: getUserColor(username),
                mb: 2
              }}
            >
              {username ? username.charAt(0).toUpperCase() : '?'}
            </Avatar>
            
            {!editing && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Edit />}
                onClick={handleEditToggle}
              >
                编辑资料
              </Button>
            )}
          </Box>
          
          <Box sx={{ flex: 1, width: '100%' }}>
            {editing ? (
              <Box>
                <TextField
                  fullWidth
                  label="用户名"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  required
                />
                
                <TextField
                  fullWidth
                  label="状态"
                  variant="outlined"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  margin="normal"
                  placeholder="例如：在线、忙碌、离开等"
                />
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={handleEditToggle}
                    sx={{ mr: 2 }}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    保存
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {username || '未设置用户名'}
                </Typography>
                
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  状态: {status || '未设置状态'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" gutterBottom>
                  钱包地址: {currentUser?.address || account || '未连接钱包'}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  公钥: {currentUser?.publicKey ? `${currentUser.publicKey.substring(0, 10)}...${currentUser.publicKey.substring(currentUser.publicKey.length - 10)}` : '未设置公钥'}
                </Typography>
                
                <Typography variant="body2">
                  注册时间: {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleString() : '未知'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box>
          <Typography variant="h6" gutterBottom>
            账户安全
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/backup')}
              sx={{ mr: 2, mb: { xs: 2, md: 0 } }}
            >
              账户备份
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/change-pin')}
            >
              修改PIN码
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;