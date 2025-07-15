import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Decoding Latest Hyperlane Message");
    console.log("===================================");
    
    // The latest message we received from the new bridge
    const messageData = "0x00000000000000000000000030a6c9d1d70d41756673cce044189577f0953a750000000000000000000000000000000000000000000000002b5e3af16b1880000";
    
    console.log("📨 Raw Message:", messageData);
    console.log("📏 Message Length:", messageData.length);
    console.log("📏 Expected Length for (address,uint256,bool):", 2 + 32*2 + 32*2 + 32*2); // 0x + 96 hex chars = 98
    
    // Remove 0x prefix for analysis
    const hexData = messageData.slice(2);
    console.log("📏 Hex Data Length:", hexData.length);
    console.log("📏 Expected Hex Length:", 32*2 + 32*2 + 32*2); // 192 hex chars
    
    // Break down the message
    console.log("\n🔍 Message Breakdown:");
    console.log("===================");
    
    if (hexData.length >= 64) {
        const addressPart = "0x" + hexData.slice(24, 64); // Address is in last 20 bytes of first 32 bytes
        console.log("👤 Address:", addressPart);
    }
    
    if (hexData.length >= 128) {
        const amountPart = "0x" + hexData.slice(64, 128);
        const amount = BigInt(amountPart);
        console.log("💰 Amount (hex):", amountPart);
        console.log("💰 Amount (dec):", amount.toString());
        console.log("💰 Amount (formatted):", ethers.formatUnits(amount, 6), "tokens");
    }
    
    // Check what's missing for bool
    console.log("\n⚠️ Missing Bool Data:");
    console.log("Current length:", hexData.length, "chars");
    console.log("Expected length:", 192, "chars");
    console.log("Missing:", 192 - hexData.length, "chars");
    
    // Reconstruct proper message
    const properMessage = hexData.padEnd(192, '0') + '1'; // Add proper bool
    console.log("\n✅ Reconstructed Proper Message:");
    console.log("0x" + properMessage);
    
    // Try to decode the truncated message
    console.log("\n🧪 Decoding Tests:");
    console.log("==================");
    
    try {
        // Try decoding as just (address, uint256)
        const decoded2 = ethers.AbiCoder.defaultAbiCoder().decode(
            ["address", "uint256"],
            messageData
        );
        
        console.log("✅ Decoded as (address, uint256):");
        console.log("👤 User:", decoded2[0]);
        console.log("💰 Amount:", decoded2[1].toString());
        console.log("💰 Formatted:", ethers.formatUnits(decoded2[1], 6), "tokens");
        
    } catch (error) {
        console.log("❌ Failed to decode as (address, uint256):", error.message);
    }
    
    try {
        // Try decoding with padded bool
        const paddedMessage = "0x" + hexData.padEnd(192, '0') + '1';
        const decoded3 = ethers.AbiCoder.defaultAbiCoder().decode(
            ["address", "uint256", "bool"],
            paddedMessage
        );
        
        console.log("\n✅ Decoded with padded bool:");
        console.log("👤 User:", decoded3[0]);
        console.log("💰 Amount:", decoded3[1].toString());
        console.log("🔧 Is Mint:", decoded3[2]);
        
    } catch (error) {
        console.log("\n❌ Failed to decode with padding:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 