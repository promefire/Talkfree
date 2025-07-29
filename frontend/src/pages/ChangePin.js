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
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  VisibilityOff,
  Lock
} from '@mui/icons-material';

const ChangePin = () => {
  const navigate = useNavigate();
  const { connected } = useContext(Web3Context);
  const { isAuthenticated, verifyPin, updatePin } = useContext(AuthContext);
  
  const [activeStep, setActiveStep] = useState(0);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmNewPin, setShowConfirmNewPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 检查认证状态
  useEffect(() => {
    if (!connected || !isAuthenticated) {
      navigate('/login');
    }
  }, [connected, isAuthenticated, navigate]);
  
  // 处理返回到个人资料页面
  const handleBackToProfile = () => {
    navigate('/profile');
  };
  
  // 处理下一步
  const handleNext = async () => {
    if (activeStep === 0) {
      // 验证当前PIN码
      if (!currentPin) {
        setError('请输入当前PIN码');
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        const verified = await verifyPin(currentPin);
        if (verified) {
          setActiveStep(1);
        } else {
          setError('当前PIN码不正确');
        }
      } catch (error) {
        setError('验证PIN码时出错: ' + error.message);
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // 验证新PIN码
      if (!newPin) {
        setError('请输入新PIN码');
        return;
      }
      
      if (newPin.length < 6) {
        setError('PIN码至少需要6位');
        return;
      }
      
      if (newPin === currentPin) {
        setError('新PIN码不能与当前PIN码相同');
        return;
      }
      
      if (newPin !== confirmNewPin) {
        setError('新PIN码与确认PIN码不匹配');
        return;
      }
      
      setError('');
      setActiveStep(2);
    }
  };
  
  // 处理上一步
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
  };
  
  // 处理更新PIN码
  const handleUpdatePin = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await updatePin(currentPin, newPin);
      
      setSuccess('PIN码已成功更新');
      
      // 延迟导航回个人资料页面
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      setError('更新PIN码时出错: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 切换当前PIN码可见性
  const handleToggleCurrentPinVisibility = () => {
    setShowCurrentPin(!showCurrentPin);
  };
  
  // 切换新PIN码可见性
  const handleToggleNewPinVisibility = () => {
    setShowNewPin(!showNewPin);
  };
  
  // 切换确认新PIN码可见性
  const handleToggleConfirmNewPinVisibility = () => {
    setShowConfirmNewPin(!showConfirmNewPin);
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBackToProfile} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1">
            修改PIN码
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
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>验证当前PIN码</StepLabel>
          </Step>
          <Step>
            <StepLabel>设置新PIN码</StepLabel>
          </Step>
          <Step>
            <StepLabel>确认</StepLabel>
          </Step>
        </Stepper>
        
        {activeStep === 0 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              请输入您当前的PIN码进行验证
            </Typography>
            
            <TextField
              fullWidth
              label="当前PIN码"
              variant="outlined"
              type={showCurrentPin ? 'text' : 'password'}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle current pin visibility"
                      onClick={handleToggleCurrentPinVisibility}
                      edge="end"
                    >
                      {showCurrentPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              请设置您的新PIN码（至少6位）
            </Typography>
            
            <TextField
              fullWidth
              label="新PIN码"
              variant="outlined"
              type={showNewPin ? 'text' : 'password'}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle new pin visibility"
                      onClick={handleToggleNewPinVisibility}
                      edge="end"
                    >
                      {showNewPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="确认新PIN码"
              variant="outlined"
              type={showConfirmNewPin ? 'text' : 'password'}
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value)}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm new pin visibility"
                      onClick={handleToggleConfirmNewPinVisibility}
                      edge="end"
                    >
                      {showConfirmNewPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              确认修改PIN码
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              您即将修改您的PIN码。PIN码是保护您账户安全的重要凭证，请确保记住您的新PIN码。
            </Alert>
            
            <Typography variant="body1" gutterBottom>
              点击"确认修改"按钮后，您的PIN码将被更新。
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            上一步
          </Button>
          
          <Box sx={{ flex: '1 1 auto' }} />
          
          {activeStep === 2 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdatePin}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
            >
              确认修改
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '下一步'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ChangePin;