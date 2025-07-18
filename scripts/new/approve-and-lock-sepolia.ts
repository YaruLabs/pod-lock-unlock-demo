import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Usage:
// npx hardhat run scripts/new/approve-and-lock-sepolia.ts --network sepolia

async function main() {
  console.log("🔵 Approve and Lock on Sepolia");
  console.log("==============================");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Load deployment info
  const deploymentFile = path.join("deployments", "sepolia.json");
  let tokenAddress: string, bridgeAddress: string;
  try {
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    tokenAddress = deployment.contracts["SepoliaToken"];
    bridgeAddress = deployment.contracts["SepoliaBridge"];
    if (!tokenAddress || !bridgeAddress) throw new Error("Token or bridge address not found in deployment file");
  } catch (e) {
    throw new Error(`Failed to load deployment file or addresses: ${e}`);
  }

  console.log(`Token address: ${tokenAddress}`);
  console.log(`Bridge address: ${bridgeAddress}`);

  try {
    const token = await ethers.getContractAt("SepoliaToken", tokenAddress);
    const bridge = await ethers.getContractAt("SepoliaBridge", bridgeAddress);

    // Fetch decimals from token contract
    const decimals = await token.decimals();
    console.log(`Token decimals: ${decimals}`);

    // Approve 100 tokens to bridge
    const approveAmount = ethers.parseUnits("100", decimals);
    console.log(`Approving ${ethers.formatUnits(approveAmount, decimals)} tokens to bridge...`);
    const approveTx = await token.approve(bridgeAddress, approveAmount);
    console.log("Approve tx hash:", approveTx.hash);
    await approveTx.wait();
    console.log("✅ Approve confirmed");

    // Call lock with 100 tokens and 0.001 ETH
    const ethValue = ethers.parseEther("0.001");
    console.log(`Calling lock(${ethers.formatUnits(approveAmount, decimals)}) with 0.001 ETH...`);
    const lockTx = await bridge.lock(approveAmount, { value: ethValue });
    console.log("Lock tx hash:", lockTx.hash);
    await lockTx.wait();
    console.log("✅ Lock confirmed");

    // Print balances
    const tokenBalance = await token.balanceOf(deployer.address);
    const ethBalance = await deployer.provider.getBalance(deployer.address);
    console.log("New token balance:", ethers.formatUnits(tokenBalance, decimals));
    console.log("New ETH balance:", ethers.formatEther(ethBalance));
  } catch (error: any) {
    console.error("❌ Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 