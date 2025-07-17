// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMessageRecipient {
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _message) external;
}

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

/**
 * @title CotiBridge
 * @dev Bridge contract for COTI network with privacy features and bidirectional messaging
 */
contract CotiBridge is IMessageRecipient {
    address public immutable token;
    address public immutable mailbox;
    
    // Sepolia bridge configuration
    bytes32 public sepoliaBridgeAddress;
    uint32 public sepoliaDomain;
    
    // Track processed messages to prevent replay
    mapping(bytes32 => bool) public processedMessages;
    
    // Track burn transaction statuses
    mapping(bytes32 => bool) public burnTransactionStatus; // true = success, false = pending
    mapping(bytes32 => bool) public burnTransactionExists;
    mapping(address => bytes32[]) public userBurnTransactions;
    
    // Events
    event BridgeAction(address indexed user, uint256 amount, bool isMint);
    event MessageReceived(uint32 origin, bytes32 sender, address user, uint256 amount, bool isMint);
    event RawMessage(uint32 origin, bytes32 sender, bytes message);
    event DebugInfo(address user, uint256 amount, bool isMint, uint32 origin, bytes32 sender);
    event MessageDecoded(address user, uint256 amount, bool isMint);
    event DecodingError(string reason, bytes messageData);
    event MintSuccess(address indexed user, uint256 amount);
    event MintFailed(address indexed user, uint256 amount, string reason);
    event TokensBurned(address indexed user, uint256 amount, bytes32 messageId);
    event BurnFailed(address indexed user, uint256 amount, string reason);
    
    // New events for bidirectional messaging
    event ConfirmationSent(address indexed user, bool success, string operation, bytes32 messageId);
    event ConfirmationReceived(address indexed user, bool success, string operation);
    event UnlockConfirmationReceived(address indexed user, uint256 amount, bool success);
    event ConfirmationFailed(address indexed user, string operation, string reason);
    event MessageProcessingFailed(string messageType, string reason);
    
    constructor(address _token, address _mailbox) {
        token = _token;
        mailbox = _mailbox;
        
        // Set Sepolia configuration (these can be updated by owner if needed)
        sepoliaDomain = 11155111; // Sepolia chain ID
        // This will need to be set after deployment or in a setter function
    }

    // Add this to your contract
    receive() external payable {}
    
    /**
     * @dev Set Sepolia bridge address (needed after deployment)
     * @param _sepoliaBridgeAddress Address of Sepolia bridge (32 bytes format)
     */
    function setSepoliaBridgeAddress(bytes32 _sepoliaBridgeAddress) external {
        // In production, add access control here
        sepoliaBridgeAddress = _sepoliaBridgeAddress;
    }
    
    /**
     * @dev Set Sepolia domain (needed for configuration updates)
     * @param _sepoliaDomain Domain ID for Sepolia network
     */
    function setSepoliaDomain(uint32 _sepoliaDomain) external {
        // In production, add access control here
        sepoliaDomain = _sepoliaDomain;
    }
    
    /**
     * @dev Burn tokens on COTI and send unlock message to Sepolia
     * User must first transfer tokens to this bridge, then call burn
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external payable returns (bytes32) {
        require(amount > 0, "Amount must be greater than 0");
        require(sepoliaBridgeAddress != bytes32(0), "Sepolia bridge not configured");
        
        // Bridge burns the tokens it holds (user should have transferred them first)
        (bool burnSuccess, bytes memory data) = token.call(
            abi.encodeWithSignature("bridgeBurn(address,uint256)", msg.sender, amount)
        );
        
        if (!burnSuccess) {
            string memory errorMsg = data.length > 0 ? string(data) : "Burn failed";
            emit BurnFailed(msg.sender, amount, errorMsg);
            revert(errorMsg);
        }
        
        // Both tokens now use 18 decimals - no conversion needed
        uint256 convertedAmount = amount;
        
        // Encode message: (address user, uint256 amount, bool isMint)
        bytes memory message = abi.encode(msg.sender, convertedAmount, false); // false = unlock on Sepolia
        
        // Get dispatch fee
        uint256 fee = IMailbox(mailbox).quoteDispatch(
            sepoliaDomain,
            sepoliaBridgeAddress,
            message
        );
        
        require(msg.value >= fee, "Insufficient ETH for dispatch fee");
        
        // Send message to Sepolia
        bytes32 messageId = IMailbox(mailbox).dispatch{value: msg.value}(
            sepoliaDomain,
            sepoliaBridgeAddress,
            message
        );
        
        // Track burn transaction
        burnTransactionExists[messageId] = true;
        burnTransactionStatus[messageId] = false; // pending
        userBurnTransactions[msg.sender].push(messageId);
        
        emit TokensBurned(msg.sender, amount, messageId);
        
        return messageId;
    }
    
    /**
     * @dev Quote the fee for burning tokens
     * @param amount Amount to burn
     * @return Required ETH fee
     */
    function quoteBurnFee(uint256 amount) external view returns (uint256) {
        require(sepoliaBridgeAddress != bytes32(0), "Sepolia bridge not configured");
        
        // Both tokens now use 18 decimals - no conversion needed
        uint256 convertedAmount = amount;
        
        bytes memory message = abi.encode(msg.sender, convertedAmount, false); // false = unlock on Sepolia
        return IMailbox(mailbox).quoteDispatch(sepoliaDomain, sepoliaBridgeAddress, message);
    }
    
    /**
     * @dev Send confirmation message back to Sepolia
     * @param user User address
     * @param success Whether the operation was successful
     * @param operation Operation type ("mint" or "burn")
     * @param originalAmount Original amount involved
     */
    function _sendConfirmation(address user, bool success, string memory operation, uint256 originalAmount) internal {
        if (sepoliaBridgeAddress == bytes32(0)) {
            emit ConfirmationFailed(user, operation, "Sepolia bridge not configured");
            return;
        }
        
        // Encode confirmation message: (address user, bool success, string operation, uint256 amount)
        bytes memory confirmationMessage = abi.encode(user, success, operation, originalAmount);
        
        try IMailbox(mailbox).quoteDispatch(sepoliaDomain, sepoliaBridgeAddress, confirmationMessage) returns (uint256 fee) {
            if (fee == 0) {
                emit ConfirmationFailed(user, operation, "Zero dispatch fee returned");
                return;
            }
            
            if (address(this).balance < fee) {
                emit ConfirmationFailed(user, operation, "Insufficient ETH for confirmation fee");
                return;
            }
            
            try IMailbox(mailbox).dispatch{value: fee}(
                sepoliaDomain,
                sepoliaBridgeAddress,
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
     * @dev Handle incoming message from Hyperlane
     */
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _message) external override {
        require(msg.sender == mailbox, "Only mailbox can call");
        
        emit RawMessage(_origin, _sender, _message);
        
        // TEMPORARILY DISABLED: Message replay protection for demo
        // bytes32 messageHash = keccak256(abi.encodePacked(_origin, _sender, _message));
        // require(!processedMessages[messageHash], "Message already processed");
        // processedMessages[messageHash] = true;
        
        // Try to decode as confirmation message first
        if (_tryProcessConfirmation(_message)) {
            return; // Successfully processed as confirmation
        }
        
        // Process as regular bridge message
        (bool success, address user, uint256 amount, bool isMint) = _processMessage(_message);
        
        if (success) {
            emit MessageDecoded(user, amount, isMint);
            emit DebugInfo(user, amount, isMint, _origin, _sender);
            
            // Execute the bridge action
            if (isMint) {
                // Both Sepolia and COTI tokens now use 18 decimals - no conversion needed
                // Call mint function on the token contract
                (bool mintSuccess, bytes memory data) = token.call(
                    abi.encodeWithSignature("mint(address,uint256)", user, amount)
                );
                
                if (mintSuccess) {
                    emit MintSuccess(user, amount);
                    emit MessageReceived(_origin, _sender, user, amount, isMint);
                    emit BridgeAction(user, amount, isMint);
                    
                    // Send success confirmation back to Sepolia
                    _sendConfirmation(user, true, "mint", amount);
                } else {
                    // Mint failed, emit error
                    string memory errorMsg = data.length > 0 ? string(data) : "Mint failed";
                    emit MintFailed(user, amount, errorMsg);
                    emit DecodingError(errorMsg, _message);
                    
                    // Send failure confirmation back to Sepolia
                    _sendConfirmation(user, false, "mint", amount);
                }
            } else {
                // This shouldn't happen on COTI bridge (we don't process unlock messages here)
                emit MessageReceived(_origin, _sender, user, amount, isMint);
                emit BridgeAction(user, amount, isMint);
            }
        } else {
            emit DebugInfo(address(0), 0, false, _origin, _sender);
            emit DecodingError("Failed to decode message", _message);
        }
    }
    
    /**
     * @dev Try to process message as confirmation from Sepolia
     * @param _message The message to decode
     * @return true if successfully processed as confirmation
     */
    function _tryProcessConfirmation(bytes calldata _message) internal returns (bool) {
        try this.decodeConfirmation(_message) returns (address user, bool success, string memory operation, uint256 amount) {
            emit ConfirmationReceived(user, success, operation);
            
            if (keccak256(bytes(operation)) == keccak256(bytes("unlock"))) {
                emit UnlockConfirmationReceived(user, amount, success);
                
                // Find and update corresponding burn transaction status
                bytes32[] storage userTxs = userBurnTransactions[user];
                for (uint i = 0; i < userTxs.length; i++) {
                    if (burnTransactionExists[userTxs[i]] && !burnTransactionStatus[userTxs[i]]) {
                        burnTransactionStatus[userTxs[i]] = success;
                        break;
                    }
                }
            }
            
            return true;
        } catch Error(string memory reason) {
            emit MessageProcessingFailed("confirmation", reason);
            return false;
        } catch (bytes memory lowLevelData) {
            emit MessageProcessingFailed("confirmation", "Failed to decode confirmation message");
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
     * @dev Internal function to process and decode the message
     */
    function _processMessage(bytes calldata _message) internal pure returns (bool success, address user, uint256 amount, bool isMint) {
        // Check minimum length (64 bytes for address + uint256)
        if (_message.length < 64) {
            return (false, address(0), 0, false);
        }
        
        // Try to decode the message manually
        // ABI encoding format: [32 bytes address][32 bytes amount][32 bytes bool - optional]
        
        bytes32 addressBytes;
        bytes32 amountBytes;
        
        // Extract first 32 bytes (address, padded)
        assembly {
            addressBytes := calldataload(_message.offset)
        }
        
        // Extract second 32 bytes (amount)
        assembly {
            amountBytes := calldataload(add(_message.offset, 32))
        }
        
        // Convert to address (last 20 bytes of the 32-byte word)
        user = address(uint160(uint256(addressBytes)));
        amount = uint256(amountBytes);
        
        // Default to mint if bool is missing (which it usually is due to truncation)
        isMint = true;
        
        // Try to extract bool if message is long enough
        if (_message.length >= 96) {
            bytes32 boolBytes;
            assembly {
                boolBytes := calldataload(add(_message.offset, 64))
            }
            isMint = uint256(boolBytes) != 0;
        }
        
        // Validate extracted data
        if (user == address(0) || amount == 0) {
            return (false, address(0), 0, false);
        }
        
        return (true, user, amount, isMint);
    }
    
    /**
     * @dev Get burn transaction status
     * @param messageId Transaction message ID
     * @return exists Whether transaction exists
     * @return success Whether transaction was successful (only valid if exists)
     */
    function getBurnTransactionStatus(bytes32 messageId) external view returns (bool exists, bool success) {
        return (burnTransactionExists[messageId], burnTransactionStatus[messageId]);
    }
    
    /**
     * @dev Get user's burn transactions
     * @param user User address
     * @return Array of transaction message IDs
     */
    function getUserBurnTransactions(address user) external view returns (bytes32[] memory) {
        return userBurnTransactions[user];
    }
    
    /**
     * @dev External function to test decoding (for debugging)
     */
    function testDecode(bytes calldata _message) external pure returns (address user, uint256 amount, bool isMint) {
        (bool success, address _user, uint256 _amount, bool _isMint) = _processMessage(_message);
        require(success, "Decoding failed");
        return (_user, _amount, _isMint);
    }
} 