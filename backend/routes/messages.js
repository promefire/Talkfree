const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// 获取个人消息
router.get('/personal/:address', authMiddleware, async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // 这里应该从区块链或IPFS获取消息
    // 示例响应
    res.json({
      messages: [
        {
          id: 1,
          from: '0x1234567890123456789012345678901234567890',
          to: address,
          content: 'Hello!',
          timestamp: Date.now(),
          encrypted: false
        }
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        pages: 1
      }
    });
    
  } catch (error) {
    console.error('获取个人消息错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

// 获取群组消息
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // 这里应该从区块链或IPFS获取群组消息
    // 示例响应
    res.json({
      messages: [
        {
          id: 1,
          groupId: parseInt(groupId),
          from: '0x1234567890123456789012345678901234567890',
          content: 'Hello group!',
          timestamp: Date.now(),
          encrypted: false
        }
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        pages: 1
      }
    });
    
  } catch (error) {
    console.error('获取群组消息错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

// 发送个人消息
router.post('/personal', authMiddleware, async (req, res) => {
  try {
    const { to, content, encrypted = false } = req.body;
    
    if (!to || !content) {
      return res.status(400).json({
        error: '缺少必要参数'
      });
    }
    
    // 这里应该调用智能合约发送消息
    // 示例响应
    res.json({
      success: true,
      messageId: Date.now(),
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('发送个人消息错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

// 发送群组消息
router.post('/group', authMiddleware, async (req, res) => {
  try {
    const { groupId, content, encrypted = false } = req.body;
    
    if (!groupId || !content) {
      return res.status(400).json({
        error: '缺少必要参数'
      });
    }
    
    // 这里应该调用智能合约发送群组消息
    // 示例响应
    res.json({
      success: true,
      messageId: Date.now(),
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('发送群组消息错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

module.exports = router;