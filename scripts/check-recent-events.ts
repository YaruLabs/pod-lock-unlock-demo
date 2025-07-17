import { ethers } from "hardhat";

async function main() {
    console.log("📜 Checking Recent Bridge Events");
    console.log("================================");

    const [deployer] = await ethers.getSigners();
    const sepoliaBridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    
    const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
    const bridge = SepoliaBridge.attach(sepoliaBridgeAddress);

    const latestBlock = await deployer.provider.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 100, 0); // Last 100 blocks only
    
    console.log(`Checking blocks ${fromBlock} to ${latestBlock}`);
    
    try {
        // Check TokensLocked events
        const lockEvents = await bridge.queryFilter(
            bridge.filters.TokensLocked(),
            fromBlock,
            latestBlock
        );
        console.log(`\n🔒 Found ${lockEvents.length} TokensLocked events:`);
        lockEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}, TxHash: ${event.transactionHash}`);
            console.log(`     User: ${event.args?.user}, Amount: ${ethers.formatUnits(event.args?.amount || 0, 6)} sUSDC`);
            console.log(`     MessageId: ${event.args?.messageId}`);
        });

        // Check TokensUnlocked events
        const unlockEvents = await bridge.queryFilter(
            bridge.filters.TokensUnlocked(),
            fromBlock,
            latestBlock
        );
        console.log(`\n🔓 Found ${unlockEvents.length} TokensUnlocked events:`);
        unlockEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}, TxHash: ${event.transactionHash}`);
            console.log(`     User: ${event.args?.user}, Amount: ${ethers.formatUnits(event.args?.amount || 0, 6)} sUSDC`);
        });

        // Check ConfirmationFailed events
        const failedEvents = await bridge.queryFilter(
            bridge.filters.ConfirmationFailed(),
            fromBlock,
            latestBlock
        );
        console.log(`\n❌ Found ${failedEvents.length} ConfirmationFailed events:`);
        failedEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}: ${event.args?.reason}`);
        });

        // Check MessageProcessingFailed events
        const processingFailedEvents = await bridge.queryFilter(
            bridge.filters.MessageProcessingFailed(),
            fromBlock,
            latestBlock
        );
        console.log(`\n🚫 Found ${processingFailedEvents.length} MessageProcessingFailed events:`);
        processingFailedEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}: ${event.args?.reason}`);
        });

    } catch (error) {
        console.error("Error querying events:", error);
    }

    // Also check the pending transaction status
    console.log("\n📋 Checking pending transaction:");
    const userTransactions = await bridge.getUserLockTransactions(deployer.address);
    if (userTransactions.length > 0) {
        const txId = userTransactions[0];
        const status = await bridge.lockTransactionStatus(txId);
        console.log(`Transaction ID: ${txId}`);
        console.log(`Status: ${status ? 'Confirmed ✅' : 'Pending ⏰'}`);
        
        if (!status) {
            console.log("\n💡 This transaction is still pending confirmation from COTI burn");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 