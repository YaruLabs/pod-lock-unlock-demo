// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMailbox {
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _message) external;
}

/**
 * @title CotiBridge
 * @dev Bridge contract for COTI network with privacy features
 */
contract CotiBridge is IMailbox {
    address public immutable token;
    address public immutable mailbox;
    
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
    
    constructor(address _token, address _mailbox) {
        token = _token;
        mailbox = _mailbox;
    }
    
    /**
     * @dev Handle incoming message from Hyperlane
     */
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _message) external override {
        require(msg.sender == mailbox, "Only mailbox can call");
        
        emit RawMessage(_origin, _sender, _message);
        
        // Generate message hash to prevent replay
        bytes32 messageHash = keccak256(abi.encodePacked(_origin, _sender, _message));
        require(!processedMessages[messageHash], "Message already processed");
        processedMessages[messageHash] = true;
        
        // Process the message
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
                } else {
                    // Mint failed, emit error
                    string memory errorMsg = data.length > 0 ? string(data) : "Mint failed";
                    emit MintFailed(user, amount, errorMsg);
                    emit DecodingError(errorMsg, _message);
                }
            } else {
                // For burn operations (not implemented yet)
                emit MessageReceived(_origin, _sender, user, amount, isMint);
                emit BridgeAction(user, amount, isMint);
            }
        } else {
            emit DebugInfo(address(0), 0, false, _origin, _sender);
            emit DecodingError("Failed to decode message", _message);
        }
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
     * @dev External function to test decoding (for debugging)
     */
    function testDecode(bytes calldata _message) external pure returns (address user, uint256 amount, bool isMint) {
        (bool success, address _user, uint256 _amount, bool _isMint) = _processMessage(_message);
        require(success, "Decoding failed");
        return (_user, _amount, _isMint);
    }
} 