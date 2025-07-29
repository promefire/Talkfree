import React from 'react';
import { Box, Typography, Paper, Avatar, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

// 自定义样式组件
const MessageContainer = styled(Box)(({ theme, sent }) => ({
  display: 'flex',
  flexDirection: sent ? 'row-reverse' : 'row',
  alignItems: 'flex-end',
  marginBottom: theme.spacing(2),
  animation: 'fadeIn 0.3s ease-in-out',
}));

const MessageContent = styled(Paper)(({ theme, sent }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  maxWidth: '70%',
  wordWrap: 'break-word',
  position: 'relative',
  marginLeft: sent ? 0 : theme.spacing(1),
  marginRight: sent ? theme.spacing(1) : 0,
  backgroundColor: sent ? theme.palette.primary.light : theme.palette.background.paper,
  color: sent ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  borderBottomRightRadius: sent ? theme.spacing(0.5) : theme.spacing(2),
  borderBottomLeftRadius: sent ? theme.spacing(2) : theme.spacing(0.5),
  '@media (max-width: 600px)': {
    maxWidth: '85%',
  },
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
  textAlign: 'right',
}));

const MessageBubble = ({ message, sent, timestamp, username, avatar }) => {
  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
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
    <MessageContainer sent={sent}>
      {!sent && (
        <Tooltip title={username || '未知用户'} placement="top">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: getUserColor(username),
              fontSize: 14,
            }}
          >
            {username ? username.charAt(0).toUpperCase() : '?'}
          </Avatar>
        </Tooltip>
      )}
      
      <Box sx={{ maxWidth: '100%' }}>
        <MessageContent sent={sent}>
          <Typography variant="body1">
            {message}
          </Typography>
        </MessageContent>
        
        <MessageTime>
          {formatTimestamp(timestamp)}
        </MessageTime>
      </Box>
    </MessageContainer>
  );
};

export default MessageBubble;