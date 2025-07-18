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
 * @dev Bridge contract for Sepolia network that handles cross-chain token operations with bidirectional messaging
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
    
    // Track lock transaction statuses
    mapping(bytes32 => bool) public lockTransactionStatus; // true = success, false = pending
    mapping(bytes32 => bool) public lockTransactionExists;
    mapping(address => bytes32[]) public userLockTransactions;
    
    // Add at the top with other state variables
    mapping(address => uint256) public unconfirmedLockedTokens;
    
    // Events
    event TokensLocked(address indexed user, uint256 amount, bytes32 messageId);
    event TokensUnlocked(address indexed user, uint256 amount);
    event BridgeAddressUpdated(bytes32 newAddress);
    event MessageReceived(uint32 origin, bytes32 sender, address user, uint256 amount);
    event BridgeInitialized(address token, bytes32 cotiBridge, uint32 cotiDomain);
    
    // New events for bidirectional messaging
    event ConfirmationSent(address indexed user, bool success, string operation, bytes32 messageId);
    event ConfirmationReceived(address indexed user, bool success, string operation);
    event MintConfirmationReceived(address indexed user, uint256 amount, bool success);
    event ConfirmationFailed(address indexed user, string operation, string reason);
    event UnlockFailed(address indexed user, uint256 amount, string reason);
    
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
        unconfirmedLockedTokens[msg.sender] += amount;
        
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
        
        // Track lock transaction
        lockTransactionExists[messageId] = true;
        lockTransactionStatus[messageId] = false; // pending
        userLockTransactions[msg.sender].push(messageId);
        
        emit TokensLocked(msg.sender, amount, messageId);
        
        return messageId;
    }
    
    /**
     * @dev Send confirmation message back to COTI
     * @param user User address
     * @param success Whether the operation was successful
     * @param operation Operation type ("lock" or "unlock")
     * @param originalAmount Original amount involved
     */
    function _sendConfirmation(address user, bool success, string memory operation, uint256 originalAmount) internal {
        if (cotiBridgeAddress == bytes32(0)) {
            emit ConfirmationFailed(user, operation, "COTI bridge not configured");
            return;
        }
        
        // Encode confirmation message: (address user, bool success, string operation, uint256 amount)
        bytes memory confirmationMessage = abi.encode(user, success, operation, originalAmount);
        
        try mailbox.quoteDispatch(cotiDomain, cotiBridgeAddress, confirmationMessage) returns (uint256 fee) {
            if (fee == 0) {
                emit ConfirmationFailed(user, operation, "Zero dispatch fee returned");
                return;
            }
            
            if (address(this).balance < fee) {
                emit ConfirmationFailed(user, operation, "Insufficient ETH for confirmation fee");
                return;
            }
            
            try mailbox.dispatch{value: fee}(
                cotiDomain,
                cotiBridgeAddress,
                confirmationMessage
            ) returns (bytes32 messageId) {
                emit ConfirmationSent(user, success, operation, messageId);
            } catch Error(string memory reason) {
                emit ConfirmationFailed(user, operation, string.concat("Dispatch failed: ", reason));
            } catch (bytes memory lowLevelData) {
                emit ConfirmationFailed(user, operation, "Dispatch failed: Low-level error");
            }
            
        } catch Error(string memory reason) {
            emit ConfirmationFailed(user, operation, string.concat("Fee quote failed: ", reason));
        } catch (bytes memory lowLevelData) {
            emit ConfirmationFailed(user, operation, "Fee quote failed: Low-level error");
        }
    }
    
    /**
     * @dev Try to process message as confirmation from COTI
     * @param _message The message to decode
     * @return true if successfully processed as confirmation
     */
    function _tryProcessConfirmation(bytes calldata _message) internal returns (bool) {
        try this.decodeConfirmation(_message) returns (address user, bool success, string memory operation, uint256 amount) {
            emit ConfirmationReceived(user, success, operation);
            
            if (keccak256(bytes(operation)) == keccak256(bytes("mint"))) {
                emit MintConfirmationReceived(user, amount, success);
                
                // Find and update corresponding lock transaction status
                bytes32[] storage userTxs = userLockTransactions[user];
                for (uint i = 0; i < userTxs.length; i++) {
                    if (lockTransactionExists[userTxs[i]] && !lockTransactionStatus[userTxs[i]]) {
                        lockTransactionStatus[userTxs[i]] = success;
                        break;
                    }
                }
                
                // If mint failed, unlock the tokens back to user
                if (!success) {
                    if (lockedTokens[user] >= amount) {
                        lockedTokens[user] -= amount;
                        require(token.transfer(user, amount), "Token refund failed");
                        emit TokensUnlocked(user, amount);
                    }
                } else {
                    // If mint was successful, update unconfirmedLockedTokens
                    if (unconfirmedLockedTokens[user] >= amount) {
                        unconfirmedLockedTokens[user] -= amount;
                    }
                }
            }
            
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev External function to decode confirmation messages (used by _tryProcessConfirmation)
     */
    function decodeConfirmation(bytes calldata _message) external pure returns (address user, bool success, string memory operation, uint256 amount) {
        return abi.decode(_message, (address, bool, string, uint256));
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
        
        // Try to decode as confirmation message first
        if (_tryProcessConfirmation(_message)) {
            return; // Successfully processed as confirmation
        }
        
        // Decode as regular unlock message
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
        if (lockedTokens[user] < convertedAmount) {
            emit UnlockFailed(user, convertedAmount, "Insufficient locked tokens");
            _sendConfirmation(user, false, "unlock", convertedAmount);
            return;
        }
        
        // Transfer tokens back to user
        lockedTokens[user] -= convertedAmount;
        bool transferSuccess = token.transfer(user, convertedAmount);
        
        if (transferSuccess) {
            emit TokensUnlocked(user, convertedAmount);
            emit MessageReceived(_origin, _sender, user, convertedAmount);
            
            // Send success confirmation back to COTI
            _sendConfirmation(user, true, "unlock", convertedAmount);
        } else {
            // Revert the locked tokens change if transfer failed
            lockedTokens[user] += convertedAmount;
            emit UnlockFailed(user, convertedAmount, "Token transfer failed");
            
            // Send failure confirmation back to COTI
            _sendConfirmation(user, false, "unlock", convertedAmount);
        }
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
     * @dev Get lock transaction status
     * @param messageId Transaction message ID
     * @return exists Whether transaction exists
     * @return success Whether transaction was successful (only valid if exists)
     */
    function getLockTransactionStatus(bytes32 messageId) external view returns (bool exists, bool success) {
        return (lockTransactionExists[messageId], lockTransactionStatus[messageId]);
    }
    
    /**
     * @dev Get user's lock transactions
     * @param user User address
     * @return Array of transaction message IDs
     */
    function getUserLockTransactions(address user) external view returns (bytes32[] memory) {
        return userLockTransactions[user];
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