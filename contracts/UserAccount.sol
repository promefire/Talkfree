// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title UserAccount
 * @dev 管理用户账户、好友关系和群组
 */
contract UserAccount {
    // 用户结构体
    struct User {
        string username;
        string publicKey; // 用于加密通信的公钥
        string status; // 用户状态
        bool exists;
        uint256 createdAt;
    }
    
    // 好友请求状态
    enum FriendRequestStatus { PENDING, ACCEPTED, REJECTED }
    
    // 好友请求结构体
    struct FriendRequest {
        address from;
        address to;
        FriendRequestStatus status;
        uint256 createdAt;
    }
    
    // 群组结构体
    struct Group {
        string name;
        address owner;
        address[] members;
        uint256 createdAt;
        bool exists;
    }
    
    // 映射：地址 => 用户
    mapping(address => User) public users;
    
    // 映射：用户地址 => 好友地址列表
    mapping(address => address[]) public friends;
    
    // 映射：用户A地址 => 用户B地址 => 是否是好友
    mapping(address => mapping(address => bool)) public isFriend;
    
    // 映射：请求ID => 好友请求
    mapping(bytes32 => FriendRequest) public friendRequests;
    
    // 映射：用户地址 => 收到的好友请求ID列表
    mapping(address => bytes32[]) public receivedFriendRequests;
    
    // 映射：用户地址 => 发送的好友请求ID列表
    mapping(address => bytes32[]) public sentFriendRequests;
    
    // 映射：群组ID => 群组
    mapping(bytes32 => Group) public groups;
    
    // 映射：用户地址 => 加入的群组ID列表
    mapping(address => bytes32[]) public userGroups;
    
    // 事件
    event UserCreated(address indexed userAddress, string username);
    event FriendRequestSent(address indexed from, address indexed to, bytes32 requestId);
    event FriendRequestAccepted(address indexed from, address indexed to, bytes32 requestId);
    event FriendRequestRejected(address indexed from, address indexed to, bytes32 requestId);
    event GroupCreated(bytes32 indexed groupId, string name, address indexed owner);
    event UserAddedToGroup(bytes32 indexed groupId, address indexed userAddress);
    event UserRemovedFromGroup(bytes32 indexed groupId, address indexed userAddress);
    
    /**
     * @dev 创建用户账户
     * @param _username 用户名
     * @param _publicKey 用户公钥
     */
    function createUser(string memory _username, string memory _publicKey) public {
        require(!users[msg.sender].exists, "User already exists");
        
        users[msg.sender] = User({
            username: _username,
            publicKey: _publicKey,
            status: "",
            exists: true,
            createdAt: block.timestamp
        });
        
        emit UserCreated(msg.sender, _username);
    }
    
    /**
     * @dev 更新用户信息
     * @param _username 新用户名
     * @param _status 新状态
     */
    function updateUser(string memory _username, string memory _status) public {
        require(users[msg.sender].exists, "User does not exist");
        
        users[msg.sender].username = _username;
        users[msg.sender].status = _status;
    }
    
    /**
     * @dev 发送好友请求
     * @param _to 接收请求的用户地址
     */
    function sendFriendRequest(address _to) public {
        require(users[msg.sender].exists, "Sender does not exist");
        require(users[_to].exists, "Recipient does not exist");
        require(msg.sender != _to, "Cannot send friend request to yourself");
        require(!isFriend[msg.sender][_to], "Already friends");
        
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, _to, block.timestamp));
        
        friendRequests[requestId] = FriendRequest({
            from: msg.sender,
            to: _to,
            status: FriendRequestStatus.PENDING,
            createdAt: block.timestamp
        });
        
        receivedFriendRequests[_to].push(requestId);
        sentFriendRequests[msg.sender].push(requestId);
        
        emit FriendRequestSent(msg.sender, _to, requestId);
    }
    
    /**
     * @dev 接受好友请求
     * @param _requestId 请求ID
     */
    function acceptFriendRequest(bytes32 _requestId) public {
        FriendRequest storage request = friendRequests[_requestId];
        
        require(request.to == msg.sender, "Not the recipient of this request");
        require(request.status == FriendRequestStatus.PENDING, "Request is not pending");
        
        request.status = FriendRequestStatus.ACCEPTED;
        
        // 添加好友关系
        friends[request.from].push(request.to);
        friends[request.to].push(request.from);
        
        isFriend[request.from][request.to] = true;
        isFriend[request.to][request.from] = true;
        
        emit FriendRequestAccepted(request.from, request.to, _requestId);
    }
    
    /**
     * @dev 拒绝好友请求
     * @param _requestId 请求ID
     */
    function rejectFriendRequest(bytes32 _requestId) public {
        FriendRequest storage request = friendRequests[_requestId];
        
        require(request.to == msg.sender, "Not the recipient of this request");
        require(request.status == FriendRequestStatus.PENDING, "Request is not pending");
        
        request.status = FriendRequestStatus.REJECTED;
        
        emit FriendRequestRejected(request.from, request.to, _requestId);
    }
    
    /**
     * @dev 创建群组
     * @param _name 群组名称
     */
    function createGroup(string memory _name) public returns (bytes32) {
        require(users[msg.sender].exists, "User does not exist");
        
        bytes32 groupId = keccak256(abi.encodePacked(msg.sender, _name, block.timestamp));
        
        address[] memory initialMembers = new address[](1);
        initialMembers[0] = msg.sender;
        
        groups[groupId] = Group({
            name: _name,
            owner: msg.sender,
            members: initialMembers,
            createdAt: block.timestamp,
            exists: true
        });
        
        userGroups[msg.sender].push(groupId);
        
        emit GroupCreated(groupId, _name, msg.sender);
        
        return groupId;
    }
    
    /**
     * @dev 添加用户到群组
     * @param _groupId 群组ID
     * @param _userAddress 用户地址
     */
    function addUserToGroup(bytes32 _groupId, address _userAddress) public {
        Group storage group = groups[_groupId];
        
        require(group.exists, "Group does not exist");
        require(group.owner == msg.sender, "Only the owner can add members");
        require(users[_userAddress].exists, "User does not exist");
        
        // 检查用户是否已经在群组中
        bool isAlreadyMember = false;
        for (uint i = 0; i < group.members.length; i++) {
            if (group.members[i] == _userAddress) {
                isAlreadyMember = true;
                break;
            }
        }
        
        require(!isAlreadyMember, "User is already a member");
        
        group.members.push(_userAddress);
        userGroups[_userAddress].push(_groupId);
        
        emit UserAddedToGroup(_groupId, _userAddress);
    }
    
    /**
     * @dev 从群组中移除用户
     * @param _groupId 群组ID
     * @param _userAddress 用户地址
     */
    function removeUserFromGroup(bytes32 _groupId, address _userAddress) public {
        Group storage group = groups[_groupId];
        
        require(group.exists, "Group does not exist");
        require(group.owner == msg.sender, "Only the owner can remove members");
        require(_userAddress != group.owner, "Cannot remove the owner");
        
        // 从群组成员列表中移除用户
        bool found = false;
        uint indexToRemove;
        
        for (uint i = 0; i < group.members.length; i++) {
            if (group.members[i] == _userAddress) {
                indexToRemove = i;
                found = true;
                break;
            }
        }
        
        require(found, "User is not a member");
        
        // 移除成员（通过将最后一个元素移到要删除的位置，然后删除最后一个元素）
        if (indexToRemove < group.members.length - 1) {
            group.members[indexToRemove] = group.members[group.members.length - 1];
        }
        group.members.pop();
        
        // 从用户的群组列表中移除该群组
        bytes32[] storage userGroupsList = userGroups[_userAddress];
        found = false;
        
        for (uint i = 0; i < userGroupsList.length; i++) {
            if (userGroupsList[i] == _groupId) {
                indexToRemove = i;
                found = true;
                break;
            }
        }
        
        if (found) {
            if (indexToRemove < userGroupsList.length - 1) {
                userGroupsList[indexToRemove] = userGroupsList[userGroupsList.length - 1];
            }
            userGroupsList.pop();
        }
        
        emit UserRemovedFromGroup(_groupId, _userAddress);
    }
    
    /**
     * @dev 获取用户的好友列表
     * @param _userAddress 用户地址
     * @return 好友地址数组
     */
    function getFriends(address _userAddress) public view returns (address[] memory) {
        return friends[_userAddress];
    }
    
    /**
     * @dev 获取群组成员
     * @param _groupId 群组ID
     * @return 成员地址数组
     */
    function getGroupMembers(bytes32 _groupId) public view returns (address[] memory) {
        return groups[_groupId].members;
    }
    
    /**
     * @dev 获取用户加入的群组
     * @param _userAddress 用户地址
     * @return 群组ID数组
     */
    function getUserGroups(address _userAddress) public view returns (bytes32[] memory) {
        return userGroups[_userAddress];
    }
    
    /**
     * @dev 获取用户收到的好友请求
     * @param _userAddress 用户地址
     * @return 好友请求ID数组
     */
    function getReceivedFriendRequests(address _userAddress) public view returns (bytes32[] memory) {
        return receivedFriendRequests[_userAddress];
    }
    
    /**
     * @dev 获取用户发送的好友请求
     * @param _userAddress 用户地址
     * @return 好友请求ID数组
     */
    function getSentFriendRequests(address _userAddress) public view returns (bytes32[] memory) {
        return sentFriendRequests[_userAddress];
    }
}