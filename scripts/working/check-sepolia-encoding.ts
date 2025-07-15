import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Checking Sepolia Bridge Encoding");
    console.log("===================================");
    
    // Let's manually encode what SHOULD be sent
    console.log("📤 Expected Encoding:");
    const expectedUser = "0x30a6C9D1d70d41756673Cce044189577F0953a75";
    const expectedAmount = ethers.parseUnits("50", 6); // 50 tokens with 6 decimals (USDC)
    const expectedIsMint = true;
    
    console.log("👤 User:", expectedUser);
    console.log("💰 Amount (6 decimals):", expectedAmount.toString());
    console.log("💰 Amount (formatted):", ethers.formatUnits(expectedAmount, 6), "tokens");
    console.log("🔧 Is Mint:", expectedIsMint);
    
    const properEncoding = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bool"],
        [expectedUser, expectedAmount, expectedIsMint]
    );
    
    console.log("✅ Proper Encoding:", properEncoding);
    console.log("📏 Proper Length:", properEncoding.length);
    
    console.log("");
    console.log("📥 Actual Received Message:");
    const actualMessage = "0x00000000000000000000000030a6c9d1d70d41756673cce044189577f0953a750000000000000000000000000000000000000000000000002b5e3af16b1880000";
    console.log("Received:", actualMessage);
    console.log("📏 Received Length:", actualMessage.length);
    
    // Extract the amount from the received message
    const hexData = actualMessage.slice(2);
    const amountHex = "0x" + hexData.slice(64, 128);
    const receivedAmount = BigInt(amountHex);
    
    console.log("");
    console.log("🔍 Amount Comparison:");
    console.log("Expected Amount:", expectedAmount.toString());
    console.log("Received Amount:", receivedAmount.toString());
    console.log("Expected (formatted):", ethers.formatUnits(expectedAmount, 6), "tokens");
    console.log("Received (as 6 dec):", ethers.formatUnits(receivedAmount, 6), "tokens");
    console.log("Received (as 18 dec):", ethers.formatUnits(receivedAmount, 18), "tokens");
    
    // Check if there's a decimal conversion issue
    console.log("");
    console.log("🧮 Decimal Analysis:");
    console.log("50 tokens (6 decimals):", ethers.parseUnits("50", 6).toString());
    console.log("50 tokens (18 decimals):", ethers.parseUnits("50", 18).toString());
    console.log("3.125 tokens (6 decimals):", ethers.parseUnits("3.125", 6).toString());
    console.log("3.125 tokens (18 decimals):", ethers.parseUnits("3.125", 18).toString());
    
    // Check what the received amount would be in different decimal interpretations
    if (receivedAmount === ethers.parseUnits("3.125", 18)) {
        console.log("✅ Received amount = 3.125 tokens (18 decimals)");
    } else if (receivedAmount === ethers.parseUnits("3.125", 6)) {
        console.log("✅ Received amount = 3.125 tokens (6 decimals)");
    } else {
        console.log("❌ Received amount doesn't match 3.125 in either format");
    }
    
    // Check if there's a conversion error somewhere
    console.log("");
    console.log("🔢 Conversion Analysis:");
    const ratio = Number(receivedAmount) / Number(expectedAmount);
    console.log("Ratio (received/expected):", ratio);
    
    if (ratio === 0.0625) {
        console.log("🎯 FOUND: Received = Expected * 0.0625 (division by 16 error!)");
    } else if (ratio === 16) {
        console.log("🎯 FOUND: Received = Expected * 16 (multiplication by 16 error!)");
    } else {
        console.log("❓ Unusual ratio - not a simple conversion error");
    }
    
    // Let's also check if the Sepolia side is using the wrong decimals
    const sepoliaAmount50_18 = ethers.parseUnits("50", 18);
    if (receivedAmount * 16n === sepoliaAmount50_18) {
        console.log("🎯 THEORY: Sepolia sent 50 tokens (18 decimals) but divided by 16 somewhere");
    }
    
    console.log("");
    console.log("🎯 CONCLUSION:");
    console.log("The Sepolia bridge is encoding the wrong amount in the message.");
    console.log("This suggests a bug in the Sepolia bridge's amount handling.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 