import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Checking New CotiBridge Events");
    console.log("==================================");
    
    // Get the COTI provider
    const [signer] = await ethers.getSigners();
    const provider = signer.provider;
    
    // Latest fixed COTI bridge address
    const newBridgeAddress = "0x7da5EBAb79F8fe78005ef16eB958745f9D22c124";
    
    console.log("📋 Contract Address:");
    console.log(`New COTI Bridge: ${newBridgeAddress}`);
    console.log("🌐 Connected to COTI testnet");
    
    // Bridge ABI with new events
    const bridgeAbi = [
        "event RawMessage(uint32 origin, bytes32 sender, bytes message)",
        "event DebugInfo(address user, uint256 amount, bool isMint, uint32 origin, bytes32 sender)",
        "event BridgeAction(address indexed user, uint256 amount, bool isMint)",
        "event MessageReceived(uint32 origin, bytes32 sender, address user, uint256 amount, bool isMint)",
        "event MessageDecoded(address user, uint256 amount, bool isMint)",
        "event DecodingError(string reason, bytes messageData)"
    ];
    
    const bridge = new ethers.Contract(newBridgeAddress, bridgeAbi, provider);
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 200); // Check last 200 blocks
    
    console.log(`🔍 Checking blocks ${fromBlock} to ${currentBlock}...`);
    console.log("");
    
    try {
        // Get all events
        const rawMessages = await bridge.queryFilter("RawMessage", fromBlock, currentBlock);
        const debugInfo = await bridge.queryFilter("DebugInfo", fromBlock, currentBlock);
        const bridgeActions = await bridge.queryFilter("BridgeAction", fromBlock, currentBlock);
        const messageReceived = await bridge.queryFilter("MessageReceived", fromBlock, currentBlock);
        const messageDecoded = await bridge.queryFilter("MessageDecoded", fromBlock, currentBlock);
        const decodingErrors = await bridge.queryFilter("DecodingError", fromBlock, currentBlock);
        
        console.log(`📨 Found ${rawMessages.length} RawMessage events`);
        console.log(`✅ Found ${messageDecoded.length} MessageDecoded events`);
        console.log(`❌ Found ${decodingErrors.length} DecodingError events`);
        console.log(`🐛 Found ${debugInfo.length} DebugInfo events`);
        console.log(`🌉 Found ${bridgeActions.length} BridgeAction events`);
        console.log(`📬 Found ${messageReceived.length} MessageReceived events`);
        console.log("");
        
        // Show details of events if found
        if (rawMessages.length > 0) {
            console.log("📨 RawMessage Events:");
            for (const event of rawMessages) {
                console.log(`  Block: ${event.blockNumber}`);
                console.log(`  Origin: ${event.args[0]}`);
                console.log(`  Sender: ${event.args[1]}`);
                console.log(`  Message: ${event.args[2]}`);
                console.log(`  Message Length: ${event.args[2].length}`);
                console.log("");
            }
        }
        
        if (messageDecoded.length > 0) {
            console.log("✅ MessageDecoded Events:");
            for (const event of messageDecoded) {
                console.log(`  Block: ${event.blockNumber}`);
                console.log(`  User: ${event.args[0]}`);
                console.log(`  Amount: ${event.args[1]}`);
                console.log(`  Amount (18 dec): ${ethers.formatUnits(event.args[1], 18)} tokens`);
                console.log(`  Amount (6 dec): ${ethers.formatUnits(event.args[1], 6)} tokens`);
                console.log(`  Is Mint: ${event.args[2]}`);
                console.log("");
            }
        }
        
        if (decodingErrors.length > 0) {
            console.log("❌ DecodingError Events:");
            for (const event of decodingErrors) {
                console.log(`  Block: ${event.blockNumber}`);
                console.log(`  Reason: ${event.args[0]}`);
                console.log(`  Message Data: ${event.args[1]}`);
                console.log("");
            }
        }
        
        if (debugInfo.length > 0) {
            console.log("🐛 DebugInfo Events:");
            for (const event of debugInfo) {
                console.log(`  Block: ${event.blockNumber}`);
                console.log(`  User: ${event.args[0]}`);
                console.log(`  Amount: ${event.args[1]}`);
                console.log(`  Amount (18 dec): ${ethers.formatUnits(event.args[1], 18)} tokens`);
                console.log(`  Is Mint: ${event.args[2]}`);
                console.log(`  Origin: ${event.args[3]}`);
                console.log(`  Sender: ${event.args[4]}`);
                console.log("");
            }
        }
        
        if (bridgeActions.length > 0) {
            console.log("🌉 BridgeAction Events:");
            for (const event of bridgeActions) {
                console.log(`  Block: ${event.blockNumber}`);
                console.log(`  User: ${event.args[0]}`);
                console.log(`  Amount: ${event.args[1]}`);
                console.log(`  Amount (18 dec): ${ethers.formatUnits(event.args[1], 18)} tokens`);
                console.log(`  Is Mint: ${event.args[2]}`);
                console.log("");
            }
        }
        
        if (messageReceived.length > 0) {
            console.log("📬 MessageReceived Events:");
            for (const event of messageReceived) {
                console.log(`  Block: ${event.blockNumber}`);
                console.log(`  Origin: ${event.args[0]}`);
                console.log(`  Sender: ${event.args[1]}`);
                console.log(`  User: ${event.args[2]}`);
                console.log(`  Amount: ${event.args[3]}`);
                console.log(`  Amount (18 dec): ${ethers.formatUnits(event.args[3], 18)} tokens`);
                console.log(`  Is Mint: ${event.args[4]}`);
                console.log("");
            }
        }
        
        // Summary
        console.log("🎯 Summary:");
        console.log("============");
        if (rawMessages.length === 0) {
            console.log("⏳ No messages received yet - Hyperlane may still be delivering");
            console.log("⚠️ Check Hyperlane delivery status");
        } else {
            console.log("✅ Messages received from Hyperlane");
            if (messageDecoded.length > 0) {
                console.log("✅ Message decoding successful with REAL VALUES!");
                if (bridgeActions.length > 0) {
                    console.log("✅ Bridge processing completed successfully!");
                }
            } else if (decodingErrors.length > 0) {
                console.log("⚠️ Message decoding failed - check DecodingError events");
            } else if (debugInfo.length > 0) {
                console.log("⚠️ Messages received but processing issues detected");
            }
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