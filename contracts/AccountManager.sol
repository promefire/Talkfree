// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AccountManager
 * @dev 管理用户账户的创建、备份和PIN码保护
 */
contract AccountManager {
    // 账户结构体
    struct Account {
        bytes32 pinHash; // PIN码的哈希值
        string encryptedBackupData; // 加密的备份数据（IPFS哈希）
        string recoveryPhrase; // 加密的恢复短语（IPFS哈希）
        uint256 createdAt;
        uint256 lastUpdated;
        bool exists;
    }
    
    // 映射：用户地址 => 账户
    mapping(address => Account) private accounts;
    
    // 映射：恢复短语哈希 => 用户地址
    mapping(bytes32 => address) private recoveryPhraseToAddress;
    
    // 事件
    event AccountCreated(address indexed userAddress);
    event AccountUpdated(address indexed userAddress);
    event PinUpdated(address indexed userAddress);
    event BackupUpdated(address indexed userAddress);
    event RecoveryPhraseUpdated(address indexed userAddress);
    
    /**
     * @dev 创建账户
     * @param _pinHash PIN码的哈希值
     * @param _recoveryPhrase 加密的恢复短语（IPFS哈希）
     */
    function createAccount(bytes32 _pinHash, string memory _recoveryPhrase) public {
        require(!accounts[msg.sender].exists, "Account already exists");
        
        accounts[msg.sender] = Account({
            pinHash: _pinHash,
            encryptedBackupData: "",
            recoveryPhrase: _recoveryPhrase,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            exists: true
        });
        
        // 存储恢复短语哈希到地址的映射
        bytes32 recoveryPhraseHash = keccak256(abi.encodePacked(_recoveryPhrase));
        recoveryPhraseToAddress[recoveryPhraseHash] = msg.sender;
        
        emit AccountCreated(msg.sender);
    }
    
    /**
     * @dev 更新PIN码
     * @param _currentPinHash 当前PIN码的哈希值
     * @param _newPinHash 新PIN码的哈希值
     */
    function updatePin(bytes32 _currentPinHash, bytes32 _newPinHash) public {
        require(accounts[msg.sender].exists, "Account does not exist");
        require(accounts[msg.sender].pinHash == _currentPinHash, "Invalid current PIN");
        
        accounts[msg.sender].pinHash = _newPinHash;
        accounts[msg.sender].lastUpdated = block.timestamp;
        
        emit PinUpdated(msg.sender);
    }
    
    /**
     * @dev 更新备份数据
     * @param _pinHash PIN码的哈希值
     * @param _encryptedBackupData 新的加密备份数据（IPFS哈希）
     */
    function updateBackup(bytes32 _pinHash, string memory _encryptedBackupData) public {
        require(accounts[msg.sender].exists, "Account does not exist");
        require(accounts[msg.sender].pinHash == _pinHash, "Invalid PIN");
        
        accounts[msg.sender].encryptedBackupData = _encryptedBackupData;
        accounts[msg.sender].lastUpdated = block.timestamp;
        
        emit BackupUpdated(msg.sender);
    }
    
    /**
     * @dev 更新恢复短语
     * @param _pinHash PIN码的哈希值
     * @param _newRecoveryPhrase 新的加密恢复短语（IPFS哈希）
     */
    function updateRecoveryPhrase(bytes32 _pinHash, string memory _newRecoveryPhrase) public {
        require(accounts[msg.sender].exists, "Account does not exist");
        require(accounts[msg.sender].pinHash == _pinHash, "Invalid PIN");
        
        // 移除旧的恢复短语哈希映射
        bytes32 oldRecoveryPhraseHash = keccak256(abi.encodePacked(accounts[msg.sender].recoveryPhrase));
        delete recoveryPhraseToAddress[oldRecoveryPhraseHash];
        
        // 更新恢复短语
        accounts[msg.sender].recoveryPhrase = _newRecoveryPhrase;
        accounts[msg.sender].lastUpdated = block.timestamp;
        
        // 添加新的恢复短语哈希映射
        bytes32 newRecoveryPhraseHash = keccak256(abi.encodePacked(_newRecoveryPhrase));
        recoveryPhraseToAddress[newRecoveryPhraseHash] = msg.sender;
        
        emit RecoveryPhraseUpdated(msg.sender);
    }
    
    /**
     * @dev 通过恢复短语找回账户
     * @param _recoveryPhrase 恢复短语
     * @return 账户地址
     */
    function recoverAccountAddress(string memory _recoveryPhrase) public view returns (address) {
        bytes32 recoveryPhraseHash = keccak256(abi.encodePacked(_recoveryPhrase));
        address accountAddress = recoveryPhraseToAddress[recoveryPhraseHash];
        
        require(accountAddress != address(0), "No account found for this recovery phrase");
        
        return accountAddress;
    }
    
    /**
     * @dev 重置PIN码（通过恢复短语）
     * @param _recoveryPhrase 恢复短语
     * @param _newPinHash 新PIN码的哈希值
     */
    function resetPin(string memory _recoveryPhrase, bytes32 _newPinHash) public {
        bytes32 recoveryPhraseHash = keccak256(abi.encodePacked(_recoveryPhrase));
        address accountAddress = recoveryPhraseToAddress[recoveryPhraseHash];
        
        require(accountAddress == msg.sender, "Invalid recovery phrase or not your account");
        
        accounts[msg.sender].pinHash = _newPinHash;
        accounts[msg.sender].lastUpdated = block.timestamp;
        
        emit PinUpdated(msg.sender);
    }
    
    /**
     * @dev 验证PIN码
     * @param _pinHash PIN码的哈希值
     * @return 是否有效
     */
    function verifyPin(bytes32 _pinHash) public view returns (bool) {
        require(accounts[msg.sender].exists, "Account does not exist");
        return accounts[msg.sender].pinHash == _pinHash;
    }
    
    /**
     * @dev 获取账户备份数据
     * @param _pinHash PIN码的哈希值
     * @return 加密的备份数据（IPFS哈希）
     */
    function getBackupData(bytes32 _pinHash) public view returns (string memory) {
        require(accounts[msg.sender].exists, "Account does not exist");
        require(accounts[msg.sender].pinHash == _pinHash, "Invalid PIN");
        
        return accounts[msg.sender].encryptedBackupData;
    }
    
    /**
     * @dev 检查账户是否存在
     * @param _userAddress 用户地址
     * @return 是否存在
     */
    function accountExists(address _userAddress) public view returns (bool) {
        return accounts[_userAddress].exists;
    }
    
    /**
     * @dev 获取账户创建时间
     * @return 创建时间戳
     */
    function getAccountCreationTime() public view returns (uint256) {
        require(accounts[msg.sender].exists, "Account does not exist");
        return accounts[msg.sender].createdAt;
    }
    
    /**
     * @dev 获取账户最后更新时间
     * @return 最后更新时间戳
     */
    function getAccountLastUpdateTime() public view returns (uint256) {
        require(accounts[msg.sender].exists, "Account does not exist");
        return accounts[msg.sender].lastUpdated;
    }
}