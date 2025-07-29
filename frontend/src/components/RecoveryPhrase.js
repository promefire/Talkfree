import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  ContentCopy,
  Visibility,
  VisibilityOff,
  Refresh
} from '@mui/icons-material';

const RecoveryPhrase = ({
  phrase,
  onRegeneratePhrase,
  readOnly = false,
  title = '恢复短语',
  description = '请妥善保管您的恢复短语，它可以用于恢复您的账户。',
}) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 切换可见性
  const toggleVisibility = () => {
    setVisible(!visible);
  };
  
  // 复制到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(phrase.join(' '));
    setCopied(true);
  };
  
  // 关闭复制提示
  const handleCloseCopyAlert = () => {
    setCopied(false);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 2 }}>
        {description}
      </Alert>
      
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!visible && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backdropFilter: 'blur(5px)',
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<Visibility />}
              onClick={toggleVisibility}
            >
              显示恢复短语
            </Button>
          </Box>
        )}
        
        <Grid container spacing={1}>
          {phrase.map((word, index) => (
            <Grid item xs={4} sm={3} key={index}>
              <Paper
                sx={{
                  p: 1,
                  textAlign: 'center',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                  {index + 1}
                </Typography>
                <Typography variant="body1">
                  {visible ? word : '••••••'}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title={visible ? "隐藏恢复短语" : "显示恢复短语"}>
            <IconButton onClick={toggleVisibility} color="primary">
              {visible ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="复制恢复短语">
            <IconButton onClick={copyToClipboard} color="primary">
              <ContentCopy />
            </IconButton>
          </Tooltip>
        </Box>
        
        {!readOnly && onRegeneratePhrase && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Refresh />}
            onClick={onRegeneratePhrase}
          >
            重新生成
          </Button>
        )}
      </Box>
      
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={handleCloseCopyAlert}
        message="恢复短语已复制到剪贴板"
      />
    </Box>
  );
};

export default RecoveryPhrase;