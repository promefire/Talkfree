import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Context';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AvatarGroup
} from '@mui/material';
import {
  Send,
  ArrowBack,
  AttachFile,
  Image,
  InsertEmoticon,
  MoreVert,
  Group,
  PersonAdd
} from '@mui/icons-material';

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const { connected } = useContext(Web3Context);
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const {
    groups,
    loadGroups,
    loadGroupMessages,
    sendGroupMessage,
    getGroupMembers,
    addGroupMember,
    removeGroupMember,
    searchUsers
  } = useContext(ChatContext);
  
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // 检查认证状态
  useEffect(() => {
    if (!connected || !isAuthenticated) {
      navigate('/login');
    }
  }, [connected, isAuthenticated, navigate]);
  
  // 加载群组信息
  useEffect(() => {
    const loadGroupData = async () => {
      try {
        if (groups.length === 0) {
          await loadGroups();
        }
        
        const foundGroup = groups.find(g => g.id === parseInt(groupId));
        if (foundGroup) {
          setGroup(foundGroup);
        } else {
          setError('找不到该群组');
        }
      } catch (error) {
        setError('加载群组信息时出错: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && groupId) {
      loadGroupData();
    }
  }, [isAuthenticated, groupId, groups, loadGroups]);
  
  // 加载消息和成员
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingMessages(true);
        const msgs = await loadGroupMessages(groupId);
        setMessages(msgs);
        
        const membersList = await getGroupMembers(groupId);
        setMembers(membersList);
      } catch (error) {
        setError('加载数据时出错: ' + error.message);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    if (group) {
      loadData();
      
      // 设置消息轮询（实际应用中应使用WebSocket或事件监听）
      const intervalId = setInterval(() => loadData(), 10000);
      return () => clearInterval(intervalId);
    }
  }, [group, groupId, loadGroupMessages, getGroupMembers]);
  
  // 滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 处理发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      setError('');
      
      await sendGroupMessage(groupId, newMessage);
      setNewMessage('');
      
      // 重新加载消息
      const msgs = await loadGroupMessages(groupId);
      setMessages(msgs);
    } catch (error) {
      setError('发送消息时出错: ' + error.message);
    } finally {
      setSending(false);
    }
  };
  
  // 处理按键事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // 处理返回
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  // 处理打开成员对话框
  const handleOpenMembersDialog = () => {
    setOpenMembersDialog(true);
  };
  
  // 处理关闭成员对话框
  const handleCloseMembersDialog = () => {
    setOpenMembersDialog(false);
  };
  
  // 处理打开添加成员对话框
  const handleOpenAddMemberDialog = () => {
    setOpenAddMemberDialog(true);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // 处理关闭添加成员对话框
  const handleCloseAddMemberDialog = () => {
    setOpenAddMemberDialog(false);
  };
  
  // 处理搜索用户
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearchLoading(true);
      // 实际应用中应调用搜索用户API
      const results = await searchUsers(searchQuery);
      // 过滤掉已经是成员的用户
      const filteredResults = results.filter(user => 
        !members.some(member => member.address.toLowerCase() === user.address.toLowerCase())
      );
      setSearchResults(filteredResults);
    } catch (error) {
      setError('搜索用户时出错: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // 处理添加成员
  const handleAddMember = async (address) => {
    try {
      await addGroupMember(groupId, address);
      // 更新成员列表
      const membersList = await getGroupMembers(groupId);
      setMembers(membersList);
      // 更新搜索结果
      setSearchResults(searchResults.filter(user => user.address.toLowerCase() !== address.toLowerCase()));
    } catch (error) {
      setError('添加成员时出错: ' + error.message);
    }
  };
  
  // 处理移除成员
  const handleRemoveMember = async (address) => {
    try {
      await removeGroupMember(groupId, address);
      // 更新成员列表
      const membersList = await getGroupMembers(groupId);
      setMembers(membersList);
    } catch (error) {
      setError('移除成员时出错: ' + error.message);
    }
  };
  
  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // 获取用户名
  const getUsernameByAddress = (address) => {
    if (address.toLowerCase() === currentUser.address.toLowerCase()) {
      return currentUser.username;
    }
    
    const member = members.find(m => m.address.toLowerCase() === address.toLowerCase());
    return member ? member.username : '未知用户';
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!group && !error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">找不到该群组</Alert>
        <Button variant="contained" color="primary" onClick={handleBack} sx={{ mt: 2 }}>
          返回仪表板
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        {/* 群组头部 */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          
          {group && (
            <>
              <Avatar sx={{ mr: 2 }}>
                <Group />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{group.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {members.length} 成员
                </Typography>
              </Box>
            </>
          )}
          
          <IconButton onClick={handleOpenMembersDialog}>
            <Group />
          </IconButton>
          <IconButton>
            <MoreVert />
          </IconButton>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* 消息列表 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
          {loadingMessages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : messages.length > 0 ? (
            <List>
              {messages.map((message, index) => {
                const isMe = message.sender.toLowerCase() === currentUser.address.toLowerCase();
                const senderUsername = getUsernameByAddress(message.sender);
                return (
                  <ListItem
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      p: 1
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isMe ? 'row-reverse' : 'row',
                        alignItems: 'flex-end'
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {senderUsername.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <Box
                        sx={{
                          backgroundColor: isMe ? '#dcf8c6' : '#ffffff',
                          borderRadius: '10px',
                          p: 1.5,
                          maxWidth: '70%',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        {!isMe && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                            {senderUsername}
                          </Typography>
                        )}
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
              <div ref={messagesEndRef} />
            </List>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body1" color="textSecondary">
                暂无消息，开始群聊吧！
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* 输入区域 */}
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#f8f8f8' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="primary">
              <InsertEmoticon />
            </IconButton>
            <IconButton color="primary">
              <AttachFile />
            </IconButton>
            <IconButton color="primary">
              <Image />
            </IconButton>
            
            <TextField
              fullWidth
              variant="outlined"
              placeholder="输入消息..."
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ mx: 1 }}
              size="small"
            />
            
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
            >
              {sending ? <CircularProgress size={24} /> : <Send />}
            </IconButton>
          </Box>
        </Box>
      </Paper>
      
      {/* 群组成员对话框 */}
      <Dialog open={openMembersDialog} onClose={handleCloseMembersDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">群组成员</Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PersonAdd />}
              onClick={() => {
                handleCloseMembersDialog();
                handleOpenAddMemberDialog();
              }}
            >
              添加成员
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {members.map((member) => (
              <ListItem key={member.address}>
                <ListItemAvatar>
                  <Avatar>{member.username.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.username}
                  secondary={member.address}
                />
                {/* 如果当前用户是群主，显示移除按钮 */}
                {group.owner.toLowerCase() === currentUser.address.toLowerCase() && 
                 member.address.toLowerCase() !== currentUser.address.toLowerCase() && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleRemoveMember(member.address)}
                  >
                    移除
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMembersDialog} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 添加成员对话框 */}
      <Dialog open={openAddMemberDialog} onClose={handleCloseAddMemberDialog} maxWidth="sm" fullWidth>
        <DialogTitle>添加群组成员</DialogTitle>
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
              onClick={handleSearchUsers}
              disabled={searchLoading}
            >
              {searchLoading ? <CircularProgress size={24} /> : '搜索'}
            </Button>
          </Box>
          
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
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleAddMember(result.address)}
                >
                  添加
                </Button>
              </ListItem>
            ))}
            {searchResults.length === 0 && searchQuery && !searchLoading && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  未找到匹配的用户
                </Typography>
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddMemberDialog} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GroupChat;