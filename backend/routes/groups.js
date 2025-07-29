const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// 创建群组
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: '群组名称不能为空'
      });
    }
    
    // 这里应该调用智能合约创建群组
    // 示例响应
    res.json({
      success: true,
      groupId: Date.now(),
      name,
      description,
      members: [req.user.address, ...members],
      createdAt: Date.now()
    });
    
  } catch (error) {
    console.error('创建群组错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

// 获取群组信息
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // 这里应该从区块链获取群组信息
    // 示例响应
    res.json({
      id: parseInt(groupId),
      name: 'Test Group',
      description: 'This is a test group',
      members: [
        {
          address: '0x1234567890123456789012345678901234567890',
          username: 'Member 1',
          role: 'admin'
        }
      ],
      createdAt: Date.now()
    });
    
  } catch (error) {
    console.error('获取群组信息错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

// 添加群组成员
router.post('/:groupId/members', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberAddress } = req.body;
    
    if (!memberAddress) {
      return res.status(400).json({
        error: '成员地址不能为空'
      });
    }
    
    // 这里应该调用智能合约添加成员
    // 示例响应
    res.json({
      success: true,
      groupId: parseInt(groupId),
      memberAddress,
      addedAt: Date.now()
    });
    
  } catch (error) {
    console.error('添加群组成员错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

// 移除群组成员
router.delete('/:groupId/members/:memberAddress', authMiddleware, async (req, res) => {
  try {
    const { groupId, memberAddress } = req.params;
    
    // 这里应该调用智能合约移除成员
    // 示例响应
    res.json({
      success: true,
      groupId: parseInt(groupId),
      memberAddress,
      removedAt: Date.now()
    });
    
  } catch (error) {
    console.error('移除群组成员错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

// 获取群组成员列表
router.get('/:groupId/members', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // 这里应该从区块链获取成员列表
    // 示例响应
    res.json([
      {
        address: '0x1234567890123456789012345678901234567890',
        username: 'Member 1',
        role: 'admin',
        joinedAt: Date.now()
      }
    ]);
    
  } catch (error) {
    console.error('获取群组成员错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

module.exports = router;