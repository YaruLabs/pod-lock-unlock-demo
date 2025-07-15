import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const sepoliaDeploymentPath = path.join(deploymentsDir, "sepolia.json");
  const cotiDeploymentPath = path.join(deploymentsDir, "coti.json");
  
  if (!fs.existsSync(sepoliaDeploymentPath) || !fs.existsSync(cotiDeploymentPath)) {
    console.error("Deployment files not found. Please deploy contracts first.");
    process.exit(1);
  }
  
  const sepoliaDeployment = JSON.parse(fs.readFileSync(sepoliaDeploymentPath, "utf8"));
  const cotiDeployment = JSON.parse(fs.readFileSync(cotiDeploymentPath, "utf8"));
  
  console.log("Updating bridge addresses...");
  console.log("Sepolia Bridge:", sepoliaDeployment.contracts.SepoliaBridge);
  console.log("COTI Bridge:", cotiDeployment.contracts.CotiBridge);
  
  // Convert addresses to 32-byte format for Hyperlane
  const sepoliaBridgeAddress = "0x000000000000000000000000" + sepoliaDeployment.contracts.SepoliaBridge.slice(2);
  const cotiBridgeAddress = "0x000000000000000000000000" + cotiDeployment.contracts.CotiBridge.slice(2);
  
  console.log("Sepolia bridge address (32 bytes):", sepoliaBridgeAddress);
  console.log("COTI bridge address (32 bytes):", cotiBridgeAddress);
  
  // Update Sepolia bridge contract
  console.log("\nUpdating Sepolia Bridge...");
  const sepoliaBridge = await ethers.getContractAt("SepoliaBridge", sepoliaDeployment.contracts.SepoliaBridge);
  
  const updateSepoliaTx = await sepoliaBridge.updateCotiBridgeAddress(cotiBridgeAddress);
  await updateSepoliaTx.wait();
  console.log("Sepolia bridge updated successfully");
  
  // Note: CotiBridge doesn't need to store Sepolia bridge address in this minimal implementation
  // It just handles incoming messages from any authorized sender
  console.log("\nCOTI Bridge doesn't need address update (handles all incoming messages)");
  
  // Update deployment files
  sepoliaDeployment.hyperlane.cotiBridgeAddress = cotiBridgeAddress;
  
  // Add hyperlane info to COTI deployment if it doesn't exist
  if (!cotiDeployment.hyperlane) {
    cotiDeployment.hyperlane = {
      sepoliaDomain: 11155111,
      sepoliaBridgeAddress: sepoliaBridgeAddress
    };
  } else {
    cotiDeployment.hyperlane.sepoliaBridgeAddress = sepoliaBridgeAddress;
  }
  
  fs.writeFileSync(sepoliaDeploymentPath, JSON.stringify(sepoliaDeployment, null, 2));
  fs.writeFileSync(cotiDeploymentPath, JSON.stringify(cotiDeployment, null, 2));
  
  console.log("\n✅ Bridge addresses updated successfully!");
  console.log("Contracts are now ready for cross-chain communication.");
  console.log("\nDeployment Summary:");
  console.log("Sepolia Token:", sepoliaDeployment.contracts.SepoliaToken);
  console.log("Sepolia Bridge:", sepoliaDeployment.contracts.SepoliaBridge);
  console.log("COTI Token:", cotiDeployment.contracts.CotiToken);
  console.log("COTI Bridge:", cotiDeployment.contracts.CotiBridge);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 