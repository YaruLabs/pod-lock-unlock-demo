// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/token/PrivateERC20/PrivateERC20.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

/**
 * @title CotiToken
 * @dev Minimal COTI Private USDC token with mint and burn functions.
 */
contract CotiToken is PrivateERC20 {
    using MpcCore for *;
    
    constructor() PrivateERC20("COTI Private USDC", "cpUSDC") {
        // Optionally mint initial supply to deployer
         uint64 amount64 =uint64(1000 * 10**decimals());
        _mint(msg.sender, MpcCore.setPublic64(amount64));
    }

    /**
     * @dev Mint tokens to any address. Anyone can call.
     * @param to Recipient address
     * @param amount Amount to mint (in wei, will be converted to uint64)
     */
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Convert uint256 to uint64 (COTI uses uint64 for amounts)
        uint64 amount64 = uint64(amount);
        
        // Use the proper COTI PrivateERC20 mint function
        _mint(to, MpcCore.setPublic64(amount64));
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount to burn (in wei, will be converted to uint64)
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Convert uint256 to uint64 (COTI uses uint64 for amounts)
        uint64 amount64 = uint64(amount);
        
        // Use the proper COTI PrivateERC20 burn function
        _burn(msg.sender, MpcCore.setPublic64(amount64));
    }

    /**
     * @dev Burn tokens from specified account
     * @param from Account to burn from  
     * @param amount Amount to burn (in wei, will be converted to uint64)
     */
    function burnFrom(address from, uint256 amount) external {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Only allow burning your own tokens for simplicity
        require(msg.sender == from, "Can only burn your own tokens");
        
        // Convert uint256 to uint64 (COTI uses uint64 for amounts)
        uint64 amount64 = uint64(amount);
        
        // Use the proper COTI PrivateERC20 burn function
        _burn(from, MpcCore.setPublic64(amount64));
    }

    /**
     * @dev Bridge burn function - user transfers tokens to bridge, bridge burns them
     * @param user User who originally owned the tokens
     * @param amount Amount to burn (in wei, will be converted to uint64)
     */
    function bridgeBurn(address user, uint256 amount) external {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Convert uint256 to uint64 (COTI uses uint64 for amounts)
        uint64 amount64 = uint64(amount);
        
        // Bridge burns its own tokens (after user transferred them)
        _burn(msg.sender, MpcCore.setPublic64(amount64));
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
} 