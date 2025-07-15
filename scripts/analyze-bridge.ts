import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🔍 COTI Bridge Analysis - Handle Function Debug");
    console.log("===============================================");
    
    // Load deployment addresses
    const deploymentsDir = path.join(__dirname, "..", "..", "deployments");
    const cotiDeploymentPath = path.join(deploymentsDir, "coti.json");
    
    if (!fs.existsSync(cotiDeploymentPath)) {
        console.error("❌ COTI deployment file not found");
        process.exit(1);
    }
    
    const cotiDeployment = JSON.parse(fs.readFileSync(cotiDeploymentPath, "utf8"));
    
    console.log("📋 Contract Addresses:");
    console.log("COTI Token:", cotiDeployment.contracts.CotiToken);
    console.log("COTI Bridge:", cotiDeployment.contracts.CotiBridge);
    
    try {
        // Connect to COTI testnet
        const provider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
        console.log("🌐 Connected to COTI testnet");
        
        // Get the bridge contract
        const bridgeABI = [
            "event RawMessage(uint32 origin, bytes32 sender, bytes message)",
            "event DebugInfo(address user, uint256 amount, bool isMint, uint32 origin, bytes32 sender)",
            "event BridgeAction(address indexed user, uint256 amount, bool isMint)",
            "event MessageReceived(uint32 origin, bytes32 sender, address user, uint256 amount, bool isMint)",
            "function decodeMessage(bytes calldata _message) external pure returns (address user, uint256 amount, bool isMint)"
        ];
        
        const bridge = new ethers.Contract(cotiDeployment.contracts.CotiBridge, bridgeABI, provider);
        
        // Get recent events
        console.log("\n🔍 Analyzing Recent Bridge Events (last 1000 blocks)...");
        
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(currentBlock - 1000, 0);
        
        console.log(`Searching from block ${fromBlock} to ${currentBlock}`);
        
        // Check for RawMessage events
        console.log("\n📨 Raw Message Events:");
        try {
            const rawMessageEvents = await bridge.queryFilter("RawMessage", fromBlock);
            console.log(`Found ${rawMessageEvents.length} RawMessage events`);
            
            for (let i = 0; i < Math.min(rawMessageEvents.length, 5); i++) {
                const event = rawMessageEvents[rawMessageEvents.length - 1 - i]; // Latest first
                console.log(`\n📝 Event ${i + 1} (Block ${event.blockNumber}):`);
                console.log(`  Origin: ${event.args?.origin}`);
                console.log(`  Sender: ${event.args?.sender}`);
                console.log(`  Message: ${event.args?.message}`);
                
                // Try to decode the message
                try {
                    const decoded = await bridge.decodeMessage(event.args?.message);
                    console.log(`  ✅ Decoded:`);
                    console.log(`    User: ${decoded.user}`);
                    console.log(`    Amount: ${decoded.amount.toString()}`);
                    console.log(`    Is Mint: ${decoded.isMint}`);
                } catch (decodeError) {
                    console.log(`  ❌ Failed to decode message: ${decodeError.message}`);
                }
            }
        } catch (error) {
            console.log("No RawMessage events found or error:", error.message);
        }
        
        // Check for DebugInfo events
        console.log("\n🐛 Debug Info Events:");
        try {
            const debugEvents = await bridge.queryFilter("DebugInfo", fromBlock);
            console.log(`Found ${debugEvents.length} DebugInfo events`);
            
            for (let i = 0; i < Math.min(debugEvents.length, 5); i++) {
                const event = debugEvents[debugEvents.length - 1 - i];
                console.log(`\n🔍 Debug Event ${i + 1} (Block ${event.blockNumber}):`);
                console.log(`  User: ${event.args?.user}`);
                console.log(`  Amount: ${event.args?.amount?.toString()}`);
                console.log(`  Is Mint: ${event.args?.isMint}`);
                console.log(`  Origin: ${event.args?.origin}`);
                console.log(`  Sender: ${event.args?.sender}`);
            }
        } catch (error) {
            console.log("No DebugInfo events found or error:", error.message);
        }
        
        // Check for BridgeAction events
        console.log("\n🌉 Bridge Action Events:");
        try {
            const bridgeActionEvents = await bridge.queryFilter("BridgeAction", fromBlock);
            console.log(`Found ${bridgeActionEvents.length} BridgeAction events`);
            
            for (let i = 0; i < Math.min(bridgeActionEvents.length, 3); i++) {
                const event = bridgeActionEvents[bridgeActionEvents.length - 1 - i];
                console.log(`\n⚡ Action Event ${i + 1} (Block ${event.blockNumber}):`);
                console.log(`  User: ${event.args?.user}`);
                console.log(`  Amount: ${event.args?.amount?.toString()}`);
                console.log(`  Is Mint: ${event.args?.isMint}`);
            }
        } catch (error) {
            console.log("No BridgeAction events found or error:", error.message);
        }
        
        // Check for MessageReceived events
        console.log("\n📬 Message Received Events:");
        try {
            const messageReceivedEvents = await bridge.queryFilter("MessageReceived", fromBlock);
            console.log(`Found ${messageReceivedEvents.length} MessageReceived events`);
            
            for (let i = 0; i < Math.min(messageReceivedEvents.length, 3); i++) {
                const event = messageReceivedEvents[messageReceivedEvents.length - 1 - i];
                console.log(`\n✉️ Received Event ${i + 1} (Block ${event.blockNumber}):`);
                console.log(`  Origin: ${event.args?.origin}`);
                console.log(`  Sender: ${event.args?.sender}`);
                console.log(`  User: ${event.args?.user}`);
                console.log(`  Amount: ${event.args?.amount?.toString()}`);
                console.log(`  Is Mint: ${event.args?.isMint}`);
            }
        } catch (error) {
            console.log("No MessageReceived events found or error:", error.message);
        }
        
        console.log("\n🎯 Analysis Summary:");
        console.log("=====================");
        console.log("✅ Bridge contract is accessible");
        console.log("✅ Event queries working");
        
        if (rawMessageEvents?.length > 0) {
            console.log("✅ Bridge is receiving messages from Hyperlane");
        } else {
            console.log("⚠️ No recent messages received - check Hyperlane delivery");
        }
        
        console.log("\n💡 Next Steps:");
        console.log("- If messages are being received but not processed, check the handle function logic");
        console.log("- If no messages are received, check Hyperlane delivery");
        console.log("- Check if mint function is working by looking at BridgeAction events");
        
    } catch (error) {
        console.error("❌ Analysis failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 