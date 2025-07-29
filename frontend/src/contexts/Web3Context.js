import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import UserAccountABI from '../contracts/abis/UserAccount.json';
import MessageManagerABI from '../contracts/abis/MessageManager.json';
import AccountManagerABI from '../contracts/abis/AccountManager.json';

// 创建上下文
export const Web3Context = createContext();

// 合约地址 - 部署后需要更新这些地址
const USER_ACCOUNT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const MESSAGE_MANAGER_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const ACCOUNT_MANAGER_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [contracts, setContracts] = useState({
    userAccount: null,
    messageManager: null,
    accountManager: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 直接连接到Hardhat本地网络（不需要MetaMask）
  const initDirectWeb3 = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 直接连接到Hardhat本地网络
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      setProvider(provider);

      // 验证网络连接
      try {
        const network = await provider.getNetwork();
        console.log('连接到网络 ID:', network.chainId);
        setNetworkId(network.chainId);
        
        if (network.chainId !== 1337) {
          setError('未连接到正确的Hardhat本地网络 (Chain ID: 1337)');
          setLoading(false);
          return;
        }
      } catch (networkError) {
        console.error('网络连接失败:', networkError);
        setError('无法连接到Hardhat本地网络，请确保本地区块链节点正在运行');
        setLoading(false);
        return;
      }

      // 尝试从本地存储获取用户钱包信息
      let userSigner = null;
      let userAccount = null;
      
      try {
        const userInfo = localStorage.getItem('userAccount');
        if (userInfo) {
          const userData = JSON.parse(userInfo);
          if (userData.mnemonic) {
            // 从助记词恢复钱包
            const wallet = ethers.Wallet.fromMnemonic(userData.mnemonic);
            userSigner = wallet.connect(provider);
            userAccount = wallet.address;
            console.log('从本地存储恢复用户钱包:', userAccount);
          }
        }
      } catch (walletError) {
        console.warn('恢复用户钱包失败:', walletError);
      }

      // 设置账户和签名者
      if (userSigner && userAccount) {
        setSigner(userSigner);
        setAccount(userAccount);
      }

      // 初始化合约（如果有签名者则使用签名者，否则使用provider）
      const contractProvider = userSigner || provider;
      
      const userAccountContract = new ethers.Contract(
        USER_ACCOUNT_ADDRESS,
        UserAccountABI.abi,
        contractProvider
      );

      const messageManagerContract = new ethers.Contract(
        MESSAGE_MANAGER_ADDRESS,
        MessageManagerABI.abi,
        contractProvider
      );

      const accountManagerContract = new ethers.Contract(
        ACCOUNT_MANAGER_ADDRESS,
        AccountManagerABI.abi,
        contractProvider
      );

      setContracts({
        userAccount: userAccountContract,
        messageManager: messageManagerContract,
        accountManager: accountManagerContract
      });

      setConnected(true);
      setLoading(false);
      console.log('成功连接到Hardhat本地网络并初始化合约', userAccount ? `(账户: ${userAccount})` : '(只读模式)');
    } catch (error) {
      console.error('直接Web3初始化错误:', error);
      setError('连接到区块链时出错: ' + error.message);
      setLoading(false);
    }
  }, []);

  // 初始化Web3连接（MetaMask方式）
  const initWeb3 = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 检查是否有MetaMask
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        // 请求账户访问
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        setAccount(account);

        // 获取当前网络
        const network = await provider.getNetwork();
        console.log('当前网络 ID:', network.chainId);
        
        // 检查是否连接到正确的网络 (Hardhat 本地网络 chainId: 1337)
        if (network.chainId !== 1337) {
          console.log('尝试切换到 Hardhat 本地网络...');
          try {
            // 尝试切换到 Hardhat 网络
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x539' }], // 1337 的十六进制
            });
          } catch (switchError) {
            // 如果网络不存在，尝试添加它
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x539', // 1337 的十六进制
                    chainName: 'Hardhat Local',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['http://127.0.0.1:8545'],
                    blockExplorerUrls: null,
                  }],
                });
              } catch (addError) {
                console.error('添加网络失败:', addError);
                setError('请手动添加 Hardhat 本地网络 (Chain ID: 1337, RPC: http://127.0.0.1:8545)');
                setLoading(false);
                return;
              }
            } else {
              console.error('切换网络失败:', switchError);
              setError('请手动切换到 Hardhat 本地网络 (Chain ID: 1337)');
              setLoading(false);
              return;
            }
          }
          
          // 重新获取网络信息
          const updatedNetwork = await provider.getNetwork();
          setNetworkId(updatedNetwork.chainId);
        } else {
          setNetworkId(network.chainId);
        }

        // 获取签名者
        const signer = provider.getSigner();
        setSigner(signer);

        // 初始化合约
        const userAccountContract = new ethers.Contract(
          USER_ACCOUNT_ADDRESS,
          UserAccountABI.abi,
          signer
        );

        const messageManagerContract = new ethers.Contract(
          MESSAGE_MANAGER_ADDRESS,
          MessageManagerABI.abi,
          signer
        );

        const accountManagerContract = new ethers.Contract(
          ACCOUNT_MANAGER_ADDRESS,
          AccountManagerABI.abi,
          signer
        );

        setContracts({
          userAccount: userAccountContract,
          messageManager: messageManagerContract,
          accountManager: accountManagerContract
        });

        setConnected(true);
        setLoading(false);

        // 监听账户变化
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
          window.location.reload();
        });

        // 监听网络变化
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      } else {
        // 如果没有MetaMask，尝试直接连接到本地网络
        console.log('未检测到MetaMask，尝试直接连接到Hardhat本地网络...');
        await initDirectWeb3();
      }
    } catch (error) {
      console.error('Web3初始化错误:', error);
      setError(error.message || '连接到区块链时出错');
      setLoading(false);
    }
  }, [initDirectWeb3]);

  // 重置连接（用于处理熔断器问题）
  const resetConnection = useCallback(async () => {
    try {
      console.log('重置 Web3 连接...');
      
      // 先断开连接
      disconnect();
      
      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新初始化
      await initWeb3();
    } catch (error) {
      console.error('重置连接时出错:', error);
      setError('重置连接失败: ' + error.message);
    }
  }, [initWeb3]);

  // 断开连接
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setNetworkId(null);
    setConnected(false);
    setContracts({
      userAccount: null,
      messageManager: null,
      accountManager: null
    });
  }, []);

  // 检查用户是否已经连接
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            initWeb3();
          } else {
            // 如果有MetaMask但没有连接账户，尝试直接连接到本地网络
            console.log('MetaMask未连接账户，尝试直接连接到本地网络...');
            await initDirectWeb3();
          }
        } catch (error) {
          console.error('检查MetaMask连接时出错:', error);
          // 如果MetaMask检查失败，尝试直接连接到本地网络
          console.log('MetaMask检查失败，尝试直接连接到本地网络...');
          await initDirectWeb3();
        }
      } else {
        // 如果没有MetaMask，直接连接到本地网络
        console.log('未检测到MetaMask，直接连接到本地网络...');
        await initDirectWeb3();
      }
    };

    checkConnection();
  }, [initWeb3, initDirectWeb3]);

  // 上下文值
  const contextValue = {
    provider,
    signer,
    account,
    networkId,
    connected,
    contracts,
    loading,
    error,
    initWeb3,
    initDirectWeb3,
    disconnect,
    resetConnection
  };

  // 将web3Context暴露到window对象，以便在其他地方可以访问
  useEffect(() => {
    window.web3Context = contextValue;
    console.log('Web3Context状态更新:', {
      connected,
      hasContracts: !!contracts.userAccount,
      networkId,
      loading,
      error
    });
    return () => {
      window.web3Context = undefined;
    };
  }, [contextValue]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};