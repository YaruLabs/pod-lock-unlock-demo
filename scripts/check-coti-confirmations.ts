import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Checking COTI Confirmation Messages");
    console.log("======================================");

    const [deployer] = await ethers.getSigners();
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";
    
    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    const latestBlock = await deployer.provider.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 100, 0); // Last 100 blocks
    
    console.log(`Checking blocks ${fromBlock} to ${latestBlock}`);
    console.log("COTI bridge address:", cotiBridgeAddress);
    
    try {
        // Check for any message received events
        console.log("\n📨 Checking for MessageReceived events...");
        const messageEvents = await bridge.queryFilter(
            bridge.filters.MessageReceived(),
            fromBlock,
            latestBlock
        );
        
        console.log(`Found ${messageEvents.length} MessageReceived events`);
        messageEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}, TxHash: ${event.transactionHash}`);
            console.log(`     Origin: ${event.args?.origin}`);
            console.log(`     Sender: ${event.args?.sender}`);
            console.log(`     User: ${event.args?.user}`);
            console.log(`     Amount: ${ethers.formatUnits(event.args?.amount || 0, 6)} cpUSDC`);
            console.log(`     Is Mint: ${event.args?.isMint}`);
        });

        // Check for burn transaction status updates
        console.log("\n📋 Checking burn transaction statuses...");
        const userBurnTxs = await bridge.getUserBurnTransactions(deployer.address);
        console.log(`User has ${userBurnTxs.length} burn transactions`);
        
        for (let i = 0; i < userBurnTxs.length; i++) {
            const txId = userBurnTxs[i];
            const exists = await bridge.burnTransactionExists(txId);
            const status = await bridge.burnTransactionStatus(txId);
            
            console.log(`  ${i + 1}. ${txId}`);
            console.log(`     Exists: ${exists}, Status: ${status ? 'Confirmed ✅' : 'Pending ⏰'}`);
        }

        // Check for recent transactions TO the bridge (incoming messages)
        console.log("\n📥 Checking for incoming transactions...");
        
        try {
            const bridgeLogs = await deployer.provider.getLogs({
                address: cotiBridgeAddress,
                fromBlock: fromBlock,
                toBlock: latestBlock
            });
            
            console.log(`Found ${bridgeLogs.length} logs for COTI bridge`);
            
            // Group by transaction hash
            const txHashes = new Set(bridgeLogs.map(log => log.transactionHash));
            console.log(`From ${txHashes.size} unique transactions`);
            
            // Show recent unique transactions
            Array.from(txHashes).slice(-5).forEach((hash, i) => {
                console.log(`  ${i + 1}. ${hash}`);
            });
            
        } catch (logError) {
            console.log("Could not fetch bridge logs");
        }

        // Check for any confirmation failed events
        console.log("\n❌ Checking for ConfirmationFailed events...");
        const failedEvents = await bridge.queryFilter(
            bridge.filters.ConfirmationFailed(),
            fromBlock,
            latestBlock
        );
        
        console.log(`Found ${failedEvents.length} ConfirmationFailed events`);
        failedEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}: ${event.args?.reason}`);
        });

        // Check our recent burn transactions
        console.log("\n🔥 Recent burn transactions:");
        const recentBurns = [
            "0x19a0934001b9ab6f786ddecaad1cf06b8dba8fe89fcff0dd175065038e1515e6", // First burn
            "0xd5d9ae6f073e27862be82856281342be3f5450ba6789156d3eecda013552163a"  // Second burn
        ];
        
        for (const burnHash of recentBurns) {
            try {
                const receipt = await deployer.provider.getTransactionReceipt(burnHash);
                if (receipt) {
                    console.log(`${burnHash}: Block ${receipt.blockNumber}, Status: ${receipt.status ? 'Success' : 'Failed'}`);
                }
            } catch (receiptError) {
                console.log(`${burnHash}: Could not get receipt`);
            }
        }

    } catch (error) {
        console.error("Error checking confirmations:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 