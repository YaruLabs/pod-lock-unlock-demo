import { ethers } from "hardhat";

async function main() {
    console.log("🧪 Testing New COTI Bridge Decoding");
    console.log("===================================");
    
    // The actual message received by the bridge - clean format
    const rawMessage = "0x00000000000000000000000030a6c9d1d70d41756673cce044189577f0953a750000000000000000000000000000000000000000000000002b5e3af16b1880000";
    
    console.log("📨 Testing Message:", rawMessage);
    console.log("📏 Message Length:", rawMessage.length);
    
    // Validate hex string
    if (!ethers.isHexString(rawMessage)) {
        console.log("❌ Invalid hex string format");
        return;
    }
    
    console.log("✅ Valid hex string format");
    console.log("");
    
    // Get the new COTI bridge contract
    const newBridgeAddress = "0x7da5EBAb79F8fe78005ef16eB958745f9D22c124";
    const bridgeAbi = [
        "function testDecode(bytes calldata _message) external pure returns (address user, uint256 amount, bool isMint)"
    ];
    
    const [signer] = await ethers.getSigners();
    const bridge = new ethers.Contract(newBridgeAddress, bridgeAbi, signer);
    
    console.log("🎯 Testing New Bridge Decoding:");
    console.log("==============================");
    
    try {
        console.log("🔍 Calling testDecode...");
        
        // Convert string to bytes
        const messageBytes = ethers.getBytes(rawMessage);
        console.log("📦 Message bytes length:", messageBytes.length);
        
        const result = await bridge.testDecode(rawMessage);
        
        console.log("✅ NEW BRIDGE DECODING SUCCESS!");
        console.log("👤 User:", result[0]);
        console.log("💰 Amount (raw):", result[1].toString());
        console.log("💰 Amount (18 dec):", ethers.formatUnits(result[1], 18), "tokens");
        console.log("💰 Amount (6 dec):", ethers.formatUnits(result[1], 6), "tokens");
        console.log("🔧 Is Mint:", result[2]);
        
        console.log("");
        console.log("🎯 VERIFICATION:");
        console.log("===============");
        
        // Check if values are correct
        const expectedUser = "0x30a6C9D1d70d41756673Cce044189577F0953a75";
        const userCorrect = result[0].toLowerCase() === expectedUser.toLowerCase();
        console.log(`👤 User: ${userCorrect ? "✅ CORRECT" : "❌ INCORRECT"}`);
        
        // For amount, we know the actual message contains 3.125 tokens (18 decimals)
        const expectedAmount = ethers.parseUnits("3.125", 18);
        const amountCorrect = result[1] === expectedAmount;
        console.log(`💰 Amount: ${amountCorrect ? "✅ CORRECT (3.125 tokens)" : "❌ INCORRECT"}`);
        
        console.log(`🔧 Is Mint: ${result[2] ? "✅ TRUE (default)" : "❌ FALSE"}`);
        
        console.log("");
        console.log("🎉 CONCLUSION:");
        console.log("==============");
        if (userCorrect && amountCorrect) {
            console.log("✅ NEW BRIDGE CORRECTLY DECODES THE ACTUAL MESSAGE!");
            console.log("✅ Shows real values instead of fake ones");
            console.log("✅ Properly handles truncated messages");
        } else {
            console.log("❌ Bridge still has decoding issues");
        }
        
    } catch (error) {
        console.log("❌ NEW BRIDGE DECODING FAILED:");
        console.log("Error:", error.message);
        console.log("");
        
        // Try to manually test the message format
        console.log("🔍 Manual Message Analysis:");
        const hexData = rawMessage.slice(2);
        console.log("Hex length:", hexData.length);
        console.log("Expected length for 2 fields (64 bytes):", 128);
        console.log("Expected length for 3 fields (96 bytes):", 192);
        
        if (hexData.length === 129) {
            console.log("⚠️ Message has 129 chars - odd number, might have formatting issue");
            console.log("First 128 chars:", "0x" + hexData.slice(0, 128));
            console.log("Last char:", hexData.slice(128));
        }
        
        // Let's try with a cleaned message
        const cleanMessage = "0x" + hexData.slice(0, 128); // Take only first 128 hex chars (64 bytes)
        console.log("🧹 Trying with cleaned message:", cleanMessage);
        
        try {
            const cleanResult = await bridge.testDecode(cleanMessage);
            console.log("✅ CLEANED MESSAGE WORKS!");
            console.log("👤 User:", cleanResult[0]);
            console.log("💰 Amount:", cleanResult[1].toString());
            console.log("🔧 Is Mint:", cleanResult[2]);
        } catch (cleanError) {
            console.log("❌ Cleaned message also failed:", cleanError.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 