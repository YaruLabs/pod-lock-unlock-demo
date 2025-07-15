import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts to COTI testnet with account:", deployer.address);

  // Check account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("Account has no balance. Please fund the account first.");
  }

  try {
    // Deploy CotiToken
    console.log("Deploying CotiToken...");
    const CotiToken = await ethers.getContractFactory("CotiToken");
    
    const cotiToken = await CotiToken.deploy({
      gasLimit: 8000000, // Fixed gas limit
    });
    
    await cotiToken.waitForDeployment();
    const cotiTokenAddress = await cotiToken.getAddress();
    console.log("CotiToken deployed to:", cotiTokenAddress);

    // Deploy CotiBridge
    console.log("Deploying CotiBridge...");
    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    
    // COTI Hyperlane mailbox address
    const cotiMailboxAddress = "0x7FE7EA170cf08A25C2ff315814D96D93C311E692";
    
    const cotiBridge = await CotiBridge.deploy(cotiTokenAddress, cotiMailboxAddress, {
      gasLimit: 8000000, // Fixed gas limit
    });
    
    await cotiBridge.waitForDeployment();
    const cotiBridgeAddress = await cotiBridge.getAddress();
    console.log("CotiBridge deployed to:", cotiBridgeAddress);

    // Save deployment info
    const deploymentInfo = {
      network: "coti",
      contracts: {
        CotiToken: cotiTokenAddress,
        CotiBridge: cotiBridgeAddress,
      },
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
    };

    // Ensure deployments directory exists
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentsDir, "coti.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment info saved to deployments/coti.json");
    console.log("Deployment completed successfully!");

  } catch (error) {
    console.error("Deployment failed:", error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("pending block is not available")) {
        console.error("\nThis error suggests the COTI testnet RPC endpoint might not support pending blocks.");
        console.error("Please check the RPC URL or try using a different endpoint.");
      } else if (error.message.includes("insufficient funds")) {
        console.error("\nInsufficient funds for deployment. Please fund the account with COTI testnet tokens.");
      } else if (error.message.includes("network")) {
        console.error("\nNetwork connection issue. Please check the RPC URL and network status.");
      }
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 