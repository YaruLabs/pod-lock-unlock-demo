import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Checking Pending Confirmations");
    console.log("=================================");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    // Contract addresses
    const sepoliaBridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    
    // Get contract instance
    const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
    const bridge = SepoliaBridge.attach(sepoliaBridgeAddress);

    // Check bridge ETH balance
    const bridgeBalance = await deployer.provider.getBalance(sepoliaBridgeAddress);
    console.log("Bridge ETH balance:", ethers.formatEther(bridgeBalance), "ETH");

    // Get user's lock transactions
    const userTransactions = await bridge.getUserLockTransactions(deployer.address);
    console.log("User lock transactions:", userTransactions.length);

    for (let i = 0; i < userTransactions.length; i++) {
        const txId = userTransactions[i];
        const exists = await bridge.lockTransactionExists(txId);
        const status = await bridge.lockTransactionStatus(txId);
        
        console.log(`Transaction ${i}: ${txId}`);
        console.log(`  Exists: ${exists}, Status: ${status ? 'Confirmed' : 'Pending'}`);
    }

    // Check recent events
    const latestBlock = await deployer.provider.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 1000, 0); // Last 1000 blocks
    
    console.log(`\n📜 Checking events from block ${fromBlock} to ${latestBlock}`);
    
    try {
        // Check for TokensLocked events
        const lockEvents = await bridge.queryFilter(
            bridge.filters.TokensLocked(),
            fromBlock,
            latestBlock
        );
        console.log(`Found ${lockEvents.length} TokensLocked events`);
        
        // Check for TokensUnlocked events
        const unlockEvents = await bridge.queryFilter(
            bridge.filters.TokensUnlocked(),
            fromBlock,
            latestBlock
        );
        console.log(`Found ${unlockEvents.length} TokensUnlocked events`);
        
        // Check for ConfirmationFailed events
        const failedEvents = await bridge.queryFilter(
            bridge.filters.ConfirmationFailed(),
            fromBlock,
            latestBlock
        );
        console.log(`Found ${failedEvents.length} ConfirmationFailed events`);
        
        if (failedEvents.length > 0) {
            console.log("❌ Recent confirmation failures:");
            failedEvents.forEach((event, i) => {
                console.log(`  ${i + 1}. Block ${event.blockNumber}: ${event.args?.reason || 'Unknown reason'}`);
            });
        }
        
    } catch (error) {
        console.error("Error querying events:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 