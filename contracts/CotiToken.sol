// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/token/PrivateERC20/PrivateERC20.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

/**
 * @title CotiToken
 * @dev Minimal COTI Private USDC token with only a public mint function.
 */
contract CotiToken is PrivateERC20 {
    using MpcCore for *;
    
    constructor() PrivateERC20("COTI Private USDC", "cpUSDC") {}

    /**
     * @dev Mint tokens to any address. Anyone can call.
     * @param to Recipient address
     * @param amount Amount to mint (converted to gtUint64)
     */
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Convert uint256 to gtUint64 for PrivateERC20
        gtUint64 gtAmount = MpcCore.setPublic64(uint64(amount));
        _mint(to, gtAmount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
} 