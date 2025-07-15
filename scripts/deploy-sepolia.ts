import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts to Sepolia with account:", deployer.address);

  // Hyperlane Mailbox address on Sepolia
  const SEPOLIA_MAILBOX = "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766";
  const COTI_DOMAIN = 7082400; // COTI testnet domain ID
  
  // We'll need to update this after deploying the COTI contracts
  // For now, use a placeholder (32 bytes format)
  const COTI_BRIDGE_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";

  console.log("Deploying SepoliaToken...");
  
  const SepoliaToken = await ethers.getContractFactory("SepoliaToken");
  const sepoliaToken = await SepoliaToken.deploy();
  await sepoliaToken.waitForDeployment();
  const sepoliaTokenAddress = await sepoliaToken.getAddress();
  
  console.log("SepoliaToken deployed to:", sepoliaTokenAddress);

  console.log("Deploying SepoliaBridge...");
  
  const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
  const sepoliaBridge = await SepoliaBridge.deploy(
    SEPOLIA_MAILBOX,
    sepoliaTokenAddress,
    COTI_DOMAIN,
    COTI_BRIDGE_ADDRESS
  );
  await sepoliaBridge.waitForDeployment();
  const sepoliaBridgeAddress = await sepoliaBridge.getAddress();
  
  console.log("SepoliaBridge deployed to:", sepoliaBridgeAddress);

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    contracts: {
      SepoliaToken: sepoliaTokenAddress,
      SepoliaBridge: sepoliaBridgeAddress,
    },
    deployer: deployer.address,
    hyperlane: {
      mailbox: SEPOLIA_MAILBOX,
      cotiDomain: COTI_DOMAIN,
      cotiBridgeAddress: COTI_BRIDGE_ADDRESS,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentsDir, "sepolia.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployments/sepolia.json");
  console.log("\nNext steps:");
  console.log("1. Deploy CotiToken and CotiBridge to COTI testnet");
  console.log("2. Update COTI_BRIDGE_ADDRESS in this deployment");
  console.log("3. Update SEPOLIA_BRIDGE_ADDRESS in COTI deployment");
  console.log("4. Approve SepoliaToken for SepoliaBridge");
  
  // Approve the bridge to spend tokens (for demo purposes)
  console.log("\nApproving bridge to spend tokens...");
  const approveTx = await sepoliaToken.approve(sepoliaBridgeAddress, ethers.MaxUint256);
  await approveTx.wait();
  console.log("Bridge approved to spend tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 