import React, { useState } from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Button,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';

const FriendRequest = ({
  request,
  onAccept,
  onReject,
  incoming = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(request.status);
  
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
  
  // 处理接受请求
  const handleAccept = async () => {
    try {
      setLoading(true);
      setError('');
      
      await onAccept(request);
      setStatus('accepted');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理拒绝请求
  const handleReject = async () => {
    try {
      setLoading(true);
      setError('');
      
      await onReject(request);
      setStatus('rejected');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // 获取状态标签
  const getStatusChip = () => {
    switch (status) {
      case 'pending':
        return (
          <Chip
            icon={<Schedule fontSize="small" />}
            label="等待中"
            size="small"
            color="warning"
            variant="outlined"
          />
        );
      case 'accepted':
        return (
          <Chip
            icon={<CheckCircle fontSize="small" />}
            label="已接受"
            size="small"
            color="success"
            variant="outlined"
          />
        );
      case 'rejected':
        return (
          <Chip
            icon={<Cancel fontSize="small" />}
            label="已拒绝"
            size="small"
            color="error"
            variant="outlined"
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <ListItem
      alignItems="flex-start"
      secondaryAction={
        status === 'pending' && incoming ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleReject}
              disabled={loading}
            >
              拒绝
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : '接受'}
            </Button>
          </Box>
        ) : (
          getStatusChip()
        )
      }
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            bgcolor: getUserColor(request.username),
          }}
        >
          {request.username ? request.username.charAt(0).toUpperCase() : '?'}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Typography variant="subtitle1">
            {request.username || '未设置用户名'}
          </Typography>
        }
        secondary={
          <React.Fragment>
            <Typography
              sx={{ display: 'block' }}
              component="span"
              variant="body2"
              color="text.secondary"
            >
              {`${request.address.substring(0, 6)}...${request.address.substring(request.address.length - 4)}`}
            </Typography>
            
            <Typography
              sx={{ display: 'block' }}
              component="span"
              variant="body2"
              color="text.secondary"
            >
              {incoming ? '请求添加您为好友' : '您发送了好友请求'} · {formatTimestamp(request.timestamp)}
            </Typography>
            
            {error && (
              <Typography
                sx={{ display: 'block', mt: 1 }}
                component="span"
                variant="body2"
                color="error"
              >
                错误: {error}
              </Typography>
            )}
          </React.Fragment>
        }
      />
    </ListItem>
  );
};

export default FriendRequest;