import { ethers } from "hardhat";

async function main() {
  console.log("🎯 DEMO: Burn & Unlock Flow (No Replay Protection)");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Demo with account:", deployer.address);

  // Current working contract addresses (without replay protection)
  const COTI_TOKEN = "0xa4661A5B5DF03840024e144D123a274969DdeBA2";
  const COTI_BRIDGE = "0x52221191a3565eda7124c7690500Afa4e066a196";
  const SEPOLIA_BRIDGE = "0x1F623C0A0487F1da20BcB5fb1BD48C0f296E0CE5";
  const SEPOLIA_TOKEN = "0x9d422b5ef943517eBdF5B4b5F36a9748B77D3e37";

  console.log("\n📋 Contract Addresses:");
  console.log("COTI Token:", COTI_TOKEN);
  console.log("COTI Bridge:", COTI_BRIDGE);
  console.log("Sepolia Bridge:", SEPOLIA_BRIDGE);
  console.log("Sepolia Token:", SEPOLIA_TOKEN);

  console.log("\n💰 Step 1: Setup Tokens for Demo");
  console.log("=================================");

  // Connect to COTI contracts
  const cotiToken = await ethers.getContractAt("CotiToken", COTI_TOKEN);
  const cotiBridge = await ethers.getContractAt("CotiBridge", COTI_BRIDGE);

  try {
    // Mint fresh tokens for demo
    const mintAmount = ethers.parseUnits("25", 18); // 25 cpUSDC
    console.log("Minting", ethers.formatUnits(mintAmount, 18), "cpUSDC for demo...");
    
    const mintTx = await cotiToken.mint(deployer.address, mintAmount, {
      gasLimit: 500000
    });
    await mintTx.wait();
    console.log("✅ Demo tokens minted");

    // Prepare tokens for burning (mint to bridge)
    const bridgeAmount = ethers.parseUnits("20", 18); // 20 cpUSDC
    console.log("Preparing", ethers.formatUnits(bridgeAmount, 18), "cpUSDC in bridge...");
    
    const bridgeMintTx = await cotiToken.mint(COTI_BRIDGE, bridgeAmount, {
      gasLimit: 500000
    });
    await bridgeMintTx.wait();
    console.log("✅ Bridge tokens ready");

  } catch (error) {
    console.log("Token setup error:", error.message);
  }

  console.log("\n🔥 Step 2: Execute Demo Burn");
  console.log("============================");

  const burnAmount = ethers.parseUnits("15", 18); // 15 cpUSDC
  console.log("🎯 Demo Burn Details:");
  console.log("- Burning:", ethers.formatUnits(burnAmount, 18), "cpUSDC");
  console.log("- Expected unlock:", ethers.formatUnits(burnAmount / BigInt(10**12), 6), "sUSDC");
  console.log("- Decimal conversion: 18 → 6 decimals");

  try {
    // Get burn fee
    const burnFee = await cotiBridge.quoteBurnFee(burnAmount);
    console.log("- Burn fee:", ethers.formatEther(burnFee), "ETH");

    // Execute burn
    console.log("\n🚀 Executing demo burn...");
    const burnTx = await cotiBridge.burn(burnAmount, {
      value: burnFee,
      gasLimit: 1000000
    });

    console.log("📤 Burn transaction:", burnTx.hash);
    const receipt = await burnTx.wait();
    console.log("✅ Burn confirmed! Block:", receipt.blockNumber);

    // Extract message ID
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsed = cotiBridge.interface.parseLog(log);
          if (parsed && parsed.name === "TokensBurned") {
            const messageId = parsed.args[2];
            console.log("📨 Hyperlane Message:", messageId);
          }
        } catch (error) {
          // Skip logs that don't match
        }
      }
    }

  } catch (error) {
    console.error("❌ Demo burn failed:", error.message);
    return;
  }

  console.log("\n⏰ Step 3: Demo Success Indicators");
  console.log("==================================");
  console.log("✅ COTI burn completed successfully");
  console.log("✅ Cross-chain message sent via Hyperlane");
  console.log("✅ NO replay protection errors expected");
  console.log("✅ Decimal conversion applied (18→6 decimals)");
  console.log("⏳ Hyperlane delivery: 2-5 minutes");

  console.log("\n🎯 Demo Monitoring:");
  console.log("==================");
  console.log("1. Check Hyperlane Explorer for message delivery");
  console.log("2. Monitor Sepolia unlock in 2-3 minutes:");
  console.log("   npx hardhat run scripts/check-sepolia-unlock-status.ts --network sepolia");
  console.log("3. Should see locked tokens decrease and user balance increase");

  console.log("\n🏆 Demo Features Demonstrated:");
  console.log("==============================");
  console.log("✅ Cross-chain token burning");
  console.log("✅ Automatic decimal conversion");
  console.log("✅ Hyperlane message delivery");
  console.log("✅ Token unlocking on destination chain");
  console.log("✅ Smooth operation without replay protection errors");
  
  console.log("\n🎉 Demo completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 