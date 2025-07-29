const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');

// 验证钱包签名
router.post('/verify-signature', async (req, res) => {
  try {
    const { address, signature, message } = req.body;
    
    if (!address || !signature || !message) {
      return res.status(400).json({
        error: '缺少必要参数'
      });
    }
    
    // 验证签名
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        error: '签名验证失败'
      });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { address: address.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      address: address.toLowerCase()
    });
    
  } catch (error) {
    console.error('签名验证错误:', error);
    res.status(500).json({
      error: '服务器错误'
    });
  }
});

// 验证JWT令牌
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: '缺少令牌'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({
      success: true,
      address: decoded.address
    });
    
  } catch (error) {
    console.error('令牌验证错误:', error);
    res.status(401).json({
      error: '令牌无效或已过期'
    });
  }
});

// 生成随机消息用于签名
router.get('/nonce/:address', (req, res) => {
  const { address } = req.params;
  const nonce = Math.floor(Math.random() * 1000000);
  const message = `请签名此消息以验证您的身份: ${nonce}`;
  
  res.json({
    message,
    nonce
  });
});

module.exports = router;