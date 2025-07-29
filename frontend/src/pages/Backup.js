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
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  VisibilityOff,
  CloudUpload,
  CloudDownload,
  ContentCopy,
  Key
} from '@mui/icons-material';

const Backup = () => {
  const navigate = useNavigate();
  const { connected } = useContext(Web3Context);
  const {
    isAuthenticated,
    currentUser,
    verifyPin,
    getBackupData,
    updateBackupData,
    getRecoveryPhrase,
    updateRecoveryPhrase
  } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState(0);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [backupData, setBackupData] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [newRecoveryPhrase, setNewRecoveryPhrase] = useState('');
  const [confirmRecoveryPhrase, setConfirmRecoveryPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  
  // 检查认证状态
  useEffect(() => {
    if (!connected || !isAuthenticated) {
      navigate('/login');
    }
  }, [connected, isAuthenticated, navigate]);
  
  // 处理返回
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  // 处理标签切换
  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    setPinVerified(false);
    setPin('');
    setError('');
    setSuccess('');
  };
  
  // 处理PIN码验证
  const handleVerifyPin = async () => {
    if (!pin) {
      setError('请输入PIN码');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const verified = await verifyPin(pin);
      if (verified) {
        setPinVerified(true);
        
        if (activeTab === 0) {
          // 获取备份数据
          const data = await getBackupData();
          setBackupData(data);
        } else if (activeTab === 1) {
          // 获取恢复短语
          const phrase = await getRecoveryPhrase();
          setRecoveryPhrase(phrase);
        }
      } else {
        setError('PIN码不正确');
      }
    } catch (error) {
      setError('验证PIN码时出错: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理备份数据更新
  const handleUpdateBackupData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await updateBackupData(pin);
      
      setSuccess('账户数据已成功备份到区块链');
    } catch (error) {
      setError('备份账户数据时出错: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理恢复短语更新
  const handleUpdateRecoveryPhrase = async () => {
    if (!newRecoveryPhrase) {
      setError('请输入新的恢复短语');
      return;
    }
    
    if (newRecoveryPhrase !== confirmRecoveryPhrase) {
      setError('恢复短语不匹配');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await updateRecoveryPhrase(pin, newRecoveryPhrase);
      
      setSuccess('恢复短语已成功更新');
      setRecoveryPhrase(newRecoveryPhrase);
      setNewRecoveryPhrase('');
      setConfirmRecoveryPhrase('');
    } catch (error) {
      setError('更新恢复短语时出错: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理复制到剪贴板
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('已复制到剪贴板');
  };
  
  // 处理确认对话框打开
  const handleOpenConfirmDialog = (action) => {
    setDialogAction(action);
    setOpenConfirmDialog(true);
  };
  
  // 处理确认对话框关闭
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };
  
  // 处理确认操作
  const handleConfirmAction = () => {
    setOpenConfirmDialog(false);
    
    if (dialogAction === 'backup') {
      handleUpdateBackupData();
    } else if (dialogAction === 'updateRecovery') {
      handleUpdateRecoveryPhrase();
    }
  };
  
  // 切换PIN码可见性
  const handleTogglePinVisibility = () => {
    setShowPin(!showPin);
  };
  
  // 切换恢复短语可见性
  const handleToggleRecoveryPhraseVisibility = () => {
    setShowRecoveryPhrase(!showRecoveryPhrase);
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1">
            账户安全与备份
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
        
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <Button
              variant={activeTab === 0 ? "contained" : "outlined"}
              color="primary"
              onClick={() => handleTabChange(0)}
              sx={{ mr: 2 }}
              startIcon={<CloudUpload />}
            >
              账户备份
            </Button>
            <Button
              variant={activeTab === 1 ? "contained" : "outlined"}
              color="primary"
              onClick={() => handleTabChange(1)}
              startIcon={<Key />}
            >
              恢复短语
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {!pinVerified ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                请输入您的PIN码以{activeTab === 0 ? '备份账户' : '管理恢复短语'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <TextField
                  label="PIN码"
                  variant="outlined"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  sx={{ mr: 2 }}
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
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleVerifyPin}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : '验证'}
                </Button>
              </Box>
            </Box>
          ) : activeTab === 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                账户备份
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                账户备份将加密您的账户数据并存储在区块链上。这样即使您丢失了设备，也可以通过您的钱包地址和PIN码恢复账户。
              </Alert>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  上次备份时间: {backupData ? new Date(JSON.parse(backupData).timestamp).toLocaleString() : '从未备份'}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUpload />}
                onClick={() => handleOpenConfirmDialog('backup')}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : '立即备份'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                恢复短语管理
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                恢复短语是恢复您账户的最后手段。请将其安全保存，不要与任何人分享。
              </Alert>
              
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  当前恢复短语:
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    type={showRecoveryPhrase ? 'text' : 'password'}
                    value={recoveryPhrase}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleToggleRecoveryPhraseVisibility}
                            edge="end"
                          >
                            {showRecoveryPhrase ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mr: 1 }}
                  />
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleCopyToClipboard(recoveryPhrase)}
                    startIcon={<ContentCopy />}
                  >
                    复制
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                更新恢复短语
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                如果您认为当前的恢复短语可能已泄露，您可以更新为新的恢复短语。
              </Alert>
              
              <TextField
                fullWidth
                label="新恢复短语"
                variant="outlined"
                type={showRecoveryPhrase ? 'text' : 'password'}
                value={newRecoveryPhrase}
                onChange={(e) => setNewRecoveryPhrase(e.target.value)}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleToggleRecoveryPhraseVisibility}
                        edge="end"
                      >
                        {showRecoveryPhrase ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="确认新恢复短语"
                variant="outlined"
                type={showRecoveryPhrase ? 'text' : 'password'}
                value={confirmRecoveryPhrase}
                onChange={(e) => setConfirmRecoveryPhrase(e.target.value)}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleToggleRecoveryPhraseVisibility}
                        edge="end"
                      >
                        {showRecoveryPhrase ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenConfirmDialog('updateRecovery')}
                  disabled={loading || !newRecoveryPhrase || !confirmRecoveryPhrase}
                >
                  {loading ? <CircularProgress size={24} /> : '更新恢复短语'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* 确认对话框 */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>
          {dialogAction === 'backup' ? '确认备份' : '确认更新恢复短语'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {dialogAction === 'backup'
              ? '您确定要备份您的账户数据到区块链吗？这将覆盖之前的备份。'
              : '您确定要更新您的恢复短语吗？请确保您已安全保存新的恢复短语。'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            取消
          </Button>
          <Button onClick={handleConfirmAction} color="primary" variant="contained">
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Backup;