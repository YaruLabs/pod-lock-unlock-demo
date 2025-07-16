import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing Burn & Unlock WITHOUT Replay Protection");
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // New contract addresses (without replay protection)
  const COTI_TOKEN = "0xa4661A5B5DF03840024e144D123a274969DdeBA2";
  const COTI_BRIDGE = "0x52221191a3565eda7124c7690500Afa4e066a196";
  const SEPOLIA_BRIDGE = "0x1F623C0A0487F1da20BcB5fb1BD48C0f296E0CE5";
  const SEPOLIA_TOKEN = "0x9d422b5ef943517eBdF5B4b5F36a9748B77D3e37";

  console.log("\n📋 Contract Addresses (No Replay Protection):");
  console.log("COTI Token:", COTI_TOKEN);
  console.log("COTI Bridge:", COTI_BRIDGE);
  console.log("Sepolia Bridge:", SEPOLIA_BRIDGE);
  console.log("Sepolia Token:", SEPOLIA_TOKEN);

  console.log("\n💰 Step 1: Setup Fresh Tokens for Testing");
  console.log("==========================================");

  // Connect to COTI contracts
  const cotiToken = await ethers.getContractAt("CotiToken", COTI_TOKEN);
  const cotiBridge = await ethers.getContractAt("CotiBridge", COTI_BRIDGE);

  try {
    // Mint fresh tokens for testing
    const mintAmount = ethers.parseUnits("50", 18); // 50 cpUSDC
    console.log("Minting", ethers.formatUnits(mintAmount, 18), "cpUSDC for testing...");
    
    const mintTx = await cotiToken.mint(deployer.address, mintAmount, {
      gasLimit: 500000
    });
    await mintTx.wait();
    console.log("✅ Tokens minted to user");

    // Transfer tokens to bridge for burning
    const transferAmount = ethers.parseUnits("30", 18); // 30 cpUSDC
    console.log("Minting", ethers.formatUnits(transferAmount, 18), "cpUSDC to bridge...");
    
    const bridgeMintTx = await cotiToken.mint(COTI_BRIDGE, transferAmount, {
      gasLimit: 500000
    });
    await bridgeMintTx.wait();
    console.log("✅ Tokens ready in bridge for burning");

  } catch (error) {
    console.log("Token setup error:", error.message);
  }

  console.log("\n🔥 Step 2: Execute Burn Operation");
  console.log("=================================");

  const burnAmount = ethers.parseUnits("10", 18); // 10 cpUSDC
  console.log("Burn Details:");
  console.log("- Amount:", ethers.formatUnits(burnAmount, 18), "cpUSDC");
  console.log("- Expected unlock:", ethers.formatUnits(burnAmount / BigInt(10**12), 6), "sUSDC");

  try {
    // Get burn fee
    const burnFee = await cotiBridge.quoteBurnFee(burnAmount);
    console.log("- Burn fee:", ethers.formatEther(burnFee), "ETH");

    // Execute burn
    console.log("🚀 Executing burn transaction...");
    const burnTx = await cotiBridge.burn(burnAmount, {
      value: burnFee,
      gasLimit: 1000000
    });

    console.log("📤 Burn transaction submitted:", burnTx.hash);
    const receipt = await burnTx.wait();
    console.log("✅ Burn transaction confirmed!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Extract message ID
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsed = cotiBridge.interface.parseLog(log);
          if (parsed && parsed.name === "TokensBurned") {
            const messageId = parsed.args[2];
            console.log("📨 Hyperlane Message ID:", messageId);
          }
        } catch (error) {
          // Skip logs that don't match
        }
      }
    }

  } catch (error) {
    console.error("❌ Burn failed:", error.message);
    return;
  }

  console.log("\n⏰ Step 3: Monitor Unlock (No Replay Protection)");
  console.log("===============================================");
  console.log("✅ Message replay protection DISABLED");
  console.log("✅ Hyperlane can deliver messages multiple times without error");
  console.log("✅ Should see successful unlock on Sepolia");
  console.log("⏳ Waiting for Hyperlane delivery (2-5 minutes)...");

  console.log("\n🎯 Expected Results:");
  console.log("====================");
  console.log("1. ✅ COTI burn successful (completed above)");
  console.log("2. ✅ Hyperlane message delivery (no 'already processed' error)");
  console.log("3. ✅ Sepolia unlock successful");
  console.log("4. ✅ Token balances updated correctly");

  console.log("\n💡 To check results:");
  console.log("====================");
  console.log("Check Sepolia status in 2-3 minutes:");
  console.log("npx hardhat run scripts/check-sepolia-unlock-status.ts --network sepolia");
  
  console.log("\n🔍 Monitor Hyperlane Explorer:");
  console.log("Search for transaction hash to see delivery status");
  console.log("Should see successful delivery without errors!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 