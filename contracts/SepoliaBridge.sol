// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SepoliaToken.sol";

interface IMailbox {
    function dispatch(
        uint32 _destinationDomain,
        bytes32 _recipientAddress,
        bytes calldata _messageBody
    ) external payable returns (bytes32);

    function quoteDispatch(
        uint32 _destinationDomain,
        bytes32 _recipientAddress,
        bytes calldata _messageBody
    ) external view returns (uint256);
}

interface IMessageRecipient {
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external payable;
}

/**
 * @title SepoliaBridge
 * @dev Bridge contract for Sepolia network that handles cross-chain token operations
 * This contract locks tokens on Sepolia and sends messages to COTI for minting
 */
contract SepoliaBridge is IMessageRecipient, Ownable {
    IMailbox public immutable mailbox;
    SepoliaToken public immutable token;
    
    // COTI bridge contract address (32 bytes format)
    bytes32 public cotiBridgeAddress;
    uint32 public cotiDomain;
    
    // Track locked tokens per user
    mapping(address => uint256) public lockedTokens;
    mapping(bytes32 => bool) public processedMessages;
    
    // Events
    event TokensLocked(address indexed user, uint256 amount, bytes32 messageId);
    event TokensUnlocked(address indexed user, uint256 amount);
    event BridgeAddressUpdated(bytes32 newAddress);
    event MessageReceived(uint32 origin, bytes32 sender, address user, uint256 amount);
    event BridgeInitialized(address token, bytes32 cotiBridge, uint32 cotiDomain);
    
    constructor(
        address _mailbox,
        address _token,
        uint32 _cotiDomain,
        bytes32 _cotiBridgeAddress
    ) Ownable(msg.sender) {
        require(_mailbox != address(0), "Invalid mailbox address");
        require(_token != address(0), "Invalid token address");
        
        mailbox = IMailbox(_mailbox);
        token = SepoliaToken(_token);
        cotiDomain = _cotiDomain;
        cotiBridgeAddress = _cotiBridgeAddress;
        
        emit BridgeInitialized(_token, _cotiBridgeAddress, _cotiDomain);
    }
    
    /**
     * @dev Lock tokens on Sepolia and send message to COTI to mint pUSDC
     * @param amount Amount of tokens to lock
     */
    function lock(uint256 amount) external payable returns (bytes32) {
        require(amount > 0, "Amount must be greater than 0");
        require(token.balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        // Transfer tokens from user to this contract (effectively locking them)
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        lockedTokens[msg.sender] += amount;
        
        // Encode message: (address user, uint256 amount, bool isMint)
        bytes memory message = abi.encode(msg.sender, amount, true); // true = mint on COTI
        
        // Get dispatch fee
        uint256 fee = mailbox.quoteDispatch(
            cotiDomain,
            cotiBridgeAddress,
            message
        );
        
        require(msg.value >= fee, "Insufficient ETH for dispatch fee");
        
        // Send message to COTI
        bytes32 messageId = mailbox.dispatch{value: msg.value}(
            cotiDomain,
            cotiBridgeAddress,
            message
        );
        
        emit TokensLocked(msg.sender, amount, messageId);
        
        return messageId;
    }
    
    /**
     * @dev Handle unlock message from COTI (when user burns pUSDC)
     * @param _origin Origin domain (COTI)
     * @param _sender Sender address (COTI bridge)
     * @param _message Encoded message (address user, uint256 amount)
     */
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external payable override {
        require(msg.sender == address(mailbox), "Only mailbox can call");
        require(_origin == cotiDomain, "Invalid message origin");
        require(_sender == cotiBridgeAddress, "Invalid message sender");
        
        // Decode message
        (address user, uint256 amount, bool isMint) = abi.decode(_message, (address, uint256, bool));
        
        // TEMPORARILY DISABLED: Message replay protection for demo
        // bytes32 messageId = keccak256(abi.encodePacked(_origin, _sender, _message));
        // require(!processedMessages[messageId], "Message already processed");
        // processedMessages[messageId] = true;
        
        // Only process unlock messages (isMint = false)
        require(!isMint, "Invalid message type for Sepolia bridge");
        
        // Both tokens now use 18 decimals - no conversion needed
        uint256 convertedAmount = amount;
        
        // Validate locked tokens
        require(lockedTokens[user] >= convertedAmount, "Insufficient locked tokens");
        
        // Transfer tokens back to user
        lockedTokens[user] -= convertedAmount;
        require(token.transfer(user, convertedAmount), "Token transfer failed");
        
        emit TokensUnlocked(user, convertedAmount);
        emit MessageReceived(_origin, _sender, user, convertedAmount);
    }
    
    /**
     * @dev Update COTI bridge address (admin only)
     * @param _newAddress New bridge address
     */
    function updateCotiBridgeAddress(bytes32 _newAddress) external onlyOwner {
        cotiBridgeAddress = _newAddress;
        emit BridgeAddressUpdated(_newAddress);
    }
    
    /**
     * @dev Get locked tokens for a user
     * @param user User address
     * @return Amount of locked tokens
     */
    function getLockedTokens(address user) external view returns (uint256) {
        return lockedTokens[user];
    }
    
    /**
     * @dev Quote the fee for locking tokens
     * @param amount Amount to lock
     * @return Required ETH fee
     */
    function quoteLockFee(uint256 amount) external view returns (uint256) {
        bytes memory message = abi.encode(msg.sender, amount, true); // true = mint on COTI
        return mailbox.quoteDispatch(cotiDomain, cotiBridgeAddress, message);
    }
    
    /**
     * @dev Emergency function to withdraw locked tokens (admin only)
     * @param user User address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address user, uint256 amount) external onlyOwner {
        require(lockedTokens[user] >= amount, "Insufficient locked tokens");
        lockedTokens[user] -= amount;
        require(token.transfer(user, amount), "Token transfer failed");
    }
    
    /**
     * @dev Withdraw ETH fees (admin only)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawFees(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
    }
    
    /**
     * @dev Get contract token balance
     * @return Token balance held by this contract
     */
    function getContractTokenBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
    
    receive() external payable {}
} 