import { ethers } from "hardhat";

const NEW_SEPOLIA_BRIDGE = "0xbd9Df6Da5EFEd31BEBD1709dD6F92F1Be17cE18C";
const SEPOLIA_TOKEN = "0x9d422b5ef943517eBdF5B4b5F36a9748B77D3e37";
const USER_ADDRESS = "0x30a6C9D1d70d41756673Cce044189577F0953a75";

async function main() {
  console.log("🔍 Quick Status Check");
  console.log("=====================");
  
  const [deployer] = await ethers.getSigners();
  const sepoliaBridge = await ethers.getContractAt("SepoliaBridge", NEW_SEPOLIA_BRIDGE);
  const sepoliaToken = await ethers.getContractAt("SepoliaToken", SEPOLIA_TOKEN);
  
  const lockedTokens = await sepoliaBridge.lockedTokens(USER_ADDRESS);
  const userBalance = await sepoliaToken.balanceOf(USER_ADDRESS);
  const bridgeBalance = await sepoliaToken.balanceOf(NEW_SEPOLIA_BRIDGE);
  
  console.log("\n💰 Current Status:");
  console.log(`Locked tokens: ${ethers.formatUnits(lockedTokens, 6)} sUSDC`);
  console.log(`User balance: ${ethers.formatUnits(userBalance, 6)} sUSDC`);
  console.log(`Bridge balance: ${ethers.formatUnits(bridgeBalance, 6)} sUSDC`);
  
  console.log("\n📊 Analysis:");
  console.log("Original locked: 110.0 sUSDC");
  console.log(`Current locked: ${ethers.formatUnits(lockedTokens, 6)} sUSDC`);
  const unlocked = BigInt("110000000") - lockedTokens;
  console.log(`Total unlocked: ${ethers.formatUnits(unlocked, 6)} sUSDC`);
  
  if (unlocked > 0) {
    console.log("\n✅ SUCCESS! Unlocks are working!");
    console.log("🎯 Decimal conversion fix is operational");
  } else {
    console.log("\n⏰ No unlocks detected yet");
  }
}

main().catch(console.error); 