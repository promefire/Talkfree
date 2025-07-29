import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from './Web3Context';
import { AuthContext } from './AuthContext';
import { create } from 'ipfs-http-client';

// 创建上下文
export const ChatContext = createContext();

// IPFS客户端配置 - 使用本地节点
const ipfs = create({
  url: 'http://localhost:5001'
});

export const ChatProvider = ({ children }) => {
  const { account, contracts, connected } = useContext(Web3Context);
  const { currentUser, isAuthenticated, pinVerified } = useContext(AuthContext);
  
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [messages, setMessages] = useState({});
  const [groupMessages, setGroupMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载好友列表
  const loadFriends = useCallback(async () => {
    if (!connected || !account || !contracts.userAccount || !isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const friendAddresses = await contracts.userAccount.getFriends(account);
      
      const friendsData = await Promise.all(
        friendAddresses.map(async (address) => {
          const user = await contracts.userAccount.users(address);
          return {
            address,
            username: user.username,
            publicKey: user.publicKey,
            createdAt: new Date(Number(user.createdAt) * 1000)
          };
        })
      );
      
      setFriends(friendsData);
    } catch (error) {
      console.error('加载好友列表时出错:', error);
      setError('加载好友列表时出错');
    } finally {
      setLoading(false);
    }
  }, [connected, account, contracts.userAccount, isAuthenticated]);

  // 加载群组列表
  const loadGroups = useCallback(async () => {
    if (!connected || !account || !contracts.userAccount || !isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const groupIds = await contracts.userAccount.getUserGroups(account);
      
      const groupsData = await Promise.all(
        groupIds.map(async (groupId) => {
          const group = await contracts.userAccount.groups(groupId);
          return {
            id: groupId,
            name: group.name,
            owner: group.owner,
            createdAt: new Date(Number(group.createdAt) * 1000),
            memberCount: (await contracts.userAccount.getGroupMembers(groupId)).length
          };
        })
      );
      
      setGroups(groupsData);
    } catch (error) {
      console.error('加载群组列表时出错:', error);
      setError('加载群组列表时出错');
    } finally {
      setLoading(false);
    }
  }, [connected, account, contracts.userAccount, isAuthenticated]);

  // 加载好友请求
  const loadFriendRequests = useCallback(async () => {
    if (!connected || !account || !contracts.userAccount || !isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const requestIds = await contracts.userAccount.getReceivedFriendRequests(account);
      
      const requestsData = await Promise.all(
        requestIds.map(async (requestId) => {
          const request = await contracts.userAccount.friendRequests(requestId);
          
          // 只获取待处理的请求
          // 使用 Number() 或 parseInt() 来转换 BigNumber
          const statusValue = Number(request.status);
          if (statusValue === 0) { // PENDING
            const user = await contracts.userAccount.users(request.from);
            return {
              id: requestId,
              from: request.from,
              username: user.username,
              createdAt: new Date(Number(request.createdAt) * 1000)
            };
          }
          return null;
        })
      );
      
      // 过滤掉null值
      setFriendRequests(requestsData.filter(request => request !== null));
    } catch (error) {
      console.error('加载好友请求时出错:', error);
      setError('加载好友请求时出错');
    } finally {
      setLoading(false);
    }
  }, [connected, account, contracts.userAccount, isAuthenticated]);

  // 加载与特定好友的消息
  const loadMessages = useCallback(async (friendAddress) => {
    if (!connected || !account || !contracts.messageManager || !isAuthenticated) {
      return [];
    }

    try {
      // 获取发送的消息
      const sentMessageIds = await contracts.messageManager.getSentMessages(account);
      
      // 获取接收的消息
      const receivedMessageIds = await contracts.messageManager.getReceivedMessages(account);
      
      // 合并消息ID
      const allMessageIds = [...sentMessageIds, ...receivedMessageIds];
      
      // 获取消息详情并过滤出与特定好友的消息
      const messagesData = await Promise.all(
        allMessageIds.map(async (messageId) => {
          const message = await contracts.messageManager.getMessage(messageId);
          
          // 检查是否是与特定好友的消息
          if (
            (message.sender === account && message.receiver === friendAddress) ||
            (message.sender === friendAddress && message.receiver === account)
          ) {
            // 如果消息是加密的，需要解密
            let content = message.contentHash;
            if (message.isEncrypted) {
              try {
                // 从IPFS获取加密内容
                const encryptedContent = await ipfs.cat(content);
                // 这里应该有解密逻辑，但为简化示例，我们假设内容已解密
                content = encryptedContent.toString();
              } catch (error) {
                console.error('解密消息时出错:', error);
                content = '无法解密的消息';
              }
            }
            
            return {
              id: messageId,
              sender: message.sender,
              receiver: message.receiver,
              content,
              type: Number(message.messageType),
              timestamp: new Date(Number(message.timestamp) * 1000),
              isEncrypted: message.isEncrypted
            };
          }
          return null;
        })
      );
      
      // 过滤掉null值并按时间排序
      const filteredMessages = messagesData
        .filter(message => message !== null)
        .sort((a, b) => a.timestamp - b.timestamp);
      
      // 更新消息状态
      setMessages(prev => ({
        ...prev,
        [friendAddress]: filteredMessages
      }));
      
      return filteredMessages;
    } catch (error) {
      console.error('加载消息时出错:', error);
      setError('加载消息时出错');
      return [];
    }
  }, [connected, account, contracts.messageManager, isAuthenticated]);

  // 加载群组消息
  const loadGroupMessages = useCallback(async (groupId) => {
    if (!connected || !account || !contracts.messageManager || !isAuthenticated) {
      return [];
    }

    try {
      // 获取群组消息
      const groupMessageIds = await contracts.messageManager.getGroupMessages(groupId);
      
      // 获取消息详情
      const messagesData = await Promise.all(
        groupMessageIds.map(async (messageId) => {
          const message = await contracts.messageManager.getMessage(messageId);
          
          // 如果消息是加密的，需要解密
          let content = message.contentHash;
          if (message.isEncrypted) {
            try {
              // 从IPFS获取加密内容
              const encryptedContent = await ipfs.cat(content);
              // 这里应该有解密逻辑，但为简化示例，我们假设内容已解密
              content = encryptedContent.toString();
            } catch (error) {
              console.error('解密消息时出错:', error);
              content = '无法解密的消息';
            }
          }
          
          return {
            id: messageId,
            sender: message.sender,
            groupId: message.groupId,
            content,
            type: Number(message.messageType),
            timestamp: new Date(Number(message.timestamp) * 1000),
            isEncrypted: message.isEncrypted
          };
        })
      );
      
      // 按时间排序
      const sortedMessages = messagesData.sort((a, b) => a.timestamp - b.timestamp);
      
      // 更新群组消息状态
      setGroupMessages(prev => ({
        ...prev,
        [groupId]: sortedMessages
      }));
      
      return sortedMessages;
    } catch (error) {
      console.error('加载群组消息时出错:', error);
      setError('加载群组消息时出错');
      return [];
    }
  }, [connected, account, contracts.messageManager, isAuthenticated]);

  // 发送好友请求
  const sendFriendRequest = async (receiverAddress) => {
    try {
      console.log('sendFriendRequest调用，接收者地址:', receiverAddress);
      
      // 检查认证状态
      if (!isAuthenticated) {
        throw new Error('用户未认证，请先登录');
      }

      // 检查基本连接状态
      if (!connected || !contracts.userAccount) {
        throw new Error('未连接到区块链');
      }

      // 验证接收者地址
      if (!ethers.utils.isAddress(receiverAddress)) {
        throw new Error('无效的接收者地址');
      }

      // 检查是否尝试添加自己
      if (account && account.toLowerCase() === receiverAddress.toLowerCase()) {
        throw new Error('不能添加自己为好友');
      }

      // 发送好友请求
      console.log('发送好友请求到:', receiverAddress);
      const tx = await contracts.userAccount.sendFriendRequest(receiverAddress);
      console.log('交易已发送:', tx.hash);
      
      await tx.wait();
      console.log('好友请求发送成功');
      
      // 刷新好友请求列表
      await loadFriendRequests();
      
      return { success: true, message: '好友请求已发送' };
    } catch (error) {
      console.error('发送好友请求失败:', error);
      throw error;
    }
  };

  // 接受好友请求
  const acceptFriendRequest = async (requestId) => {
    if (!connected || !account || !contracts.userAccount || !isAuthenticated) {
      throw new Error('未连接或未认证');
    }

    try {
      const tx = await contracts.userAccount.acceptFriendRequest(requestId);
      await tx.wait();
      
      // 重新加载好友列表和请求
      await loadFriends();
      await loadFriendRequests();
      
      return true;
    } catch (error) {
      console.error('接受好友请求时出错:', error);
      throw error;
    }
  };

  // 拒绝好友请求
  const rejectFriendRequest = async (requestId) => {
    if (!connected || !account || !contracts.userAccount || !isAuthenticated) {
      throw new Error('未连接或未认证');
    }

    try {
      const tx = await contracts.userAccount.rejectFriendRequest(requestId);
      await tx.wait();
      
      // 重新加载请求
      await loadFriendRequests();
      
      return true;
    } catch (error) {
      console.error('拒绝好友请求时出错:', error);
      throw error;
    }
  };

  // 创建群组
  const createGroup = async (name) => {
    if (!connected || !account || !contracts.userAccount || !isAuthenticated) {
      throw new Error('未连接或未认证');
    }

    try {
      const tx = await contracts.userAccount.createGroup(name);
      const receipt = await tx.wait();
      
      // 从事件中获取群组ID
      const event = receipt.events.find(e => e.event === 'GroupCreated');
      const groupId = event.args.groupId;
      
      // 重新加载群组列表
      await loadGroups();
      
      return groupId;
    } catch (error) {
      console.error('创建群组时出错:', error);
      throw error;
    }
  };

  // 添加用户到群组
  const addUserToGroup = async (groupId, userAddress) => {
    if (!connected || !account || !contracts.userAccount || !isAuthenticated) {
      throw new Error('未连接或未认证');
    }

    try {
      const tx = await contracts.userAccount.addUserToGroup(groupId, userAddress);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('添加用户到群组时出错:', error);
      throw error;
    }
  };

  // 从群组中移除用户
  const removeUserFromGroup = async (groupId, userAddress) => {
    if (!connected || !account || !contracts.userAccount || !isAuthenticated) {
      throw new Error('未连接或未认证');
    }

    try {
      const tx = await contracts.userAccount.removeUserFromGroup(groupId, userAddress);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('从群组中移除用户时出错:', error);
      throw error;
    }
  };

  // 发送消息
  const sendMessage = async (receiverAddress, content, messageType = 0, isEncrypted = true) => {
    if (!connected || !account || !contracts.messageManager || !isAuthenticated) {
      throw new Error('未连接或未认证');
    }

    try {
      // 如果消息需要加密
      let contentHash = content;
      if (isEncrypted) {
        // 获取接收者的公钥
        const receiver = await contracts.userAccount.users(receiverAddress);
        const receiverPublicKey = receiver.publicKey;
        
        // 加密消息内容
        const encryptedContent = {
          content,
          timestamp: Date.now(),
          sender: account
        };
        
        // 上传到IPFS
        const { path } = await ipfs.add(JSON.stringify(encryptedContent));
        contentHash = path;
      }
      
      // 发送消息
      const tx = await contracts.messageManager.sendMessage(
        receiverAddress,
        messageType,
        contentHash,
        isEncrypted
      );
      
      const receipt = await tx.wait();
      
      // 从事件中获取消息ID
      const event = receipt.events.find(e => e.event === 'MessageSent');
      const messageId = event.args.messageId;
      
      // 重新加载消息
      await loadMessages(receiverAddress);
      
      return messageId;
    } catch (error) {
      console.error('发送消息时出错:', error);
      throw error;
    }
  };

  // 发送群组消息
  const sendGroupMessage = async (groupId, content, messageType = 0, isEncrypted = true) => {
    if (!connected || !account || !contracts.messageManager || !isAuthenticated) {
      throw new Error('未连接或未认证');
    }

    try {
      // 如果消息需要加密
      let contentHash = content;
      if (isEncrypted) {
        // 加密消息内容
        const encryptedContent = {
          content,
          timestamp: Date.now(),
          sender: account
        };
        
        // 上传到IPFS
        const { path } = await ipfs.add(JSON.stringify(encryptedContent));
        contentHash = path;
      }
      
      // 发送群组消息
      const tx = await contracts.messageManager.sendGroupMessage(
        groupId,
        messageType,
        contentHash,
        isEncrypted
      );
      
      const receipt = await tx.wait();
      
      // 从事件中获取消息ID
      const event = receipt.events.find(e => e.event === 'GroupMessageSent');
      const messageId = event.args.messageId;
      
      // 重新加载群组消息
      await loadGroupMessages(groupId);
      
      return messageId;
    } catch (error) {
      console.error('发送群组消息时出错:', error);
      throw error;
    }
  };

  // 加载个人消息（别名）
  const loadPersonalMessages = loadMessages;

  // 搜索用户
  const searchUsers = async (searchTerm) => {
    try {
      console.log('searchUsers调用，搜索词:', searchTerm);
      
      // 检查连接状态
      if (!connected || !contracts.userAccount) {
        throw new Error('未连接到区块链');
      }

      const results = [];
      
      // 检查搜索词是否是有效的以太坊地址
      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(searchTerm);
      
      if (isAddress) {
        console.log('按地址搜索用户:', searchTerm);
        try {
          // 直接通过地址查询用户信息
          const user = await contracts.userAccount.users(searchTerm);
          console.log('查询到的用户信息:', user);
          
          if (user.exists) {
            results.push({
              address: searchTerm,
              username: user.username,
              publicKey: user.publicKey,
              status: user.status,
              createdAt: user.createdAt.toString()
            });
            console.log('找到用户:', results[0]);
          } else {
            console.log('地址对应的用户不存在:', searchTerm);
          }
        } catch (error) {
          console.error('查询用户信息时出错:', error);
          // 如果查询失败，可能是地址不存在或网络问题
        }
      } else {
        console.log('搜索词不是有效的以太坊地址，暂不支持按用户名搜索');
        // 由于智能合约没有提供按用户名搜索的功能，这里暂时不支持
        // 实际应用中可能需要一个索引服务或后端API来支持按用户名搜索
      }
      
      console.log('搜索结果:', results);
      return results;
    } catch (error) {
      console.error('搜索用户时出错:', error);
      throw error;
    }
  };

  // 当认证状态改变时加载数据
  useEffect(() => {
    if (isAuthenticated && connected) {
      loadFriends();
      loadGroups();
      loadFriendRequests();
    }
  }, [isAuthenticated, connected, loadFriends, loadGroups, loadFriendRequests]);

  // 上下文值
  const contextValue = {
    friends,
    groups,
    friendRequests,
    messages,
    groupMessages,
    loading,
    error,
    loadFriends,
    loadGroups,
    loadFriendRequests,
    loadMessages,
    loadPersonalMessages,
    loadGroupMessages,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    createGroup,
    addUserToGroup,
    removeUserFromGroup,
    sendMessage,
    sendGroupMessage,
    searchUsers
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};