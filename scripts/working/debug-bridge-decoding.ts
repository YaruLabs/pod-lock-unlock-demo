import { ethers } from "hardhat";

async function main() {
    console.log("🐛 Debugging COTI Bridge Decoding Logic");
    console.log("=======================================");
    
    // The actual message received by the bridge
    const rawMessage = "0x00000000000000000000000030a6c9d1d70d41756673cce044189577f0953a750000000000000000000000000000000000000000000000002b5e3af16b1880000";
    
    console.log("📨 Raw Message:", rawMessage);
    console.log("📏 Message Length:", rawMessage.length);
    console.log("");
    
    // Get the COTI bridge contract
    const cotiBridgeAddress = "0x30432caCEEbea499a06bA0bCa3eDd3033c616157";
    const bridgeAbi = [
        "function decodeMessage(bytes calldata _message) external pure returns (address user, uint256 amount, bool isMint)",
        "function decodePartialMessage(bytes calldata _message) external pure returns (address user, uint256 amount)"
    ];
    
    const [signer] = await ethers.getSigners();
    const bridge = new ethers.Contract(cotiBridgeAddress, bridgeAbi, signer);
    
    console.log("🧪 Testing Bridge Decoding Functions:");
    console.log("====================================");
    
    // Test 1: Try full decoding (should fail)
    try {
        console.log("1️⃣ Testing decodeMessage (full)...");
        const result = await bridge.decodeMessage(rawMessage);
        console.log("✅ Full decode succeeded:");
        console.log("   User:", result[0]);
        console.log("   Amount:", result[1].toString());
        console.log("   Is Mint:", result[2]);
    } catch (error) {
        console.log("❌ Full decode failed (expected):", error.message.split('(')[0]);
    }
    
    console.log("");
    
    // Test 2: Try partial decoding
    try {
        console.log("2️⃣ Testing decodePartialMessage...");
        const result = await bridge.decodePartialMessage(rawMessage);
        console.log("✅ Partial decode result:");
        console.log("   User:", result[0]);
        console.log("   Amount:", result[1].toString());
        console.log("   Amount formatted (18 dec):", ethers.formatUnits(result[1], 18), "tokens");
        console.log("   Amount formatted (6 dec):", ethers.formatUnits(result[1], 6), "tokens");
    } catch (error) {
        console.log("❌ Partial decode failed:", error.message);
    }
    
    console.log("");
    
    // Manual analysis of the message structure
    console.log("🔍 Manual Message Analysis:");
    console.log("===========================");
    
    const hexData = rawMessage.slice(2);
    console.log("Hex Data:", hexData);
    console.log("Hex Length:", hexData.length, "chars");
    
    // ABI encoding structure for (address, uint256, bool):
    // 0-63: First 32 bytes (address padded)
    // 64-127: Second 32 bytes (uint256)
    // 128-191: Third 32 bytes (bool) - MISSING in our case
    
    console.log("");
    console.log("📊 Byte-by-byte breakdown:");
    console.log("Bytes 0-63 (address):", hexData.slice(0, 64));
    console.log("Bytes 64-127 (amount):", hexData.slice(64, 128));
    console.log("Bytes 128+ (bool):", hexData.slice(128) || "MISSING");
    
    // Extract address correctly
    const addressPart = "0x" + hexData.slice(24, 64); // Address is last 20 bytes of first 32-byte slot
    console.log("");
    console.log("✅ Extracted Address:", addressPart);
    
    // Extract amount correctly
    const amountHex = "0x" + hexData.slice(64, 128);
    const actualAmount = BigInt(amountHex);
    console.log("✅ Extracted Amount Hex:", amountHex);
    console.log("✅ Extracted Amount:", actualAmount.toString());
    console.log("✅ Extracted Amount (18 dec):", ethers.formatUnits(actualAmount, 18), "tokens");
    
    // Compare with what we sent originally
    console.log("");
    console.log("🎯 Original vs Extracted:");
    console.log("=========================");
    console.log("Expected User: 0x30a6C9D1d70d41756673Cce044189577F0953a75");
    console.log("Extracted User:", addressPart);
    console.log("User Match:", addressPart.toLowerCase() === "0x30a6C9D1d70d41756673Cce044189577F0953a75".toLowerCase() ? "✅" : "❌");
    
    console.log("");
    console.log("Expected Amount: 50 tokens");
    console.log("Extracted Amount:", ethers.formatUnits(actualAmount, 18), "tokens");
    
    // Check if the extracted amount matches any expected value
    const fiftyTokens18 = ethers.parseUnits("50", 18);
    const fiftyTokens6 = ethers.parseUnits("50", 6);
    
    if (actualAmount === fiftyTokens18) {
        console.log("Amount Match: ✅ (50 tokens with 18 decimals)");
    } else if (actualAmount === fiftyTokens6) {
        console.log("Amount Match: ✅ (50 tokens with 6 decimals)");
    } else {
        console.log("Amount Match: ❌");
        console.log("  Expected 50 tokens (18 dec):", fiftyTokens18.toString());
        console.log("  Expected 50 tokens (6 dec):", fiftyTokens6.toString());
        console.log("  Actually extracted:", actualAmount.toString());
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 