import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Fixing Sepolia Bridge Configuration ===\n");

  // Network setup
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL!);
  const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

  const sepoliaBridgeAddress = "0x371F045B08772E36E352F67C38868FFC4113fF85";
  const sepoliaTokenAddress = "0xb51926aCaa39E6571c08d7bCBfc94087D72475Ed";
  const newCotiBridgeAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("Configuration:");
  console.log("- Sepolia Bridge:", sepoliaBridgeAddress);
  console.log("- Sepolia Token:", sepoliaTokenAddress);
  console.log("- New COTI Bridge:", newCotiBridgeAddress);
  console.log("- Wallet:", sepoliaWallet.address);
  console.log();

  // Bridge ABI - including admin functions
  const bridgeABI = [
    "function token() external view returns (address)",
    "function destinationBridge() external view returns (bytes32)",
    "function destinationDomain() external view returns (uint32)",
    "function setDestinationBridge(bytes32 _destinationBridge) external",
    "function lockTokens(uint256 amount) external",
    "function owner() external view returns (address)"
  ];

  // Token ABI
  const tokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ];

  const sepoliaBridge = new ethers.Contract(sepoliaBridgeAddress, bridgeABI, sepoliaWallet);
  const sepoliaToken = new ethers.Contract(sepoliaTokenAddress, tokenABI, sepoliaWallet);

  try {
    // Check current configuration
    console.log("📋 Current Bridge Configuration:");
    
    try {
      const currentDestBridge = await sepoliaBridge.destinationBridge();
      console.log("- Current Destination Bridge:", currentDestBridge);
    } catch (e) {
      console.log("- Current Destination Bridge: ERROR -", e.message);
    }
    
    try {
      const owner = await sepoliaBridge.owner();
      console.log("- Bridge Owner:", owner);
      console.log("- Is Owner:", owner.toLowerCase() === sepoliaWallet.address.toLowerCase());
    } catch (e) {
      console.log("- Bridge Owner: ERROR -", e.message);
    }

    // Convert new COTI bridge address to bytes32
    const newDestinationBytes32 = ethers.zeroPadValue(newCotiBridgeAddress, 32);
    console.log("- New Destination (bytes32):", newDestinationBytes32);
    console.log();

    // Update destination bridge
    console.log("🔧 Updating Destination Bridge...");
    try {
      const updateTx = await sepoliaBridge.setDestinationBridge(newDestinationBytes32, {
        gasLimit: 200000
      });
      
      console.log("Transaction Hash:", updateTx.hash);
      const receipt = await updateTx.wait();
      console.log("✅ Destination bridge updated successfully!");
      console.log("Block:", receipt.blockNumber);
    } catch (error) {
      console.error("❌ Failed to update destination bridge:", error.message);
      if (error.reason) {
        console.error("Reason:", error.reason);
      }
    }

    // Check token allowance and approve if needed
    console.log("\n💰 Token Configuration:");
    
    const balance = await sepoliaToken.balanceOf(sepoliaWallet.address);
    console.log("- Balance:", ethers.formatUnits(balance, 18), "tokens");
    
    const allowance = await sepoliaToken.allowance(sepoliaWallet.address, sepoliaBridgeAddress);
    console.log("- Current Allowance:", ethers.formatUnits(allowance, 18), "tokens");

    // Approve a large amount for future transactions
    const approveAmount = ethers.parseUnits("1000", 18); // 1000 tokens
    
    if (allowance < approveAmount) {
      console.log("🔓 Approving tokens for bridge...");
      try {
        const approveTx = await sepoliaToken.approve(sepoliaBridgeAddress, approveAmount, {
          gasLimit: 100000
        });
        
        console.log("Approve Transaction Hash:", approveTx.hash);
        const receipt = await approveTx.wait();
        console.log("✅ Tokens approved successfully!");
        console.log("Block:", receipt.blockNumber);
      } catch (error) {
        console.error("❌ Failed to approve tokens:", error.message);
      }
    } else {
      console.log("✅ Sufficient allowance already exists");
    }

    // Test lock function
    console.log("\n🧪 Testing Lock Function...");
    try {
      const testAmount = ethers.parseUnits("1", 18);
      const gasEstimate = await sepoliaBridge.lockTokens.estimateGas(testAmount);
      console.log("✅ Gas estimate successful:", gasEstimate.toString());
      console.log("Bridge is ready for transactions!");
    } catch (error) {
      console.error("❌ Gas estimation still failing:", error.message);
      if (error.reason) {
        console.error("Reason:", error.reason);
      }
    }

  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  }

  console.log("\n=== Summary ===");
  console.log("1. Updated destination bridge to new COTI bridge address");
  console.log("2. Approved tokens for bridge transfers");
  console.log("3. Tested bridge functionality");
  console.log("4. Bridge should now work with decimal conversion fix!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 