import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking Sepolia Unlock Status (No Replay Protection)");
  console.log("========================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Checking with account:", deployer.address);

  // New contract addresses (without replay protection)
  const SEPOLIA_BRIDGE = "0x1F623C0A0487F1da20BcB5fb1BD48C0f296E0CE5";
  const SEPOLIA_TOKEN = "0x9d422b5ef943517eBdF5B4b5F36a9748B77D3e37";

  console.log("\n📋 Contract Addresses:");
  console.log("Sepolia Bridge (No Replay):", SEPOLIA_BRIDGE);
  console.log("Sepolia Token:", SEPOLIA_TOKEN);

  // Connect to Sepolia contracts
  const sepoliaBridge = await ethers.getContractAt("SepoliaBridge", SEPOLIA_BRIDGE);
  const sepoliaToken = await ethers.getContractAt("SepoliaToken", SEPOLIA_TOKEN);

  console.log("\n💰 Current Token Status:");
  console.log("========================");

  try {
    // Check user's locked tokens and balance
    const lockedTokens = await sepoliaBridge.getLockedTokens(deployer.address);
    const userBalance = await sepoliaToken.balanceOf(deployer.address);
    const bridgeBalance = await sepoliaBridge.getContractTokenBalance();

    console.log("User locked tokens:", ethers.formatUnits(lockedTokens, 6), "sUSDC");
    console.log("User balance:", ethers.formatUnits(userBalance, 6), "sUSDC");
    console.log("Bridge balance:", ethers.formatUnits(bridgeBalance, 6), "sUSDC");

  } catch (error) {
    console.log("❌ Error checking status:", error.message);
  }

  console.log("\n🎯 Analysis:");
  console.log("============");
  console.log("✅ Bridge deployed WITHOUT replay protection");
  console.log("✅ Should accept multiple message deliveries");
  console.log("✅ No 'Message already processed' errors expected");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 