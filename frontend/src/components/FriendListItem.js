import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Typography,
  Badge,
  Box
} from '@mui/material';
import { styled } from '@mui/material/styles';

// 自定义样式的在线状态徽章
const OnlineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

// 离线状态徽章
const OfflineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#bdbdbd',
    color: '#bdbdbd',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
}));

const FriendListItem = ({
  friend,
  unreadCount = 0,
  lastMessage = null,
  lastMessageTime = null,
  selected = false,
}) => {
  const navigate = useNavigate();
  
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
  
  // 处理点击好友
  const handleClick = () => {
    navigate(`/chat/${friend.address}`);
  };
  
  // 判断是否在线（这里简单模拟，实际应该根据好友的在线状态判断）
  const isOnline = friend.status === 'online';
  
  // 根据在线状态选择徽章组件
  const BadgeComponent = isOnline ? OnlineBadge : OfflineBadge;
  
  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {lastMessageTime && (
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(lastMessageTime)}
            </Typography>
          )}
          
          {unreadCount > 0 && (
            <Badge
              badgeContent={unreadCount}
              color="primary"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      }
    >
      <ListItemButton
        selected={selected}
        onClick={handleClick}
        sx={{
          borderRadius: 1,
          '&.Mui-selected': {
            backgroundColor: (theme) => 
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <ListItemAvatar>
          <BadgeComponent
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
          >
            <Avatar
              sx={{
                bgcolor: getUserColor(friend.username),
              }}
            >
              {friend.username ? friend.username.charAt(0).toUpperCase() : '?'}
            </Avatar>
          </BadgeComponent>
        </ListItemAvatar>
        
        <ListItemText
          primary={friend.username || '未设置用户名'}
          secondary={
            lastMessage ? (
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ maxWidth: '180px' }}
              >
                {lastMessage}
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {friend.status || '离线'}
              </Typography>
            )
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export default FriendListItem;