import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';

// 页面组件
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import GroupChat from './pages/GroupChat';
import Profile from './pages/Profile';
import AccountBackup from './pages/Backup';
import ChangePin from './pages/ChangePin';
import AddressManager from './components/AddressManager';

// 上下文
import { AuthProvider } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import { ChatProvider } from './contexts/ChatContext';

// 主题设置
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  // 从本地存储加载主题偏好
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // 检查系统偏好
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDarkMode);
    }
  }, []);
  
  // 切换主题
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };
  
  // 受保护的路由组件
  const ProtectedRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };
  
  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Web3Provider>
        <AuthProvider>
          <ChatProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard toggleTheme={toggleTheme} darkMode={darkMode} />
                </ProtectedRoute>
              } />
              <Route path="/chat/:address" element={
                <ProtectedRoute>
                  <Chat toggleTheme={toggleTheme} darkMode={darkMode} />
                </ProtectedRoute>
              } />
              <Route path="/group/:groupId" element={
                <ProtectedRoute>
                  <GroupChat toggleTheme={toggleTheme} darkMode={darkMode} />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile toggleTheme={toggleTheme} darkMode={darkMode} />
                </ProtectedRoute>
              } />
              <Route path="/backup" element={
                <ProtectedRoute>
                  <AccountBackup toggleTheme={toggleTheme} darkMode={darkMode} />
                </ProtectedRoute>
              } />
              <Route path="/change-pin" element={
                <ProtectedRoute>
                  <ChangePin toggleTheme={toggleTheme} darkMode={darkMode} />
                </ProtectedRoute>
              } />
              <Route path="/addresses" element={
                <ProtectedRoute>
                  <AddressManager />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;