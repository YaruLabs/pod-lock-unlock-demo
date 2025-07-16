import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Setting Up New Bridge with Locked Tokens");
  console.log("============================================");

  const [deployer] = await ethers.getSigners();
  console.log("Setting up with account:", deployer.address);

  // New contract addresses (without replay protection)
  const SEPOLIA_BRIDGE = "0x1F623C0A0487F1da20BcB5fb1BD48C0f296E0CE5";
  const SEPOLIA_TOKEN = "0x9d422b5ef943517eBdF5B4b5F36a9748B77D3e37";

  console.log("\n📋 Contract Addresses:");
  console.log("Sepolia Bridge (No Replay):", SEPOLIA_BRIDGE);
  console.log("Sepolia Token:", SEPOLIA_TOKEN);

  // Connect to Sepolia contracts
  const sepoliaBridge = await ethers.getContractAt("SepoliaBridge", SEPOLIA_BRIDGE);
  const sepoliaToken = await ethers.getContractAt("SepoliaToken", SEPOLIA_TOKEN);

  console.log("\n💰 Step 1: Check Current Status");
  console.log("===============================");

  try {
    const userBalance = await sepoliaToken.balanceOf(deployer.address);
    const lockedTokens = await sepoliaBridge.getLockedTokens(deployer.address);
    const bridgeBalance = await sepoliaBridge.getContractTokenBalance();

    console.log("User balance:", ethers.formatUnits(userBalance, 6), "sUSDC");
    console.log("User locked tokens:", ethers.formatUnits(lockedTokens, 6), "sUSDC");
    console.log("Bridge balance:", ethers.formatUnits(bridgeBalance, 6), "sUSDC");

  } catch (error) {
    console.log("❌ Error checking status:", error.message);
  }

  console.log("\n🔐 Step 2: Lock Tokens on New Bridge");
  console.log("====================================");

  const lockAmount = ethers.parseUnits("100", 6); // 100 sUSDC
  console.log("Locking", ethers.formatUnits(lockAmount, 6), "sUSDC on new bridge...");

  try {
    // First approve the bridge to spend our tokens
    console.log("Approving bridge to spend tokens...");
    const approveTx = await sepoliaToken.approve(SEPOLIA_BRIDGE, lockAmount);
    await approveTx.wait();
    console.log("✅ Approval confirmed");

    // Get lock fee quote
    const lockFee = await sepoliaBridge.quoteLockFee(lockAmount);
    console.log("Lock fee:", ethers.formatEther(lockFee), "ETH");

    // Lock tokens
    console.log("🔒 Locking tokens...");
    const lockTx = await sepoliaBridge.lock(lockAmount, {
      value: lockFee,
      gasLimit: 500000
    });

    console.log("📤 Lock transaction submitted:", lockTx.hash);
    const receipt = await lockTx.wait();
    console.log("✅ Lock transaction confirmed!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Extract message ID
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsed = sepoliaBridge.interface.parseLog(log);
          if (parsed && parsed.name === "TokensLocked") {
            const messageId = parsed.args[2];
            console.log("📨 Hyperlane Message ID:", messageId);
          }
        } catch (error) {
          // Skip logs that don't match
        }
      }
    }

  } catch (error) {
    console.error("❌ Lock failed:", error.message);
    return;
  }

  console.log("\n💰 Step 3: Verify New Status");
  console.log("============================");

  try {
    const userBalance = await sepoliaToken.balanceOf(deployer.address);
    const lockedTokens = await sepoliaBridge.getLockedTokens(deployer.address);
    const bridgeBalance = await sepoliaBridge.getContractTokenBalance();

    console.log("User balance:", ethers.formatUnits(userBalance, 6), "sUSDC");
    console.log("User locked tokens:", ethers.formatUnits(lockedTokens, 6), "sUSDC");
    console.log("Bridge balance:", ethers.formatUnits(bridgeBalance, 6), "sUSDC");

    console.log("\n✅ Bridge Setup Complete!");
    console.log("============================");
    console.log("✅ New bridge has locked tokens for testing");
    console.log("✅ Ready to test burn/unlock flow");
    console.log("✅ No replay protection - should work smoothly");

    console.log("\n🎯 Next Steps:");
    console.log("==============");
    console.log("1. Wait 2-5 minutes for COTI mint to complete");
    console.log("2. Test burn/unlock flow:");
    console.log("   npx hardhat run scripts/test-no-replay-burn-unlock.ts --network coti");
    console.log("3. Check unlock results:");
    console.log("   npx hardhat run scripts/check-sepolia-unlock-status.ts --network sepolia");

  } catch (error) {
    console.log("❌ Error checking final status:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 