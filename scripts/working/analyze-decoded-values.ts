import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Analyzing COTI Bridge Decoding Accuracy");
    console.log("==========================================");
    
    // What we sent from Sepolia
    console.log("📤 EXPECTED VALUES (from Sepolia):");
    console.log("👤 User: 0x30a6C9D1d70d41756673Cce044189577F0953a75");
    console.log("💰 Amount: 50.0 tokens (50000000 with 6 decimals)");
    console.log("🔧 Is Mint: true");
    console.log("");
    
    // What the COTI bridge decoded
    console.log("📥 DECODED VALUES (from COTI Bridge):");
    const decodedUser = "0x30a6C9D1d70d41756673Cce044189577F0953a75";
    const decodedAmount = "50000000000000000000"; // This looks wrong
    const decodedIsMint = true;
    
    console.log("👤 User:", decodedUser);
    console.log("💰 Amount (raw):", decodedAmount);
    console.log("🔧 Is Mint:", decodedIsMint);
    console.log("");
    
    // Analysis
    console.log("🔍 DECODING ANALYSIS:");
    console.log("====================");
    
    // Check user address
    const userCorrect = decodedUser.toLowerCase() === "0x30a6C9D1d70d41756673Cce044189577F0953a75".toLowerCase();
    console.log(`👤 User Address: ${userCorrect ? "✅ CORRECT" : "❌ INCORRECT"}`);
    
    // Check amount - convert different decimal formats
    const expectedAmount6Decimals = 50000000; // 50 tokens with 6 decimals
    const expectedAmount18Decimals = "50000000000000000000"; // 50 tokens with 18 decimals
    
    const decodedAmountBigInt = BigInt(decodedAmount);
    const expected18DecimalsBigInt = BigInt(expectedAmount18Decimals);
    
    console.log("");
    console.log("💰 AMOUNT ANALYSIS:");
    console.log("Expected (6 decimals):", expectedAmount6Decimals, "=", ethers.formatUnits(expectedAmount6Decimals, 6), "tokens");
    console.log("Expected (18 decimals):", expectedAmount18Decimals, "=", ethers.formatUnits(expectedAmount18Decimals, 18), "tokens");
    console.log("Decoded (as received):", decodedAmount, "=", ethers.formatUnits(decodedAmount, 18), "tokens");
    console.log("");
    
    // Check if amount matches expected 18-decimal format
    const amountCorrect18 = decodedAmountBigInt === expected18DecimalsBigInt;
    console.log(`💰 Amount (18 decimals): ${amountCorrect18 ? "✅ CORRECT" : "❌ INCORRECT"}`);
    
    // Check if it could be 6-decimal format misinterpreted
    const decodedAs6Decimals = Number(decodedAmount) / Math.pow(10, 18);
    const expectedAs6Decimals = expectedAmount6Decimals / Math.pow(10, 6);
    console.log("Decoded as 6-decimal equivalent:", decodedAs6Decimals, "tokens");
    console.log("Expected as 6-decimal:", expectedAs6Decimals, "tokens");
    
    // Check bool
    console.log(`🔧 Is Mint: ${decodedIsMint === true ? "✅ CORRECT" : "❌ INCORRECT"}`);
    console.log("");
    
    // Let's manually decode the raw message to verify
    console.log("🧪 MANUAL VERIFICATION:");
    console.log("=======================");
    
    const rawMessage = "0x00000000000000000000000030a6c9d1d70d41756673cce044189577f0953a750000000000000000000000000000000000000000000000002b5e3af16b1880000";
    console.log("Raw Message:", rawMessage);
    console.log("Message Length:", rawMessage.length);
    
    // Extract parts manually
    const hexData = rawMessage.slice(2);
    
    // Address (first 32 bytes, last 20 bytes are the address)
    const addressHex = "0x" + hexData.slice(24, 64);
    console.log("Manual Address Extract:", addressHex);
    
    // Amount (second 32 bytes)
    const amountHex = "0x" + hexData.slice(64, 128);
    const manualAmount = BigInt(amountHex);
    console.log("Manual Amount Extract:", amountHex);
    console.log("Manual Amount (decimal):", manualAmount.toString());
    console.log("Manual Amount (formatted 18):", ethers.formatUnits(manualAmount, 18), "tokens");
    console.log("Manual Amount (formatted 6):", ethers.formatUnits(manualAmount, 6), "tokens");
    
    // Check what this amount represents
    console.log("");
    console.log("🎯 CONCLUSION:");
    console.log("==============");
    if (manualAmount.toString() === decodedAmount) {
        console.log("✅ Bridge decoded the amount correctly from the raw message");
        console.log("🔍 Amount represents:", ethers.formatUnits(manualAmount, 18), "tokens (18 decimals)");
        console.log("🔍 Or equivalent to:", ethers.formatUnits(manualAmount, 6), "tokens (6 decimals)");
        
        // Check if this matches our expected 50 tokens
        const fiftyTokens18 = ethers.parseUnits("50", 18);
        const fiftyTokens6 = ethers.parseUnits("50", 6);
        
        if (manualAmount === fiftyTokens18) {
            console.log("✅ This correctly represents 50 tokens with 18 decimals");
        } else if (manualAmount === fiftyTokens6) {
            console.log("✅ This correctly represents 50 tokens with 6 decimals");
        } else {
            console.log("❌ This does not match 50 tokens in either 6 or 18 decimal format");
            console.log("Expected 50 tokens (18 dec):", fiftyTokens18.toString());
            console.log("Expected 50 tokens (6 dec):", fiftyTokens6.toString());
            console.log("Actual decoded:", manualAmount.toString());
        }
    } else {
        console.log("❌ Bridge decoding error - decoded amount doesn't match manual extraction");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 