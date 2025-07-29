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
  Button
} from '@mui/material';
import {
  Send,
  ArrowBack,
  AttachFile,
  Image,
  InsertEmoticon,
  MoreVert
} from '@mui/icons-material';

const Chat = () => {
  const { address } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const { connected } = useContext(Web3Context);
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const {
    friends,
    loadFriends,
    loadPersonalMessages,
    sendMessage
  } = useContext(ChatContext);
  
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  
  // 检查认证状态
  useEffect(() => {
    if (!connected || !isAuthenticated) {
      navigate('/login');
    }
  }, [connected, isAuthenticated, navigate]);
  
  // 加载好友信息
  useEffect(() => {
    const loadFriendData = async () => {
      try {
        if (friends.length === 0) {
          await loadFriends();
        }
        
        const foundFriend = friends.find(f => f.address.toLowerCase() === address.toLowerCase());
        if (foundFriend) {
          setFriend(foundFriend);
        } else {
          setError('找不到该好友');
        }
      } catch (error) {
        setError('加载好友信息时出错: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && address) {
      loadFriendData();
    }
  }, [isAuthenticated, address, friends, loadFriends]);
  
  // 加载消息
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const msgs = await loadPersonalMessages(address);
        setMessages(msgs);
      } catch (error) {
        setError('加载消息时出错: ' + error.message);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    if (friend) {
      loadMessages();
      
      // 设置消息轮询（实际应用中应使用WebSocket或事件监听）
      const intervalId = setInterval(loadMessages, 10000);
      return () => clearInterval(intervalId);
    }
  }, [friend, address, loadPersonalMessages]);
  
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
      
      await sendMessage(address, newMessage);
      setNewMessage('');
      
      // 重新加载消息
      const msgs = await loadPersonalMessages(address);
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
  
  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!friend && !error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">找不到该好友</Alert>
        <Button variant="contained" color="primary" onClick={handleBack} sx={{ mt: 2 }}>
          返回仪表板
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        {/* 聊天头部 */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          
          {friend && (
            <>
              <Avatar sx={{ mr: 2 }}>{friend.username.charAt(0).toUpperCase()}</Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{friend.username}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {friend.status || '在线'}
                </Typography>
              </Box>
            </>
          )}
          
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
                          {isMe ? currentUser.username.charAt(0).toUpperCase() : friend.username.charAt(0).toUpperCase()}
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
                暂无消息，开始聊天吧！
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
    </Container>
  );
};

export default Chat;