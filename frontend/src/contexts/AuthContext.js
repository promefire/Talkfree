import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from './Web3Context';
import { create } from 'ipfs-http-client';

// 创建上下文
export const AuthContext = createContext();

// IPFS客户端配置 - 使用本地节点
const ipfs = create({
  url: 'http://localhost:5001'
});

export const AuthProvider = ({ children }) => {
  const { account, contracts, connected, resetConnection, updateSigner } = useContext(Web3Context);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pinVerified, setPinVerified] = useState(false);

  // 检查是否是熔断器错误
  const isCircuitBreakerError = (error) => {
    return error.message && error.message.includes('circuit breaker is open');
  };

  // 处理熔断器错误
  const handleCircuitBreakerError = async () => {
    console.log('检测到熔断器错误，尝试重置连接...');
    if (resetConnection) {
      await resetConnection();
      // 等待连接重置完成
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  // 检查用户是否已注册
  const checkUserExists = useCallback(async () => {
    if (!connected || !account || !contracts.userAccount) {
      setLoading(false);
      return false;
    }

    try {
      const user = await contracts.userAccount.users(account);
      return user.exists;
    } catch (error) {
      console.error('检查用户存在时出错:', error);
      return false;
    }
  }, [connected, account, contracts.userAccount]);

  // 检查账户是否已创建
  const checkAccountExists = useCallback(async () => {
    if (!connected || !account || !contracts.accountManager) {
      setLoading(false);
      return false;
    }

    try {
      return await contracts.accountManager.accountExists(account);
    } catch (error) {
      console.error('检查账户存在时出错:', error);
      return false;
    }
  }, [connected, account, contracts.accountManager]);

  // 加载用户数据
  const loadUserData = useCallback(async () => {
    if (!connected || !account || !contracts.userAccount) {
      setLoading(false);
      return;
    }

    try {
      const user = await contracts.userAccount.users(account);
      if (user.exists) {
        setCurrentUser({
          address: account,
          username: user.username,
          publicKey: user.publicKey,
          status: user.status,
          createdAt: new Date(Number(user.createdAt) * 1000)
        });
      }
    } catch (error) {
      console.error('加载用户数据时出错:', error);
      setError('加载用户数据时出错');
    } finally {
      setLoading(false);
    }
  }, [connected, account, contracts.userAccount]);

  // 创建用户账户
  const createUser = async (username, publicKey, retryCount = 0) => {
    if (!connected || !contracts.userAccount) {
      throw new Error('未连接到区块链');
    }

    try {
      const tx = await contracts.userAccount.createUser(username, publicKey);
      await tx.wait();

      // 更新用户数据
      await loadUserData();
      return true;
    } catch (error) {
      console.error('创建用户时出错:', error);
      
      // 检查是否是熔断器错误
      if (isCircuitBreakerError(error) && retryCount < 2) {
        console.log(`熔断器错误，尝试重试 (${retryCount + 1}/2)...`);
        await handleCircuitBreakerError();
        // 递归重试
        return createUser(username, publicKey, retryCount + 1);
      }
      
      throw error;
    }
  };

  // 创建账户管理
  const createAccount = async (pin, recoveryPhrase, retryCount = 0) => {
    if (!connected || !contracts.accountManager) {
      throw new Error('未连接到区块链');
    }

    try {
      // 计算PIN码的哈希值
      const pinHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(pin));
      
      let backupHash = '';
      
      try {
        // 尝试加密恢复短语并上传到IPFS
        const encryptedRecoveryPhrase = await encryptData(recoveryPhrase, pin);
        const { path } = await ipfs.add(JSON.stringify(encryptedRecoveryPhrase));
        backupHash = path;
        console.log('恢复短语已上传到IPFS:', path);
      } catch (ipfsError) {
        console.warn('IPFS上传失败，使用本地存储作为备用方案:', ipfsError.message);
        // 如果IPFS失败，使用本地哈希作为备用
        const encryptedRecoveryPhrase = await encryptData(recoveryPhrase, pin);
        backupHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(encryptedRecoveryPhrase)));
        
        // 将加密的恢复短语存储在本地存储中作为备用
        localStorage.setItem(`backup_${account}`, JSON.stringify(encryptedRecoveryPhrase));
      }
      
      // 创建账户
      const tx = await contracts.accountManager.createAccount(pinHash, backupHash);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('创建账户时出错:', error);
      
      // 检查是否是熔断器错误
      if (isCircuitBreakerError(error) && retryCount < 2) {
        console.log(`熔断器错误，尝试重试 (${retryCount + 1}/2)...`);
        await handleCircuitBreakerError();
        // 递归重试
        return createAccount(pin, recoveryPhrase, retryCount + 1);
      }
      
      throw error;
    }
  };

  // 验证PIN码
  const verifyPin = async (pin) => {
    if (!connected || !contracts.accountManager) {
      throw new Error('未连接到区块链');
    }

    try {
      // 计算PIN码的哈希值
      const pinHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(pin));
      
      // 验证PIN码
      const isValid = await contracts.accountManager.verifyPin(pinHash);
      setPinVerified(isValid);
      return isValid;
    } catch (error) {
      console.error('验证PIN码时出错:', error);
      throw error;
    }
  };

  // 更新PIN码
  const updatePin = async (currentPin, newPin) => {
    if (!connected || !contracts.accountManager) {
      throw new Error('未连接到区块链');
    }

    try {
      // 计算PIN码的哈希值
      const currentPinHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(currentPin));
      const newPinHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(newPin));
      
      // 更新PIN码
      const tx = await contracts.accountManager.updatePin(currentPinHash, newPinHash);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('更新PIN码时出错:', error);
      throw error;
    }
  };

  // 备份账户数据
  const backupAccount = async (pin, backupData) => {
    if (!connected || !contracts.accountManager) {
      throw new Error('未连接到区块链');
    }

    try {
      // 计算PIN码的哈希值
      const pinHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(pin));
      
      let backupHash = '';
      
      try {
        // 尝试加密备份数据并上传到IPFS
        const encryptedBackupData = await encryptData(backupData, pin);
        const { path } = await ipfs.add(JSON.stringify(encryptedBackupData));
        backupHash = path;
        console.log('备份数据已上传到IPFS:', path);
      } catch (ipfsError) {
        console.warn('IPFS上传失败，使用本地存储作为备用方案:', ipfsError.message);
        // 如果IPFS失败，使用本地哈希作为备用
        const encryptedBackupData = await encryptData(backupData, pin);
        backupHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(encryptedBackupData)));
        
        // 将加密的备份数据存储在本地存储中作为备用
        localStorage.setItem(`backup_data_${account}`, JSON.stringify(encryptedBackupData));
      }
      
      // 更新备份数据
      const tx = await contracts.accountManager.updateBackup(pinHash, backupHash);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('备份账户时出错:', error);
      throw error;
    }
  };

  // 恢复账户数据
  const restoreAccount = async (recoveryPhrase) => {
    if (!connected || !contracts.accountManager) {
      throw new Error('未连接到区块链');
    }

    try {
      // 通过恢复短语找回账户地址
      const accountAddress = await contracts.accountManager.recoverAccountAddress(recoveryPhrase);
      
      if (accountAddress === ethers.constants.AddressZero) {
        throw new Error('无效的恢复短语');
      }
      
      return accountAddress;
    } catch (error) {
      console.error('恢复账户时出错:', error);
      throw error;
    }
  };

  // 重置PIN码
  const resetPin = async (recoveryPhrase, newPin) => {
    if (!connected || !contracts.accountManager) {
      throw new Error('未连接到区块链');
    }

    try {
      // 计算新PIN码的哈希值
      const newPinHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(newPin));
      
      // 重置PIN码
      const tx = await contracts.accountManager.resetPin(recoveryPhrase, newPinHash);
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error('重置PIN码时出错:', error);
      throw error;
    }
  };

  // 加密数据
  const encryptData = async (data, key) => {
    // 简单的加密实现，实际应用中应使用更安全的加密方法
    return {
      data: btoa(data),
      salt: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now()
    };
  };

  // 解密数据
  const decryptData = async (encryptedData, key) => {
    // 简单的解密实现，实际应用中应使用更安全的解密方法
    return atob(encryptedData.data);
  };

  // 更新用户信息
  const updateUser = async (username, status) => {
    if (!connected || !contracts.userAccount) {
      throw new Error('未连接到区块链');
    }

    try {
      // 调用合约更新用户信息
      const tx = await contracts.userAccount.updateUser(username, status || '');
      await tx.wait();

      // 重新加载用户数据
      await loadUserData();
      return true;
    } catch (error) {
      console.error('更新用户信息时出错:', error);
      throw error;
    }
  };

  // 设置用户（用于登录）
  const setUser = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // 如果用户数据包含钱包信息，更新Web3Context中的签名者
     if (userData.wallet && userData.address && updateSigner) {
       updateSigner(userData.wallet, userData.address);
     }
   };

  // 登录
  const login = async (pin) => {
    try {
      const isValid = await verifyPin(pin);
      if (isValid) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('登录时出错:', error);
      throw error;
    }
  };

  // 登出
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPinVerified(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
  };

  // 初始化时检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      const savedAuth = localStorage.getItem('isAuthenticated') === 'true';
      const savedUser = localStorage.getItem('currentUser');
      
      if (savedAuth && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('解析保存的用户数据时出错:', error);
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('currentUser');
        }
      }
      
      if (savedAuth && connected) {
        await loadUserData();
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [connected, loadUserData]);

  // 上下文值
  const contextValue = {
    currentUser,
    isAuthenticated,
    pinVerified,
    loading,
    error,
    checkUserExists,
    checkAccountExists,
    createUser,
    createAccount,
    updateUser,
    verifyPin,
    updatePin,
    backupAccount,
    restoreAccount,
    resetPin,
    setUser,
    login,
    logout,
    encryptData,
    decryptData
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};