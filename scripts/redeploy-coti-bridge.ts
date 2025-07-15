import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Redeploying CotiBridge for testing with account:", deployer.address);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const cotiDeploymentPath = path.join(deploymentsDir, "coti.json");
  
  if (!fs.existsSync(cotiDeploymentPath)) {
    console.error("COTI deployment file not found. Please deploy contracts first.");
    process.exit(1);
  }
  
  const cotiDeployment = JSON.parse(fs.readFileSync(cotiDeploymentPath, "utf8"));
  
  console.log("Current COTI Token:", cotiDeployment.contracts.CotiToken);

  // COTI Hyperlane mailbox address (provided by user)
  const cotiMailboxAddress = "0x7FE7EA170cf08A25C2ff315814D96D93C311E692";
  
  console.log("Using COTI Mailbox:", cotiMailboxAddress);

  try {
    // Deploy CotiBridge with gas configuration
    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    console.log("Deploying CotiBridge...");
    
    const cotiBridge = await CotiBridge.deploy(
      cotiDeployment.contracts.CotiToken,
      cotiMailboxAddress,
      {
        gasLimit: 5000000,
        gasPrice: ethers.parseUnits("20", "gwei")
      }
    );
    
    console.log("Waiting for deployment...");
    await cotiBridge.waitForDeployment();
    const cotiBridgeAddress = await cotiBridge.getAddress();
    
    console.log("New CotiBridge deployed to:", cotiBridgeAddress);

    // Update deployment file
    cotiDeployment.contracts.CotiBridge = cotiBridgeAddress;
    cotiDeployment.mailbox = cotiMailboxAddress;
    cotiDeployment.lastUpdate = new Date().toISOString();
    
    fs.writeFileSync(cotiDeploymentPath, JSON.stringify(cotiDeployment, null, 2));
    
    console.log("✅ Deployment complete!");
    console.log("📋 Updated deployment file:", cotiDeploymentPath);
    
  } catch (error) {
    console.error("Deployment failed:", error);
    
    // Try with lower gas price
    console.log("Retrying with lower gas price...");
    try {
      const CotiBridge = await ethers.getContractFactory("CotiBridge");
      const cotiBridge = await CotiBridge.deploy(
        cotiDeployment.contracts.CotiToken,
        cotiMailboxAddress,
        {
          gasLimit: 3000000,
          gasPrice: ethers.parseUnits("10", "gwei")
        }
      );
      
      await cotiBridge.waitForDeployment();
      const cotiBridgeAddress = await cotiBridge.getAddress();
      
      console.log("New CotiBridge deployed to:", cotiBridgeAddress);

      // Update deployment file
      cotiDeployment.contracts.CotiBridge = cotiBridgeAddress;
      cotiDeployment.mailbox = cotiMailboxAddress;
      cotiDeployment.lastUpdate = new Date().toISOString();
      
      fs.writeFileSync(cotiDeploymentPath, JSON.stringify(cotiDeployment, null, 2));
      
      console.log("✅ Deployment complete!");
      console.log("📋 Updated deployment file:", cotiDeploymentPath);
      
    } catch (retryError) {
      console.error("Retry also failed:", retryError);
      throw retryError;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 