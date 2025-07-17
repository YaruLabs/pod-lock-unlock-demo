import { ethers } from "hardhat";

async function main() {
    console.log("💰 Checking All Balances & Bridge States");
    console.log("========================================");

    const [deployer] = await ethers.getSigners();
    const userAddress = deployer.address;
    console.log("User address:", userAddress);

    // Contract addresses
    const sepoliaTokenAddress = "0xe7c71B5D1cebCa1A08d9E2a4F88eCf0fc60b46Cf";
    const sepoliaBridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    
    // Check if we're on Sepolia or COTI
    const network = hre.network.name;
    console.log("Current network:", network);

    if (network === "sepolia") {
        console.log("\n🔍 SEPOLIA NETWORK STATUS");
        console.log("=========================");
        
        // Get contract instances
        const SepoliaToken = await ethers.getContractFactory("SepoliaToken");
        const token = SepoliaToken.attach(sepoliaTokenAddress);
        
        const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
        const bridge = SepoliaBridge.attach(sepoliaBridgeAddress);

        // Check balances
        const userBalance = await token.balanceOf(userAddress);
        const bridgeBalance = await token.balanceOf(sepoliaBridgeAddress);
        const lockedTokens = await bridge.lockedTokens(userAddress);
        const ethBalance = await deployer.provider.getBalance(sepoliaBridgeAddress);

        console.log("User sUSDC balance:", ethers.formatUnits(userBalance, 6), "sUSDC");
        console.log("Bridge sUSDC balance:", ethers.formatUnits(bridgeBalance, 6), "sUSDC");
        console.log("User locked tokens:", ethers.formatUnits(lockedTokens, 6), "sUSDC");
        console.log("Bridge ETH balance:", ethers.formatEther(ethBalance), "ETH");

        // Check pending transactions
        const userTxs = await bridge.getUserLockTransactions(userAddress);
        console.log("\nPending transactions:", userTxs.length);
        for (let i = 0; i < userTxs.length; i++) {
            const txId = userTxs[i];
            const status = await bridge.lockTransactionStatus(txId);
            console.log(`  ${i + 1}. ${txId} - ${status ? 'Confirmed ✅' : 'Pending ⏰'}`);
        }

    } else if (network === "coti") {
        console.log("\n🔍 COTI NETWORK STATUS");
        console.log("======================");
        
        const cotiTokenAddress = "0x3371F18A7a0704e7F3f33322F650575C6846bd9a";
        const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";
        
        // Get contract instances
        const CotiToken = await ethers.getContractFactory("CotiToken");
        const token = CotiToken.attach(cotiTokenAddress);
        
        const CotiBridge = await ethers.getContractFactory("CotiBridge");
        const bridge = CotiBridge.attach(cotiBridgeAddress);

        // Check balances
        const userBalance = await token.balanceOf(userAddress);
        const bridgeBalance = await token.balanceOf(cotiBridgeAddress);
        const ethBalance = await deployer.provider.getBalance(userAddress);

        console.log("User cpUSDC balance:", ethers.formatUnits(userBalance, 6), "cpUSDC");
        console.log("Bridge cpUSDC balance:", ethers.formatUnits(bridgeBalance, 6), "cpUSDC");
        console.log("User ETH balance:", ethers.formatEther(ethBalance), "ETH");

        // Try to get bridge stats
        try {
            const bridgeEthBalance = await deployer.provider.getBalance(cotiBridgeAddress);
            console.log("Bridge ETH balance:", ethers.formatEther(bridgeEthBalance), "ETH");
        } catch (error) {
            console.log("Could not check bridge ETH balance");
        }
    }
}

// @ts-ignore
const hre = require("hardhat");

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 