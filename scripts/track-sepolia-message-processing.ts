import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Tracking Sepolia Message Processing");
    console.log("=====================================");

    const [deployer] = await ethers.getSigners();
    const sepoliaBridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    
    const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
    const bridge = SepoliaBridge.attach(sepoliaBridgeAddress);

    const latestBlock = await deployer.provider.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 200, 0); // Last 200 blocks
    
    console.log(`Checking blocks ${fromBlock} to ${latestBlock}`);
    console.log("Bridge address:", sepoliaBridgeAddress);
    
    // Check bridge ETH balance
    const bridgeBalance = await deployer.provider.getBalance(sepoliaBridgeAddress);
    console.log("Bridge ETH balance:", ethers.formatEther(bridgeBalance), "ETH");
    
    try {
        // 1. Check for incoming message handling (handle function calls)
        console.log("\n📨 Checking for incoming messages...");
        
        // Check for any transactions TO the bridge (these would be message deliveries)
        const bridgeTransactions = await deployer.provider.getLogs({
            address: sepoliaBridgeAddress,
            fromBlock: fromBlock,
            toBlock: latestBlock
        });
        
        console.log(`Found ${bridgeTransactions.length} transactions to bridge`);
        
        if (bridgeTransactions.length > 0) {
            console.log("Recent bridge activity:");
            bridgeTransactions.slice(-5).forEach((log, i) => {
                console.log(`  ${i + 1}. Block ${log.blockNumber}, TxHash: ${log.transactionHash}`);
            });
        }

        // 2. Check for unlock events
        console.log("\n🔓 Checking for TokensUnlocked events...");
        const unlockEvents = await bridge.queryFilter(
            bridge.filters.TokensUnlocked(),
            fromBlock,
            latestBlock
        );
        
        console.log(`Found ${unlockEvents.length} unlock events`);
        unlockEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}, TxHash: ${event.transactionHash}`);
            console.log(`     User: ${event.args?.user}`);
            console.log(`     Amount: ${ethers.formatUnits(event.args?.amount || 0, 6)} sUSDC`);
        });

        // 3. Check for confirmation failures
        console.log("\n❌ Checking for ConfirmationFailed events...");
        const confirmationFailedEvents = await bridge.queryFilter(
            bridge.filters.ConfirmationFailed(),
            fromBlock,
            latestBlock
        );
        
        console.log(`Found ${confirmationFailedEvents.length} confirmation failures`);
        confirmationFailedEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}, TxHash: ${event.transactionHash}`);
            console.log(`     Reason: ${event.args?.reason}`);
            console.log(`     Details: ${event.args?.details}`);
        });

        // 4. Check for message processing attempts
        console.log("\n🔄 Checking recent transactions TO the bridge...");
        
        // Get recent transactions that called the bridge
        for (let block = latestBlock; block > latestBlock - 50; block--) {
            try {
                const blockData = await deployer.provider.getBlock(block, true);
                if (blockData && blockData.transactions) {
                    const bridgeTxs = blockData.transactions.filter(tx => 
                        typeof tx === 'object' && tx.to === sepoliaBridgeAddress
                    );
                    
                    if (bridgeTxs.length > 0) {
                        console.log(`Block ${block} had ${bridgeTxs.length} bridge transactions:`);
                        bridgeTxs.forEach((tx, i) => {
                            if (typeof tx === 'object') {
                                console.log(`  ${i + 1}. ${tx.hash} - Gas: ${tx.gasLimit?.toString()}`);
                            }
                        });
                    }
                }
            } catch (blockError) {
                // Skip blocks that can't be fetched
            }
        }

        // 5. Check if there are any failed transactions to the bridge
        console.log("\n🚫 Checking for failed bridge transactions...");
        
        try {
            // Look for failed transactions in recent blocks
            for (let i = 0; i < 10; i++) {
                const block = latestBlock - i;
                const blockData = await deployer.provider.getBlock(block, true);
                
                if (blockData?.transactions) {
                    for (const tx of blockData.transactions) {
                        if (typeof tx === 'object' && tx.to === sepoliaBridgeAddress) {
                            try {
                                const receipt = await deployer.provider.getTransactionReceipt(tx.hash);
                                if (receipt && receipt.status === 0) {
                                    console.log(`❌ Failed transaction found: ${tx.hash}`);
                                    console.log(`   Block: ${receipt.blockNumber}, Gas used: ${receipt.gasUsed}`);
                                    
                                    // Try to get revert reason
                                    try {
                                        await deployer.provider.call(tx, receipt.blockNumber);
                                    } catch (callError: any) {
                                        console.log(`   Revert reason: ${callError.message}`);
                                    }
                                }
                            } catch (receiptError) {
                                // Skip if can't get receipt
                            }
                        }
                    }
                }
            }
        } catch (failedTxError) {
            console.log("Could not check failed transactions");
        }

        // 6. Check current pending lock status
        console.log("\n📋 Current pending transactions:");
        const userTransactions = await bridge.getUserLockTransactions(deployer.address);
        
        for (let i = 0; i < userTransactions.length; i++) {
            const txId = userTransactions[i];
            const status = await bridge.lockTransactionStatus(txId);
            console.log(`${i + 1}. ${txId} - ${status ? 'Confirmed ✅' : 'Pending ⏰'}`);
        }
        
    } catch (error) {
        console.error("Error during tracking:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 