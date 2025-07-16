// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SepoliaToken
 * @dev Simple ERC20 token for Sepolia testnet. Anyone can mint.
 * Updated to use 18 decimals to match COTI token.
 */
contract SepoliaToken is ERC20 {
    constructor() ERC20("Sepolia USDC", "sUSDC") {
        // Optionally mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @dev Mint tokens to any address. Anyone can call.
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18; // Changed from 6 to 18 to match COTI token
    }
} 