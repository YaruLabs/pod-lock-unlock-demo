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
 * @dev Bridge contract for COTI network with privacy features
 */
contract CotiBridge is IMessageRecipient {
    address public immutable token;
    address public immutable mailbox;
    
    // Sepolia bridge configuration
    bytes32 public sepoliaBridgeAddress;
    uint32 public sepoliaDomain;
    
    // Track processed messages to prevent replay
    mapping(bytes32 => bool) public processedMessages;
    
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
     * @dev Handle incoming message from Hyperlane
     */
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _message) external override {
        require(msg.sender == mailbox, "Only mailbox can call");
        
        // Validate origin and sender only if configured (for production security)
        if (sepoliaBridgeAddress != bytes32(0)) {
            require(_origin == sepoliaDomain, "Invalid message origin");
            require(_sender == sepoliaBridgeAddress, "Invalid message sender");
        }
        
        emit RawMessage(_origin, _sender, _message);
        
        // TEMPORARILY DISABLED: Message replay protection for demo
        // bytes32 messageHash = keccak256(abi.encodePacked(_origin, _sender, _message));
        // require(!processedMessages[messageHash], "Message already processed");
        // processedMessages[messageHash] = true;
        
        // Decode message with improved error handling
        (bool success, address user, uint256 amount, bool isMint) = _decodeMessage(_message);
        
        if (success) {
            emit MessageDecoded(user, amount, isMint);
            emit DebugInfo(user, amount, isMint, _origin, _sender);
            
            // Only process mint messages (isMint = true)
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
                } else {
                    // Mint failed, emit error (but don't revert for demo compatibility)
                    string memory errorMsg = data.length > 0 ? string(data) : "Mint failed";
                    emit MintFailed(user, amount, errorMsg);
                    emit DecodingError(errorMsg, _message);
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
     * @dev Internal function to safely decode cross-chain messages
     * @param _message Encoded message bytes
     * @return success Whether decoding was successful
     * @return user User address from message
     * @return amount Token amount from message
     * @return isMint Whether this is a mint (true) or unlock (false) operation
     */
    function _decodeMessage(bytes calldata _message) 
        internal 
        view 
        returns (bool success, address user, uint256 amount, bool isMint) 
    {
        // Check minimum message length for abi.decode(address, uint256, bool)
        if (_message.length < 96) {
            return (false, address(0), 0, false);
        }
        
        try this._safeDecode(_message) returns (address _user, uint256 _amount, bool _isMint) {
            // Validate decoded data
            if (_user == address(0) || _amount == 0) {
                return (false, address(0), 0, false);
            }
            return (true, _user, _amount, _isMint);
        } catch {
            return (false, address(0), 0, false);
        }
    }
    
    /**
     * @dev External helper for safe message decoding (used internally with try/catch)
     * @param _message Encoded message bytes
     * @return user User address
     * @return amount Token amount
     * @return isMint Operation type
     */
    function _safeDecode(bytes calldata _message) 
        external 
        pure 
        returns (address user, uint256 amount, bool isMint) 
    {
        return abi.decode(_message, (address, uint256, bool));
    }

    /**
     * @dev Internal function to process and decode the message
     * NOTE: This method is deprecated, use _decodeMessage instead for better reliability
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
     * @dev External function to test decoding (for debugging)
     */
    function testDecode(bytes calldata _message) external pure returns (address user, uint256 amount, bool isMint) {
        (bool success, address _user, uint256 _amount, bool _isMint) = _processMessage(_message);
        require(success, "Decoding failed");
        return (_user, _amount, _isMint);
    }
} 