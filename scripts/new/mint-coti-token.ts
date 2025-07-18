import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Usage:
// npx hardhat run scripts/new/mint-coti-token.ts --network coti

async function main() {
  console.log("🎯 COTI Token Mint Script");
  console.log("========================");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Load CotiToken address from deployments
  const deploymentFile = path.join("deployments", "coti.json");
  let tokenAddress: string;
  try {
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    tokenAddress = deployment.contracts["CotiToken"];
    if (!tokenAddress) throw new Error("CotiToken address not found in deployment file");
  } catch (e) {
    throw new Error(`Failed to load deployment file or token address: ${e}`);
  }

  console.log(`Token address: ${tokenAddress}`);

  try {
    const token = await ethers.getContractAt("CotiToken", tokenAddress);
    console.log("✅ Connected to CotiToken contract");

    // Check current balance
    const currentBalance = await token["balanceOf(address)"](deployer.address);
    console.log("Current balance:", ethers.formatUnits(currentBalance, 6));

    // Mint 1000 tokens
    const mintAmount = ethers.parseUnits("1000", 6);
    console.log("Attempting to mint:", mintAmount,ethers.formatUnits(mintAmount, 6));

    // Fix gas settings for COTI network compatibility
    const mintTx = await token.mint(deployer.address, mintAmount, {
      gasLimit: 300000,
      gasPrice: ethers.parseUnits("1", "gwei")
    });
    console.log("Mint tx hash:", mintTx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await mintTx.wait();
    if (receipt?.status === 1) {
      console.log("✅ Mint successful!");
      console.log("Gas used:", receipt.gasUsed.toString());
      const newBalance = await token["balanceOf(address)"](deployer.address);
      console.log("New balance:", ethers.formatUnits(newBalance, 6));
      console.log("\n🎉 Tokens minted successfully!");
    } else {
      console.log("❌ Mint transaction failed");
    }
  } catch (error: any) {
    console.error("❌ Mint error (full object):", error);
    if (error.message && error.message.includes("execution reverted")) {
      console.log("💡 This might be due to contract requirements or initialization");
    } else if (error.message && error.message.includes("gas")) {
      console.log("💡 Try adjusting gas settings");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 