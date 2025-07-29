import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Context';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Add,
  Delete,
  Group
} from '@mui/icons-material';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { connected } = useContext(Web3Context);
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const { friends, loadFriends, createGroup, searchUsers } = useContext(ChatContext);
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 检查认证状态
  useEffect(() => {
    if (!connected || !isAuthenticated) {
      navigate('/login');
    }
  }, [connected, isAuthenticated, navigate]);
  
  // 加载好友列表
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadFriends();
      } catch (error) {
        setError('加载好友列表时出错: ' + error.message);
      }
    };
    
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadFriends]);
  
  // 处理返回
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  // 处理搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    
    try {
      setSearchLoading(true);
      setError('');
      
      const results = await searchUsers(searchQuery);
      // 过滤掉已选择的成员和当前用户
      const filteredResults = results.filter(result => 
        result.address.toLowerCase() !== currentUser.address.toLowerCase() &&
        !selectedMembers.some(member => member.address.toLowerCase() === result.address.toLowerCase())
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      setError('搜索用户时出错: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // 处理添加成员
  const handleAddMember = (member) => {
    setSelectedMembers([...selectedMembers, member]);
    setSearchResults(searchResults.filter(result => result.address !== member.address));
  };
  
  // 处理添加好友为成员
  const handleAddFriend = (friend) => {
    if (!selectedMembers.some(member => member.address === friend.address)) {
      setSelectedMembers([...selectedMembers, friend]);
    }
  };
  
  // 处理移除成员
  const handleRemoveMember = (address) => {
    setSelectedMembers(selectedMembers.filter(member => member.address !== address));
  };
  
  // 处理创建群组
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('请输入群组名称');
      return;
    }
    
    if (selectedMembers.length === 0) {
      setError('请至少添加一个成员');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const memberAddresses = selectedMembers.map(member => member.address);
      const groupId = await createGroup(groupName, groupDescription, memberAddresses);
      
      setSuccess('群组创建成功！');
      
      // 延迟导航到新创建的群组聊天页面
      setTimeout(() => {
        navigate(`/group-chat/${groupId}`);
      }, 1500);
    } catch (error) {
      setError('创建群组时出错: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1">
            创建新群组
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
        
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="群组名称"
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="群组描述（可选）"
            variant="outlined"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          添加成员
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            label="搜索用户名或地址"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={searchLoading}
            startIcon={searchLoading ? <CircularProgress size={20} /> : <Search />}
          >
            搜索
          </Button>
        </Box>
        
        {/* 搜索结果 */}
        {searchResults.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              搜索结果
            </Typography>
            <List>
              {searchResults.map((result) => (
                <ListItem key={result.address}>
                  <ListItemAvatar>
                    <Avatar>{result.username.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={result.username}
                    secondary={result.address}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleAddMember(result)}>
                      <Add />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {/* 好友列表 */}
        {friends.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              从好友中添加
            </Typography>
            <List>
              {friends.map((friend) => (
                <ListItem key={friend.address}>
                  <ListItemAvatar>
                    <Avatar>{friend.username.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={friend.username}
                    secondary={friend.address}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleAddFriend(friend)}
                      disabled={selectedMembers.some(member => member.address === friend.address)}
                    >
                      <Add />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {/* 已选成员 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            已选成员 ({selectedMembers.length})
          </Typography>
          
          {selectedMembers.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedMembers.map((member) => (
                <Chip
                  key={member.address}
                  avatar={<Avatar>{member.username.charAt(0).toUpperCase()}</Avatar>}
                  label={member.username}
                  onDelete={() => handleRemoveMember(member.address)}
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              尚未选择任何成员
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateGroup}
            disabled={loading || !groupName.trim() || selectedMembers.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <Group />}
            size="large"
          >
            创建群组
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateGroup;