import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Checking Sepolia Bridge Status ===\n");

  // Network setup
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL!);
  const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

  const sepoliaBridgeAddress = "0x371F045B08772E36E352F67C38868FFC4113fF85";
  const sepoliaTokenAddress = "0xb51926aCaa39E6571c08d7bCBfc94087D72475Ed";

  console.log("Checking:");
  console.log("- Bridge:", sepoliaBridgeAddress);
  console.log("- Token:", sepoliaTokenAddress);
  console.log("- Wallet:", sepoliaWallet.address);
  console.log();

  // Bridge ABI
  const bridgeABI = [
    "function token() external view returns (address)",
    "function mailbox() external view returns (address)",
    "function destinationBridge() external view returns (bytes32)",
    "function destinationDomain() external view returns (uint32)",
    "function lockTokens(uint256 amount) external"
  ];

  const sepoliaBridge = new ethers.Contract(sepoliaBridgeAddress, bridgeABI, sepoliaProvider);

  try {
    console.log("📋 Bridge Configuration:");
    
    const tokenAddr = await sepoliaBridge.token();
    console.log("- Token Address:", tokenAddr);
    
    const mailboxAddr = await sepoliaBridge.mailbox();
    console.log("- Mailbox Address:", mailboxAddr);
    
    const destBridge = await sepoliaBridge.destinationBridge();
    console.log("- Destination Bridge:", destBridge);
    
    const destDomain = await sepoliaBridge.destinationDomain();
    console.log("- Destination Domain:", destDomain.toString());
    
    console.log();
    
    // Check if addresses match
    console.log("✅ Configuration Check:");
    console.log("- Token matches:", tokenAddr.toLowerCase() === sepoliaTokenAddress.toLowerCase());
    console.log("- Destination bridge set:", destBridge !== "0x0000000000000000000000000000000000000000000000000000000000000000");
    
  } catch (error) {
    console.error("❌ Error checking bridge configuration:", error.message);
  }

  // Check token contract
  const tokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  const sepoliaToken = new ethers.Contract(sepoliaTokenAddress, tokenABI, sepoliaProvider);

  try {
    console.log("💰 Token Status:");
    
    const balance = await sepoliaToken.balanceOf(sepoliaWallet.address);
    console.log("- Balance:", ethers.formatUnits(balance, 18), "tokens");
    
    const allowance = await sepoliaToken.allowance(sepoliaWallet.address, sepoliaBridgeAddress);
    console.log("- Allowance:", ethers.formatUnits(allowance, 18), "tokens");
    
  } catch (error) {
    console.error("❌ Error checking token:", error.message);
  }

  // Try to estimate gas for a small lock operation
  try {
    console.log("\n🧪 Testing Lock Function:");
    const testAmount = ethers.parseUnits("1", 18);
    
    const gasEstimate = await sepoliaBridge.lockTokens.estimateGas(testAmount);
    console.log("✅ Gas estimate successful:", gasEstimate.toString());
    
  } catch (error) {
    console.error("❌ Gas estimation failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.data) {
      console.error("Data:", error.data);
    }
  }

  console.log("\n=== Summary ===");
  console.log("If the bridge configuration looks correct but gas estimation fails,");
  console.log("the issue might be:");
  console.log("1. Insufficient token allowance");
  console.log("2. Bridge contract logic error");
  console.log("3. Mailbox or destination configuration issue");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 