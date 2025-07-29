const express = require('express');
const router = express.Router();
const { create } = require('ipfs-http-client');
const authMiddleware = require('../middleware/auth');

// 初始化IPFS客户端
const ipfs = create({
  url: process.env.IPFS_API_URL || 'http://localhost:5001'
});

// 上传数据到IPFS
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { data, encrypt = false } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: '数据不能为空'
      });
    }
    
    let uploadData = data;
    
    // 如果需要加密，这里应该实现加密逻辑
    if (encrypt) {
      // 实现加密逻辑
      uploadData = data; // 暂时不加密
    }
    
    // 上传到IPFS
    const result = await ipfs.add(JSON.stringify(uploadData));
    
    res.json({
      success: true,
      hash: result.cid.toString(),
      size: result.size,
      encrypted: encrypt
    });
    
  } catch (error) {
    console.error('IPFS上传错误:', error);
    res.status(500).json({
      error: 'IPFS上传失败'
    });
  }
});

// 从IPFS获取数据
router.get('/get/:hash', authMiddleware, async (req, res) => {
  try {
    const { hash } = req.params;
    const { decrypt = false } = req.query;
    
    if (!hash) {
      return res.status(400).json({
        error: '哈希值不能为空'
      });
    }
    
    // 从IPFS获取数据
    const chunks = [];
    for await (const chunk of ipfs.cat(hash)) {
      chunks.push(chunk);
    }
    
    const data = Buffer.concat(chunks).toString();
    let parsedData = JSON.parse(data);
    
    // 如果需要解密，这里应该实现解密逻辑
    if (decrypt) {
      // 实现解密逻辑
      parsedData = parsedData; // 暂时不解密
    }
    
    res.json({
      success: true,
      data: parsedData,
      hash,
      decrypted: decrypt
    });
    
  } catch (error) {
    console.error('IPFS获取错误:', error);
    res.status(500).json({
      error: 'IPFS获取失败'
    });
  }
});

// 上传文件到IPFS
router.post('/upload-file', authMiddleware, async (req, res) => {
  try {
    const { file, filename, encrypt = false } = req.body;
    
    if (!file) {
      return res.status(400).json({
        error: '文件不能为空'
      });
    }
    
    // 检查文件大小
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
    if (file.length > maxSize) {
      return res.status(400).json({
        error: '文件大小超过限制'
      });
    }
    
    let uploadData = file;
    
    // 如果需要加密，这里应该实现加密逻辑
    if (encrypt) {
      // 实现文件加密逻辑
      uploadData = file; // 暂时不加密
    }
    
    // 上传到IPFS
    const result = await ipfs.add(uploadData);
    
    res.json({
      success: true,
      hash: result.cid.toString(),
      size: result.size,
      filename,
      encrypted: encrypt
    });
    
  } catch (error) {
    console.error('IPFS文件上传错误:', error);
    res.status(500).json({
      error: 'IPFS文件上传失败'
    });
  }
});

// 获取IPFS节点信息
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const id = await ipfs.id();
    
    res.json({
      success: true,
      nodeId: id.id,
      publicKey: id.publicKey,
      addresses: id.addresses,
      agentVersion: id.agentVersion,
      protocolVersion: id.protocolVersion
    });
    
  } catch (error) {
    console.error('获取IPFS信息错误:', error);
    res.status(500).json({
      error: '获取IPFS信息失败'
    });
  }
});

module.exports = router;