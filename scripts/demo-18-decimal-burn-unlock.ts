import { ethers } from "hardhat";

async function main() {
  console.log("🎯 DEMO: 18-Decimal Burn & Unlock Flow");
  console.log("=====================================");
  console.log("Demo with account:", (await ethers.getSigners())[0].address);
  
  // New 18-decimal contract addresses
  const cotiTokenAddress = "0xa4661A5B5DF03840024e144D123a274969DdeBA2";     // 18 decimals
  const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";
  const sepoliaBridgeAddress = "0x92102DD1FED780957826aD1623198056f985774f";  // NEW 18-decimal bridge
  const sepoliaTokenAddress = "0x3738B0638CAd52c6D9C0ea4eEE514C390f9Afe57";    // NEW 18-decimal token
  
  console.log("\n📋 18-Decimal Contract Addresses:");
  console.log("COTI Token (18 dec):", cotiTokenAddress);
  console.log("COTI Bridge:", cotiBridgeAddress);
  console.log("Sepolia Bridge (18 dec):", sepoliaBridgeAddress);
  console.log("Sepolia Token (18 dec):", sepoliaTokenAddress);
  
  const [deployer] = await ethers.getSigners();
  
  // Connect to contracts
  const cotiToken = await ethers.getContractAt("CotiToken", cotiTokenAddress);
  const cotiBridge = await ethers.getContractAt("CotiBridge", cotiBridgeAddress);
  
  console.log("\n💰 Step 1: Check Current State");
  console.log("===============================");
  
  // Check token decimals
  const decimals = await cotiToken.decimals();
  console.log("COTI Token decimals:", decimals.toString());
  
  // Check balance
  const balance = await cotiToken['balanceOf(address)'](deployer.address);
  console.log("Current balance:", ethers.formatUnits(balance, 18), "cpUSDC");
  
  // Demo burn amount (12 tokens with 18 decimals)
  const burnAmount = ethers.parseUnits("12", 18);
  console.log("Planned burn amount:", ethers.formatUnits(burnAmount, 18), "cpUSDC");
  
  console.log("\n🔥 Step 2: Execute Burn for Cross-Chain Unlock");
  console.log("==============================================");
  
  // Get fee quote
  const fee = await cotiBridge.quoteBurnFee(burnAmount);
  console.log("Cross-chain fee:", ethers.formatEther(fee), "ETH");
  
  // Mint tokens to bridge for burning
  console.log("Setting up tokens for burn...");
  const mintTx = await cotiToken.mint(cotiBridgeAddress, burnAmount);
  await mintTx.wait();
  console.log("✅ Tokens minted to bridge");
  
  // Execute burn and cross-chain message
  console.log("🚀 Executing 18-decimal burn...");
  console.log("🎯 Demo Burn Details:");
  console.log("- Burning:", ethers.formatUnits(burnAmount, 18), "cpUSDC");
  console.log("- Expected unlock:", ethers.formatUnits(burnAmount, 18), "sUSDC (same amount - no conversion!)");
  console.log("- Decimal handling: 18 → 18 decimals (no conversion)");
  console.log("- Burn fee:", ethers.formatEther(fee), "ETH");
  
  const burnTx = await cotiBridge.burn(burnAmount, { 
    value: fee,
    gasLimit: 300000
  });
  
  console.log("📤 Burn transaction:", burnTx.hash);
  
  const receipt = await burnTx.wait();
  console.log("✅ Burn confirmed! Block:", receipt?.blockNumber);
  console.log("Gas used:", receipt?.gasUsed.toString());
  
  // Extract message ID from events if available
  console.log("📨 Cross-chain message sent via Hyperlane");
  
  console.log("\n⏰ Step 3: 18-Decimal Demo Success");
  console.log("==================================");
  console.log("✅ COTI burn completed successfully");
  console.log("✅ Cross-chain message sent to NEW Sepolia bridge");
  console.log("✅ NO decimal conversion needed (18→18)");
  console.log("✅ Clean 1:1 amount mapping");
  console.log("⏳ Hyperlane delivery: 2-5 minutes");
  
  console.log("\n🎯 18-Decimal Demo Monitoring:");
  console.log("==============================");
  console.log("1. Check Hyperlane Explorer for message delivery");
  console.log("2. Monitor NEW Sepolia unlock in 2-3 minutes:");
  console.log("   npx hardhat run scripts/check-18-decimal-status.ts --network sepolia");
  console.log("3. Should see 12.0 sUSDC unlocked (exact same amount)");
  
  console.log("\n🏆 18-Decimal Demo Features:");
  console.log("============================");
  console.log("✅ Cross-chain token burning (18 decimals)");
  console.log("✅ NO decimal conversion complexity");
  console.log("✅ Clean 1:1 amount mapping");
  console.log("✅ Hyperlane message to NEW Sepolia bridge");
  console.log("✅ Predictable unlock amounts");
  console.log("✅ Simplified bridge logic");
  
  console.log("\n🎉 18-Decimal burn demo completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 