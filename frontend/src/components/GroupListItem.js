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
  Box,
  AvatarGroup
} from '@mui/material';
import { Group } from '@mui/icons-material';

const GroupListItem = ({
  group,
  unreadCount = 0,
  lastMessage = null,
  lastMessageTime = null,
  selected = false,
  members = [],
}) => {
  const navigate = useNavigate();
  
  // 根据群组名称生成一致的颜色
  const getGroupColor = (groupName) => {
    if (!groupName) return '#9e9e9e';
    let hash = 0;
    for (let i = 0; i < groupName.length; i++) {
      hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ];
    return colors[Math.abs(hash) % colors.length];
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
  
  // 处理点击群组
  const handleClick = () => {
    navigate(`/group/${group.id}`);
  };
  
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
          <Avatar
            sx={{
              bgcolor: getGroupColor(group.name),
            }}
          >
            <Group />
          </Avatar>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                {group.name || '未命名群组'}
              </Typography>
              
              {members.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  ({members.length}人)
                </Typography>
              )}
            </Box>
          }
          secondary={
            <Box>
              {lastMessage ? (
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
                  {group.description || '无描述'}
                </Typography>
              )}
              
              {members.length > 0 && (
                <AvatarGroup max={3} sx={{ mt: 1 }}>
                  {members.map((member) => (
                    <Avatar
                      key={member.address}
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: 12,
                        bgcolor: getUserColor(member.username),
                      }}
                    >
                      {member.username ? member.username.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                  ))}
                </AvatarGroup>
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export default GroupListItem;