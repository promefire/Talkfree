// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserAccount.sol";

/**
 * @title MessageManager
 * @dev 管理用户之间的消息传递
 */
contract MessageManager {
    // 消息类型
    enum MessageType { TEXT, IMAGE, FILE, VOICE }
    
    // 消息结构体
    struct Message {
        address sender;
        address receiver; // 个人消息的接收者，群组消息为0地址
        bytes32 groupId; // 群组消息的群组ID，个人消息为0
        MessageType messageType;
        string contentHash; // IPFS内容哈希
        uint256 timestamp;
        bool isEncrypted;
    }
    
    // 用户账户合约引用
    UserAccount public userAccountContract;
    
    // 映射：消息ID => 消息
    mapping(bytes32 => Message) public messages;
    
    // 映射：用户地址 => 发送的消息ID列表
    mapping(address => bytes32[]) public sentMessages;
    
    // 映射：用户地址 => 接收的消息ID列表
    mapping(address => bytes32[]) public receivedMessages;
    
    // 映射：群组ID => 消息ID列表
    mapping(bytes32 => bytes32[]) public groupMessages;
    
    // 事件
    event MessageSent(bytes32 indexed messageId, address indexed sender, address indexed receiver, MessageType messageType);
    event GroupMessageSent(bytes32 indexed messageId, address indexed sender, bytes32 indexed groupId, MessageType messageType);
    
    /**
     * @dev 构造函数
     * @param _userAccountAddress 用户账户合约地址
     */
    constructor(address _userAccountAddress) {
        userAccountContract = UserAccount(_userAccountAddress);
    }
    
    /**
     * @dev 发送个人消息
     * @param _receiver 接收者地址
     * @param _messageType 消息类型
     * @param _contentHash 内容哈希（IPFS）
     * @param _isEncrypted 是否加密
     */
    function sendMessage(
        address _receiver,
        MessageType _messageType,
        string memory _contentHash,
        bool _isEncrypted
    ) public returns (bytes32) {
        // 验证发送者和接收者都是有效用户
        (,,, bool senderExists,) = userAccountContract.users(msg.sender);
        (,,, bool receiverExists,) = userAccountContract.users(_receiver);
        require(senderExists, "Sender does not exist");
        require(receiverExists, "Receiver does not exist");
        
        // 验证发送者和接收者是好友关系
        require(userAccountContract.isFriend(msg.sender, _receiver), "Not friends with receiver");
        
        bytes32 messageId = keccak256(abi.encodePacked(msg.sender, _receiver, block.timestamp, _contentHash));
        
        messages[messageId] = Message({
            sender: msg.sender,
            receiver: _receiver,
            groupId: bytes32(0),
            messageType: _messageType,
            contentHash: _contentHash,
            timestamp: block.timestamp,
            isEncrypted: _isEncrypted
        });
        
        sentMessages[msg.sender].push(messageId);
        receivedMessages[_receiver].push(messageId);
        
        emit MessageSent(messageId, msg.sender, _receiver, _messageType);
        
        return messageId;
    }
    
    /**
     * @dev 发送群组消息
     * @param _groupId 群组ID
     * @param _messageType 消息类型
     * @param _contentHash 内容哈希（IPFS）
     * @param _isEncrypted 是否加密
     */
    function sendGroupMessage(
        bytes32 _groupId,
        MessageType _messageType,
        string memory _contentHash,
        bool _isEncrypted
    ) public returns (bytes32) {
        // 验证发送者是有效用户
        (,,, bool senderExists,) = userAccountContract.users(msg.sender);
        require(senderExists, "Sender does not exist");
        
        // 验证群组存在
        (,,, bool groupExists) = userAccountContract.groups(_groupId);
        require(groupExists, "Group does not exist");
        
        // 验证发送者是群组成员
        address[] memory groupMembers = userAccountContract.getGroupMembers(_groupId);
        bool isMember = false;
        
        for (uint i = 0; i < groupMembers.length; i++) {
            if (groupMembers[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        
        require(isMember, "Not a member of the group");
        
        bytes32 messageId = keccak256(abi.encodePacked(msg.sender, _groupId, block.timestamp, _contentHash));
        
        messages[messageId] = Message({
            sender: msg.sender,
            receiver: address(0),
            groupId: _groupId,
            messageType: _messageType,
            contentHash: _contentHash,
            timestamp: block.timestamp,
            isEncrypted: _isEncrypted
        });
        
        sentMessages[msg.sender].push(messageId);
        groupMessages[_groupId].push(messageId);
        
        // 将消息添加到每个群组成员的接收消息列表中
        for (uint i = 0; i < groupMembers.length; i++) {
            if (groupMembers[i] != msg.sender) { // 排除发送者自己
                receivedMessages[groupMembers[i]].push(messageId);
            }
        }
        
        emit GroupMessageSent(messageId, msg.sender, _groupId, _messageType);
        
        return messageId;
    }
    
    /**
     * @dev 获取用户发送的消息
     * @param _userAddress 用户地址
     * @return 消息ID数组
     */
    function getSentMessages(address _userAddress) public view returns (bytes32[] memory) {
        return sentMessages[_userAddress];
    }
    
    /**
     * @dev 获取用户接收的消息
     * @param _userAddress 用户地址
     * @return 消息ID数组
     */
    function getReceivedMessages(address _userAddress) public view returns (bytes32[] memory) {
        return receivedMessages[_userAddress];
    }
    
    /**
     * @dev 获取群组消息
     * @param _groupId 群组ID
     * @return 消息ID数组
     */
    function getGroupMessages(bytes32 _groupId) public view returns (bytes32[] memory) {
        return groupMessages[_groupId];
    }
    
    /**
     * @dev 获取消息详情
     * @param _messageId 消息ID
     * @return sender 发送者地址
     * @return receiver 接收者地址
     * @return groupId 群组ID
     * @return messageType 消息类型
     * @return contentHash 内容哈希
     * @return timestamp 时间戳
     * @return isEncrypted 是否加密
     */
    function getMessage(bytes32 _messageId) public view returns (
        address sender,
        address receiver,
        bytes32 groupId,
        MessageType messageType,
        string memory contentHash,
        uint256 timestamp,
        bool isEncrypted
    ) {
        Message memory message = messages[_messageId];
        
        return (
            message.sender,
            message.receiver,
            message.groupId,
            message.messageType,
            message.contentHash,
            message.timestamp,
            message.isEncrypted
        );
    }
}