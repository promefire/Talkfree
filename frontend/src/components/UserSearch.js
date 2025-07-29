import React, { useState, useEffect, useContext } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import { Search, Clear, PersonAdd } from '@mui/icons-material';
import { Web3Context } from '../contexts/Web3Context';
import { ChatContext } from '../contexts/ChatContext';
import EmptyState from './EmptyState';

const UserSearch = ({ onSelectUser, excludeAddresses = [], buttonText = '添加' }) => {
  const { web3, accounts } = useContext(Web3Context);
  const { searchUsers, friends } = useContext(ChatContext);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 处理搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const results = await searchUsers(searchQuery);
      
      // 过滤掉已经是好友的用户和排除列表中的地址
      const filteredResults = results.filter(user => {
        const isFriend = friends.some(friend => friend.address.toLowerCase() === user.address.toLowerCase());
        const isExcluded = excludeAddresses.some(addr => addr.toLowerCase() === user.address.toLowerCase());
        const isSelf = accounts[0] && accounts[0].toLowerCase() === user.address.toLowerCase();
        
        return !isFriend && !isExcluded && !isSelf;
      });
      
      setSearchResults(filteredResults);
    } catch (error) {
      setError('搜索用户时出错: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError('');
  };
  
  // 处理按键按下
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
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
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        label="搜索用户"
        placeholder="输入用户名或地址"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {searchQuery && (
                <IconButton
                  aria-label="clear search"
                  onClick={handleClearSearch}
                  edge="end"
                >
                  <Clear />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={!searchQuery.trim() || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Search />}
        >
          搜索
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1, mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {searchResults.length > 0 ? (
        <Paper variant="outlined" sx={{ mt: 2 }}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {searchResults.map((user, index) => (
              <React.Fragment key={user.address}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PersonAdd />}
                      onClick={() => onSelectUser(user)}
                    >
                      {buttonText}
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: getUserColor(user.username),
                      }}
                    >
                      {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username || '未设置用户名'}
                    secondary={
                      <Typography
                        sx={{ display: 'block' }}
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {`${user.address.substring(0, 6)}...${user.address.substring(user.address.length - 4)}`}
                      </Typography>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : searchQuery && !loading ? (
        <EmptyState
          title="未找到用户"
          description="尝试使用不同的搜索词或钱包地址"
        />
      ) : null}
    </Box>
  );
};

export default UserSearch;