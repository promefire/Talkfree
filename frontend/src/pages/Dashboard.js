import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Context';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
  Badge,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Message,
  Group,
  PersonAdd,
  Search,
  Notifications,
  Settings,
  AccountCircle,
  ExitToApp
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const { connected } = useContext(Web3Context);
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const {
    friends,
    groups,
    friendRequests,
    loadFriends,
    loadGroups,
    loadFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers
  } = useContext(ChatContext);

  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [openFriendRequestsDialog, setOpenFriendRequestsDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // 检查认证状态
  useEffect(() => {
    if (!connected || !isAuthenticated) {
      navigate('/login');
    }
  }, [connected, isAuthenticated, navigate]);

  // 加载好友、群组和好友请求
  useEffect(() => {
    if (isAuthenticated) {
      loadFriends();
      loadGroups();
      loadFriendRequests();
    }
  }, [isAuthenticated, loadFriends, loadGroups, loadFriendRequests]);

  // 处理标签页变化
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedFriend(null);
    setSelectedGroup(null);
  };

  // 处理好友点击
  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    navigate(`/chat/${friend.address}`);
  };

  // 处理群组点击
  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    navigate(`/group-chat/${group.id}`);
  };

  // 处理搜索对话框打开
  const handleOpenSearchDialog = () => {
    setOpenSearchDialog(true);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
  };

  // 处理搜索对话框关闭
  const handleCloseSearchDialog = () => {
    setOpenSearchDialog(false);
  };

  // 处理好友请求对话框打开
  const handleOpenFriendRequestsDialog = () => {
    setOpenFriendRequestsDialog(true);
  };

  // 处理好友请求对话框关闭
  const handleCloseFriendRequestsDialog = () => {
    setOpenFriendRequestsDialog(false);
  };

  // 处理搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('请输入搜索关键词');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      setSearchError('搜索时出错: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // 处理发送好友请求
  const handleSendFriendRequest = async (address) => {
    try {
      await sendFriendRequest(address);
      setSearchResults(searchResults.map(user => {
        if (user.address === address) {
          return { ...user, requestSent: true };
        }
        return user;
      }));
    } catch (error) {
      setSearchError('发送好友请求时出错: ' + error.message);
    }
  };

  // 处理接受好友请求
  const handleAcceptFriendRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      loadFriendRequests();
      loadFriends();
    } catch (error) {
      console.error('接受好友请求时出错:', error);
    }
  };

  // 处理拒绝好友请求
  const handleRejectFriendRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      loadFriendRequests();
    } catch (error) {
      console.error('拒绝好友请求时出错:', error);
    }
  };

  // 处理创建群组导航
  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  // 处理个人资料导航
  const handleProfile = () => {
    navigate('/profile');
  };

  // 处理账户备份导航
  const handleBackup = () => {
    navigate('/backup');
  };

  // 处理登出
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* 顶部栏 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h1">
              区块链点对点聊天
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton color="primary" onClick={handleOpenSearchDialog}>
                <Search />
              </IconButton>
              <IconButton color="primary" onClick={handleOpenFriendRequestsDialog}>
                <Badge badgeContent={friendRequests.length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton color="primary" onClick={handleProfile}>
                <AccountCircle />
              </IconButton>
              <IconButton color="primary" onClick={handleBackup}>
                <Settings />
              </IconButton>
              <IconButton color="primary" onClick={handleLogout}>
                <ExitToApp />
              </IconButton>
            </Box>
          </Paper>
        </Grid>

        {/* 侧边栏 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab icon={<Message />} label="好友" />
              <Tab icon={<Group />} label="群组" />
            </Tabs>
            <Divider sx={{ my: 1 }} />

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {tabValue === 0 ? (
                <List>
                  {friends.length > 0 ? (
                    friends.map((friend) => (
                      <React.Fragment key={friend.address}>
                        <ListItem button onClick={() => handleFriendClick(friend)}>
                          <ListItemAvatar>
                            <Avatar>{friend.username ? friend.username.charAt(0).toUpperCase() : '?'}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={friend.username}
                            secondary={friend.status || '在线'}
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        暂无好友
                      </Typography>
                    </Box>
                  )}
                </List>
              ) : (
                <List>
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <React.Fragment key={group.id}>
                        <ListItem button onClick={() => handleGroupClick(group)}>
                          <ListItemAvatar>
                            <Avatar>{group.name ? group.name.charAt(0).toUpperCase() : '?'}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={group.name}
                            secondary={`${group.memberCount || 0} 成员`}
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        暂无群组
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </Box>

            <Divider sx={{ my: 1 }} />
            <Box sx={{ p: 1 }}>
              {tabValue === 0 ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAdd />}
                  fullWidth
                  onClick={handleOpenSearchDialog}
                >
                  添加好友
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Group />}
                  fullWidth
                  onClick={handleCreateGroup}
                >
                  创建群组
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* 主内容区 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {tabValue === 0 ? '选择一个好友开始聊天' : '选择一个群组开始聊天'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              或者{tabValue === 0 ? '添加新好友' : '创建新群组'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 搜索用户对话框 */}
      <Dialog open={openSearchDialog} onClose={handleCloseSearchDialog} maxWidth="sm" fullWidth>
        <DialogTitle>搜索用户</DialogTitle>
        <DialogContent>
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
            >
              {searchLoading ? <CircularProgress size={24} /> : '搜索'}
            </Button>
          </Box>

          {searchError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {searchError}
            </Alert>
          )}

          <List>
            {searchResults.map((result) => (
              <React.Fragment key={result.address}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>{result.username ? result.username.charAt(0).toUpperCase() : '?'}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={result.username}
                    secondary={result.address}
                  />
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={result.requestSent || result.isFriend}
                    onClick={() => handleSendFriendRequest(result.address)}
                  >
                    {result.isFriend ? '已是好友' : result.requestSent ? '已发送请求' : '添加好友'}
                  </Button>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
            {searchResults.length === 0 && !searchLoading && searchQuery && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  未找到匹配的用户
                </Typography>
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSearchDialog} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>

      {/* 好友请求对话框 */}
      <Dialog open={openFriendRequestsDialog} onClose={handleCloseFriendRequestsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>好友请求</DialogTitle>
        <DialogContent>
          <List>
            {friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <React.Fragment key={request.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>{request.username ? request.username.charAt(0).toUpperCase() : '?'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={request.username}
                      secondary={`请求时间: ${request.createdAt ? request.createdAt.toLocaleString() : 'Invalid Date'}`}
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleAcceptFriendRequest(request.id)}
                      sx={{ mr: 1 }}
                    >
                      接受
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRejectFriendRequest(request.id)}
                    >
                      拒绝
                    </Button>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  暂无好友请求
                </Typography>
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFriendRequestsDialog} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;