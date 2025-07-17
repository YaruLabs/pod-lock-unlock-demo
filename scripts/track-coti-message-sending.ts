import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Tracking COTI Message Sending");
    console.log("=================================");

    const [deployer] = await ethers.getSigners();
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";
    
    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    console.log("Bridge address:", cotiBridgeAddress);
    console.log("Account:", deployer.address);
    
    // Our recent burn transaction details
    const burnTxHash = "0x19a0934001b9ab6f786ddecaad1cf06b8dba8fe89fcff0dd175065038e1515e6";
    const burnBlock = 2240274;
    const messageId = "0xdda35dffd0d2aaed22945f2f3fa85b6472f726daf09460d4909ea7804a38e889";
    
    console.log("Tracking burn transaction:", burnTxHash);
    console.log("Block:", burnBlock);
    console.log("Message ID:", messageId);
    
    try {
        // 1. Get the burn transaction receipt
        console.log("\n📜 Analyzing burn transaction...");
        const txReceipt = await deployer.provider.getTransactionReceipt(burnTxHash);
        
        if (txReceipt) {
            console.log("✅ Transaction confirmed");
            console.log("Gas used:", txReceipt.gasUsed.toString());
            console.log("Status:", txReceipt.status ? "Success" : "Failed");
            console.log("Logs count:", txReceipt.logs.length);
            
            // Analyze the logs
            console.log("\n📋 Transaction logs:");
            txReceipt.logs.forEach((log, i) => {
                console.log(`  ${i + 1}. Address: ${log.address}`);
                console.log(`     Topics: ${log.topics.length}`);
                console.log(`     Data length: ${log.data.length}`);
            });
        } else {
            console.log("❌ Could not get transaction receipt");
        }

        // 2. Check for TokensBurned events in that specific block
        console.log("\n🔥 Checking TokensBurned events...");
        const burnEvents = await bridge.queryFilter(
            bridge.filters.TokensBurned(),
            burnBlock,
            burnBlock
        );
        
        console.log(`Found ${burnEvents.length} TokensBurned events in block ${burnBlock}`);
        burnEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. User: ${event.args?.user}`);
            console.log(`     Amount: ${ethers.formatUnits(event.args?.amount || 0, 6)} cpUSDC`);
            console.log(`     Message ID: ${event.args?.messageId}`);
            console.log(`     Sepolia User: ${event.args?.sepoliaUser}`);
        });

        // 3. Check bridge configuration
        console.log("\n⚙️ Bridge configuration:");
        try {
            const sepoliaBridgeAddr = await bridge.sepoliaBridgeAddress();
            const sepoliaDomain = await bridge.sepoliaDomain();
            const mailboxAddr = await bridge.mailbox();
            
            console.log("Sepolia bridge address:", sepoliaBridgeAddr);
            console.log("Sepolia domain:", sepoliaDomain.toString());
            console.log("Mailbox address:", mailboxAddr);
        } catch (configError) {
            console.log("Could not get bridge configuration");
        }

        // 4. Check if there were any ConfirmationFailed events
        console.log("\n❌ Checking for any confirmation failures...");
        const failedEvents = await bridge.queryFilter(
            bridge.filters.ConfirmationFailed(),
            burnBlock - 10,
            burnBlock + 10
        );
        
        console.log(`Found ${failedEvents.length} ConfirmationFailed events around burn block`);
        failedEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block: ${event.blockNumber}`);
            console.log(`     Reason: ${event.args?.reason}`);
            console.log(`     Details: ${event.args?.details}`);
        });

        // 5. Check recent blocks for any other bridge activity
        console.log("\n🔍 Recent bridge activity:");
        const latestBlock = await deployer.provider.getBlockNumber();
        const fromBlock = Math.max(burnBlock - 5, 0);
        const toBlock = Math.min(burnBlock + 10, latestBlock);
        
        console.log(`Checking blocks ${fromBlock} to ${toBlock}`);
        
        const allEvents = await bridge.queryFilter("*", fromBlock, toBlock);
        console.log(`Found ${allEvents.length} total bridge events`);
        
        allEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. Block ${event.blockNumber}: ${event.fragment?.name || 'Unknown'}`);
            if (event.args) {
                console.log(`     Args: ${Object.keys(event.args).length} parameters`);
            }
        });

        // 6. Check if the message was actually sent to Hyperlane
        console.log("\n📤 Checking Hyperlane message dispatch...");
        
        // Look for Hyperlane mailbox events (message dispatch)
        try {
            const mailboxAddress = await bridge.mailbox();
            console.log("Querying mailbox at:", mailboxAddress);
            
            // Generic event filter for the mailbox
            const mailboxLogs = await deployer.provider.getLogs({
                address: mailboxAddress,
                fromBlock: burnBlock,
                toBlock: burnBlock
            });
            
            console.log(`Found ${mailboxLogs.length} mailbox logs in burn block`);
            mailboxLogs.forEach((log, i) => {
                console.log(`  ${i + 1}. Topic[0]: ${log.topics[0]}`);
                console.log(`     Data length: ${log.data.length}`);
            });
            
        } catch (mailboxError) {
            console.log("Could not check mailbox events:", mailboxError);
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