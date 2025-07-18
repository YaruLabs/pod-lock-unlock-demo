import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// npx hardhat run scripts/new/mint-test.ts --network sepolia
// npx hardhat run scripts/new/mint-test.ts --network coti

async function main() {
  console.log("🎯 Simple Token Mint Test");
  console.log("========================");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Determine network and deployment file
  const networkInfo = await ethers.provider.getNetwork();
  const SEPOLIA_CHAIN_ID = 11155111n;
  const COTI_CHAIN_ID = 7082400n;

  let deploymentFile: string;
  let tokenKey: string;
  let networkName: string;

  if (networkInfo.chainId === SEPOLIA_CHAIN_ID) {
    deploymentFile = path.join("deployments", "sepolia.json");
    tokenKey = "SepoliaToken";
    networkName = "sepolia";
  } else if (networkInfo.chainId === COTI_CHAIN_ID) {
    deploymentFile = path.join("deployments", "coti.json");
    tokenKey = "CotiToken";
    networkName = "coti";
  } else {
    throw new Error(`Unsupported network chainId: ${networkInfo.chainId}`);
  }

  // Load deployment file and get token address
  let tokenAddress: string;
  try {
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    tokenAddress = deployment.contracts[tokenKey];
    if (!tokenAddress) throw new Error(`Token address not found for key ${tokenKey}`);
  } catch (e) {
    throw new Error(`Failed to load deployment file or token address: ${e}`);
  }

  console.log(`Network: ${networkName}`);
  console.log(`Token contract: ${tokenKey}`);
  console.log(`Token address: ${tokenAddress}`);

  try {
    const token = await ethers.getContractAt(tokenKey, tokenAddress);
    console.log("✅ Connected to token contract");

    // Check current balance
    const currentBalance = await token['balanceOf(address)'](deployer.address);
    console.log("Current balance:", ethers.formatUnits(currentBalance, 6));

    // Check ETH balance
    const ethBalance = await deployer.provider!.getBalance(deployer.address);
    console.log("ETH balance:", ethers.formatEther(ethBalance), "ETH");

    // Mint 1000 tokens
    const mintAmount = ethers.parseUnits("1000", 6);
    console.log("Attempting to mint:", ethers.formatUnits(mintAmount, 6));

    let mintTx;
    if (networkInfo.chainId === COTI_CHAIN_ID) {
      // COTI: Use fixed gas settings as in configure-bridges.ts
      mintTx = await token.mint(deployer.address, mintAmount, {
        gasLimit: 300000,
        gasPrice: ethers.parseUnits("1", "gwei")
      });
    } else {
      // Sepolia: Let ethers/Hardhat estimate gas settings automatically
      mintTx = await token.mint(deployer.address, mintAmount);
    }

    console.log("Mint tx hash:", mintTx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await mintTx.wait();
    if (receipt?.status === 1) {
      console.log("✅ Mint successful!");
      console.log("Gas used:", receipt.gasUsed.toString());
      const newBalance = await token['balanceOf(address)'](deployer.address);
      console.log("New balance:", ethers.formatUnits(newBalance, 6));
      console.log("\n🎉 Tokens minted successfully!");
    } else {
      console.log("❌ Mint transaction failed");
    }
  } catch (error: any) {
    console.error("❌ Mint error:", error.message);
    if (error.message.includes("execution reverted")) {
      console.log("💡 This might be due to contract requirements or initialization");
    } else if (error.message.includes("gas")) {
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