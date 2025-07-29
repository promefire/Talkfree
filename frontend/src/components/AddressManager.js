import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Paper
} from '@mui/material';
import {
  AccountBalanceWallet,
  Refresh,
  ContentCopy
} from '@mui/icons-material';
import { ethers } from 'ethers';

const AddressManager = () => {
  const { provider } = useContext(Web3Context);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState({
    preset: [],
    users: [],
    contracts: []
  });
  const [error, setError] = useState('');

  // 获取所有地址信息
  const fetchAllAddresses = async () => {
    if (!provider) {
      setError('未连接到区块链网络');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 获取当前区块号
      const currentBlock = await provider.getBlockNumber();
      
      // 获取预设账户
      const presetAccounts = [];
      try {
        const accounts = await provider.listAccounts();
        for (const address of accounts) {
          const balance = await provider.getBalance(address);
          const txCount = await provider.getTransactionCount(address);
          presetAccounts.push({
            address,
            balance: ethers.utils.formatEther(balance),
            txCount,
            type: 'preset'
          });
        }
      } catch (err) {
        console.log('获取预设账户失败:', err);
      }

      // 扫描所有区块，找出所有活跃地址
      const allAddresses = new Set();
      
      // 添加预设账户到集合
      presetAccounts.forEach(account => 
        allAddresses.add(account.address.toLowerCase())
      );

      // 扫描区块交易
      for (let blockNumber = 0; blockNumber <= currentBlock; blockNumber++) {
        try {
          const block = await provider.getBlockWithTransactions(blockNumber);
          block.transactions.forEach(tx => {
            if (tx.from) allAddresses.add(tx.from.toLowerCase());
            if (tx.to) allAddresses.add(tx.to.toLowerCase());
          });
        } catch (error) {
          // 忽略单个区块的错误
        }
      }

      // 分类地址
      const userAddresses = [];
      const contractAddresses = [];

      for (const address of allAddresses) {
        const isPresetAccount = presetAccounts.some(account => 
          account.address.toLowerCase() === address.toLowerCase()
        );

        if (!isPresetAccount) {
          try {
            const code = await provider.getCode(address);
            const balance = await provider.getBalance(address);
            const txCount = await provider.getTransactionCount(address);
            const isContract = code !== '0x';

            const addressInfo = {
              address,
              balance: ethers.utils.formatEther(balance),
              txCount,
              type: isContract ? 'contract' : 'user'
            };

            if (isContract) {
              contractAddresses.push(addressInfo);
            } else {
              userAddresses.push(addressInfo);
            }
          } catch (error) {
            console.log(`获取地址 ${address} 信息失败:`, error);
          }
        }
      }

      setAddresses({
        preset: presetAccounts,
        users: userAddresses,
        contracts: contractAddresses
      });

    } catch (error) {
      console.error('获取地址信息失败:', error);
      setError('获取地址信息失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 复制地址到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // 可以添加一个提示
    });
  };

  // 组件挂载时获取地址信息
  useEffect(() => {
    fetchAllAddresses();
  }, [provider]); // eslint-disable-line react-hooks/exhaustive-deps

  // 渲染地址列表
  const renderAddressList = (addressList, title, color) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} ({addressList.length})
        </Typography>
        <List>
          {addressList.map((item, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" component="span">
                      {item.address}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(item.address)}
                      startIcon={<ContentCopy />}
                    >
                      复制
                    </Button>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      余额: {parseFloat(item.balance).toFixed(4)} ETH
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      交易数: {item.txCount}
                    </Typography>
                  </Box>
                }
              />
              <Chip 
                label={item.type} 
                color={color} 
                size="small" 
              />
            </ListItem>
          ))}
        </List>
        {addressList.length === 0 && (
          <Typography color="text.secondary" align="center">
            暂无{title.toLowerCase()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          地址管理器
        </Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={fetchAllAddresses}
          disabled={loading}
        >
          刷新
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>说明：</strong>
          Hardhat 预设账户是测试网络启动时自动生成的固定账户。
          新注册用户地址是通过应用程序创建的真实区块链地址，
          它们不会出现在预设账户列表中，但完全可以正常使用。
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          {renderAddressList(addresses.preset, 'Hardhat 预设账户', 'primary')}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderAddressList(addresses.users, '新注册用户地址', 'success')}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderAddressList(addresses.contracts, '智能合约地址', 'secondary')}
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          统计信息
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography align="center">
              <strong>{addresses.preset.length}</strong><br />
              预设账户
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography align="center">
              <strong>{addresses.users.length}</strong><br />
              用户地址
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography align="center">
              <strong>{addresses.contracts.length}</strong><br />
              合约地址
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AddressManager;