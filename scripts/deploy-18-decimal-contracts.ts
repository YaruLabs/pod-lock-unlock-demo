import { ethers, network } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", network.name);
  
  // Deploy contracts based on network
  if (network.name === "sepolia") {
    console.log("\n=== Deploying Sepolia Contracts (18 decimals) ===");
    
    // Deploy SepoliaToken with 18 decimals
    console.log("Deploying SepoliaToken...");
    const SepoliaToken = await ethers.getContractFactory("SepoliaToken");
    const sepoliaToken = await SepoliaToken.deploy();
    await sepoliaToken.waitForDeployment();
    const sepoliaTokenAddress = await sepoliaToken.getAddress();
    console.log("SepoliaToken deployed to:", sepoliaTokenAddress);
    
    // Deploy SepoliaBridge
    console.log("Deploying SepoliaBridge...");
    const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
    const mailboxAddress = "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766"; // Sepolia Hyperlane Mailbox
    const cotiDomain = 7082400; // COTI domain
    
    const sepoliaBridge = await SepoliaBridge.deploy(
      mailboxAddress,
      sepoliaTokenAddress,
      cotiDomain,
      ethers.ZeroHash // Will be updated after COTI bridge deployment
    );
    await sepoliaBridge.waitForDeployment();
    const sepoliaBridgeAddress = await sepoliaBridge.getAddress();
    console.log("SepoliaBridge deployed to:", sepoliaBridgeAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: "sepolia",
      timestamp: new Date().toISOString(),
      contracts: {
        SepoliaToken: sepoliaTokenAddress,
        SepoliaBridge: sepoliaBridgeAddress
      },
      configuration: {
        tokenDecimals: 18,
        mailboxAddress,
        cotiDomain,
        replayProtection: false
      },
      deployer: deployer.address
    };
    
    fs.writeFileSync(
      `deployments/sepolia-18-decimals.json`,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n=== Sepolia Deployment Summary ===");
    console.log("SepoliaToken (18 decimals):", sepoliaTokenAddress);
    console.log("SepoliaBridge:", sepoliaBridgeAddress);
    
  } else if (network.name === "coti") {
    console.log("\n=== Deploying COTI Contracts (18 decimals) ===");
    
    // Deploy CotiToken (already 18 decimals)
    console.log("Deploying CotiToken...");
    const CotiToken = await ethers.getContractFactory("CotiToken");
    const cotiToken = await CotiToken.deploy();
    await cotiToken.waitForDeployment();
    const cotiTokenAddress = await cotiToken.getAddress();
    console.log("CotiToken deployed to:", cotiTokenAddress);
    
    // Deploy CotiBridge
    console.log("Deploying CotiBridge...");
    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const mailboxAddress = "0x25B9A1aD2dB103C4C5B1E5A7Fb2045E5d1bE8664"; // COTI Hyperlane Mailbox
    const sepoliaDomain = 11155111; // Sepolia domain
    
    const cotiBridge = await CotiBridge.deploy(
      cotiTokenAddress,
      mailboxAddress
    );
    await cotiBridge.waitForDeployment();
    const cotiBridgeAddress = await cotiBridge.getAddress();
    console.log("CotiBridge deployed to:", cotiBridgeAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: "coti",
      timestamp: new Date().toISOString(),
      contracts: {
        CotiToken: cotiTokenAddress,
        CotiBridge: cotiBridgeAddress
      },
      configuration: {
        tokenDecimals: 18,
        mailboxAddress,
        sepoliaDomain,
        replayProtection: false
      },
      deployer: deployer.address
    };
    
    fs.writeFileSync(
      `deployments/coti-18-decimals.json`,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n=== COTI Deployment Summary ===");
    console.log("CotiToken (18 decimals):", cotiTokenAddress);
    console.log("CotiBridge:", cotiBridgeAddress);
    
  } else {
    console.log("Unknown network:", network.name);
    console.log("Supported networks: sepolia, coti");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 