import { ethers, network } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("Configuring 18-decimal bridges...");
  console.log("Network:", network.name);

  // Load deployment files
  let sepoliaDeployment: any;
  let cotiDeployment: any;

  try {
    sepoliaDeployment = JSON.parse(fs.readFileSync("deployments/sepolia-18-decimals.json", "utf8"));
    cotiDeployment = JSON.parse(fs.readFileSync("deployments/coti-18-decimals.json", "utf8"));
  } catch (error) {
    console.error("Error loading deployment files. Make sure to deploy contracts first.");
    console.error("Run: npx hardhat run scripts/deploy-18-decimal-contracts.ts --network sepolia");
    console.error("And: npx hardhat run scripts/deploy-18-decimal-contracts.ts --network coti");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Configuring with account:", deployer.address);

  if (network.name === "sepolia") {
    console.log("\n=== Configuring Sepolia Bridge ===");
    
    const sepoliaBridgeAddress = sepoliaDeployment.contracts.SepoliaBridge;
    const cotiBridgeAddress = cotiDeployment.contracts.CotiBridge;
    
    console.log("Sepolia Bridge:", sepoliaBridgeAddress);
    console.log("Setting COTI Bridge:", cotiBridgeAddress);
    
    const sepoliaBridge = await ethers.getContractAt("SepoliaBridge", sepoliaBridgeAddress);
    
    // Convert COTI bridge address to bytes32
    const cotiBridgeBytes32 = ethers.zeroPadValue(cotiBridgeAddress, 32);
    
    const tx = await sepoliaBridge.updateCotiBridgeAddress(cotiBridgeBytes32);
    await tx.wait();
    
    console.log("✅ Sepolia bridge configured successfully");
    console.log("Transaction hash:", tx.hash);
    
  } else if (network.name === "coti") {
    console.log("\n=== Configuring COTI Bridge ===");
    
    const cotiBridgeAddress = cotiDeployment.contracts.CotiBridge;
    const sepoliaBridgeAddress = sepoliaDeployment.contracts.SepoliaBridge;
    
    console.log("COTI Bridge:", cotiBridgeAddress);
    console.log("Setting Sepolia Bridge:", sepoliaBridgeAddress);
    
    const cotiBridge = await ethers.getContractAt("CotiBridge", cotiBridgeAddress);
    
    // Convert Sepolia bridge address to bytes32
    const sepoliaBridgeBytes32 = ethers.zeroPadValue(sepoliaBridgeAddress, 32);
    
    const tx = await cotiBridge.updateSepoliaBridgeAddress(sepoliaBridgeBytes32);
    await tx.wait();
    
    console.log("✅ COTI bridge configured successfully");
    console.log("Transaction hash:", tx.hash);
    
  } else {
    console.log("Unknown network:", network.name);
    console.log("Supported networks: sepolia, coti");
    process.exit(1);
  }

  console.log("\n=== Configuration Summary ===");
  console.log("Both tokens now use 18 decimals");
  console.log("No decimal conversion in bridge logic");
  console.log("Replay protection: disabled");
  console.log("Bridge addresses configured for cross-chain communication");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 