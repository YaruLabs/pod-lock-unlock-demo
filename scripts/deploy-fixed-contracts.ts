import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Fixed Bridge Contracts");
  console.log("===================================");
  console.log("With improved error handling - no more silent failures!");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  
  try {
    if (network.chainId === 11155111n) {
      // Deploy to Sepolia
      console.log("\n🔵 Deploying to Sepolia Network");
      console.log("===============================");
      
      // Deploy SepoliaToken (18 decimals)
      console.log("Deploying SepoliaToken...");
      const SepoliaToken = await ethers.getContractFactory("SepoliaToken");
      const sepoliaToken = await SepoliaToken.deploy();
      await sepoliaToken.waitForDeployment();
      const sepoliaTokenAddress = await sepoliaToken.getAddress();
      console.log("✅ SepoliaToken deployed:", sepoliaTokenAddress);
      
      // Deploy SepoliaBridge
      console.log("Deploying SepoliaBridge...");
      const sepoliaMailbox = "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766"; // Sepolia Hyperlane mailbox
      const cotiDomain = 7082400; // COTI domain ID
      const cotiBridgeAddress = "0x0000000000000000000000000000000000000000000000000000000000000000"; // Will configure later
      
      const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
      const sepoliaBridge = await SepoliaBridge.deploy(
        sepoliaMailbox,
        sepoliaTokenAddress, 
        cotiDomain,
        cotiBridgeAddress
      );
      await sepoliaBridge.waitForDeployment();
      const sepoliaBridgeAddress = await sepoliaBridge.getAddress();
      console.log("✅ SepoliaBridge deployed:", sepoliaBridgeAddress);
      
      // Verify 18 decimals
      const decimals = await sepoliaToken.decimals();
      console.log("Token decimals:", decimals.toString());
      
      console.log("\n📋 Sepolia Deployment Summary:");
      console.log("=============================");
      console.log("SepoliaToken:", sepoliaTokenAddress);
      console.log("SepoliaBridge:", sepoliaBridgeAddress);
      console.log("Hyperlane Mailbox:", sepoliaMailbox);
      console.log("✅ Fixed error handling implemented");
      
    } else if (network.chainId === 7082400n) {
      // Deploy to COTI
      console.log("\n🟢 Deploying to COTI Network");
      console.log("=============================");
      
      // Deploy CotiToken (18 decimals with privacy)
      console.log("Deploying CotiToken...");
      const CotiToken = await ethers.getContractFactory("CotiToken");
      const cotiToken = await CotiToken.deploy();
      await cotiToken.waitForDeployment();
      const cotiTokenAddress = await cotiToken.getAddress();
      console.log("✅ CotiToken deployed:", cotiTokenAddress);
      
      // Deploy CotiBridge
      console.log("Deploying CotiBridge...");
      const cotiMailbox = "0x7FE7EA170cf08A25C2ff315814D96D93C311E692"; // COTI Hyperlane mailbox
      const CotiBridge = await ethers.getContractFactory("CotiBridge");
      const cotiBridge = await CotiBridge.deploy(cotiTokenAddress, cotiMailbox);
      await cotiBridge.waitForDeployment();
      const cotiBridgeAddress = await cotiBridge.getAddress();
      console.log("✅ CotiBridge deployed:", cotiBridgeAddress);
      
      // Verify 18 decimals
      const decimals = await cotiToken.decimals();
      console.log("Token decimals:", decimals.toString());
      
      console.log("\n📋 COTI Deployment Summary:");
      console.log("===========================");
      console.log("CotiToken:", cotiTokenAddress);
      console.log("CotiBridge:", cotiBridgeAddress);
      console.log("Hyperlane Mailbox:", cotiMailbox);
      console.log("✅ Fixed error handling implemented");
      
    } else {
      console.log("❌ Unsupported network. Use --network sepolia or --network coti");
      return;
    }
    
    console.log("\n🎉 Deployment Successful!");
    console.log("=========================");
    console.log("✅ Contracts deployed with improved error handling");
    console.log("✅ No more silent failures");
    console.log("✅ Comprehensive error events added");
    console.log("✅ Production-ready error handling");
    
    console.log("\n🔧 Next Steps:");
    console.log("==============");
    console.log("1. Deploy on both networks");
    console.log("2. Configure bridge addresses");
    console.log("3. Test error handling scenarios");
    console.log("4. Monitor new error events");
    
  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Need more ETH for deployment");
    } else if (error.message.includes("nonce")) {
      console.log("💡 Nonce issue - try again");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 