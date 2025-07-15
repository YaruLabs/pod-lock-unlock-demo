import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Updating to New 18-Decimal COTI Bridge ===\n");

  // Network setups
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL!);
  const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

  const sepoliaBridgeAddress = "0x371F045B08772E36E352F67C38868FFC4113fF85";
  const newCotiBridgeAddress = "0x2830F52B310bC900f285709d9ef92e9D5aCfB32f";

  console.log("Configuration:");
  console.log("- Sepolia Bridge:", sepoliaBridgeAddress);
  console.log("- New COTI Bridge:", newCotiBridgeAddress);
  console.log("- Wallet:", sepoliaWallet.address);
  console.log();

  // Sepolia Bridge ABI (correct functions)
  const sepoliaBridgeABI = [
    "function cotiBridgeAddress() external view returns (bytes32)",
    "function updateCotiBridgeAddress(bytes32 _newAddress) external",
    "function lock(uint256 amount) external payable returns (bytes32)",
    "function quoteLockFee(uint256 amount) external view returns (uint256)",
    "function token() external view returns (address)"
  ];

  const sepoliaBridge = new ethers.Contract(sepoliaBridgeAddress, sepoliaBridgeABI, sepoliaWallet);

  try {
    // Check current configuration
    console.log("📋 Current Sepolia Bridge Configuration:");
    
    try {
      const currentCotiBridge = await sepoliaBridge.cotiBridgeAddress();
      console.log("- Current COTI Bridge:", currentCotiBridge);
    } catch (e) {
      console.log("- Current COTI Bridge: ERROR -", e.message);
    }

    const tokenAddress = await sepoliaBridge.token();
    console.log("- Token Address:", tokenAddress);

    // Convert new COTI bridge address to bytes32
    const newCotiBridgeBytes32 = ethers.zeroPadValue(newCotiBridgeAddress, 32);
    console.log("- New COTI Bridge (bytes32):", newCotiBridgeBytes32);
    console.log();

    // Update COTI bridge address
    console.log("🔧 Updating COTI Bridge Address...");
    try {
      const updateTx = await sepoliaBridge.updateCotiBridgeAddress(newCotiBridgeBytes32, {
        gasLimit: 200000
      });
      
      console.log("Transaction Hash:", updateTx.hash);
      const receipt = await updateTx.wait();
      console.log("✅ COTI bridge address updated successfully!");
      console.log("Block:", receipt.blockNumber);
      
      // Verify update
      const updatedCotiBridge = await sepoliaBridge.cotiBridgeAddress();
      console.log("- Updated COTI Bridge:", updatedCotiBridge);
      console.log("- Match:", updatedCotiBridge.toLowerCase() === newCotiBridgeBytes32.toLowerCase() ? "✅ YES" : "❌ NO");
      
    } catch (error) {
      console.error("❌ Failed to update COTI bridge:", error.message);
      if (error.reason) {
        console.error("Reason:", error.reason);
      }
    }

    // Test cross-chain message
    console.log("\n🚀 Testing Cross-Chain Lock...");
    const testAmount = ethers.parseUnits("2.5", 18); // 2.5 tokens
    
    console.log("Test Parameters:");
    console.log("- Amount:", ethers.formatUnits(testAmount, 18), "tokens");
    console.log("- Amount (wei):", testAmount.toString());
    
    // Check fee
    try {
      const fee = await sepoliaBridge.quoteLockFee(testAmount);
      console.log("- Required fee:", ethers.formatEther(fee), "ETH");
      
      // Execute lock
      const lockTx = await sepoliaBridge.lock(testAmount, {
        value: fee,
        gasLimit: 500000
      });
      
      console.log("Lock Transaction Hash:", lockTx.hash);
      const receipt = await lockTx.wait();
      console.log("✅ Cross-chain lock successful!");
      console.log("Block:", receipt.blockNumber);
      
      // Parse events
      console.log("\nEvents:");
      for (const log of receipt.logs) {
        try {
          const parsed = sepoliaBridge.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsed) {
            console.log(`- ${parsed.name}:`, parsed.args);
          }
        } catch (e) {
          // Ignore unparseable logs
        }
      }
      
    } catch (error) {
      console.error("❌ Cross-chain lock failed:", error.message);
      if (error.reason) {
        console.error("Reason:", error.reason);
      }
    }

  } catch (error) {
    console.error("❌ Update failed:", error.message);
  }

  console.log("\n=== Expected Results ===");
  console.log("1. ✅ Sepolia bridge updated to new COTI bridge");
  console.log("2. ✅ Cross-chain message sent with 18-decimal amount");
  console.log("3. 🔄 New COTI bridge will receive message");
  console.log("4. ✅ New COTI bridge will mint exact same amount (no conversion)");
  console.log("5. 🎯 Perfect 1:1 ratio between Sepolia and COTI tokens");
  
  console.log("\nMessage Flow:");
  console.log(`- Sepolia: lock ${ethers.formatUnits(testAmount, 18)} tokens (18 decimals)`);
  console.log(`- Hyperlane: send ${testAmount.toString()} wei`);
  console.log(`- COTI: mint ${ethers.formatUnits(testAmount, 18)} tokens (18 decimals)`);
  console.log("- ✅ Same precision, no conversion errors!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 