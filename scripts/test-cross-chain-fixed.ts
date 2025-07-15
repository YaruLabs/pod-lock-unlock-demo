import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Testing Cross-Chain with Decimal Fix ===\n");

  // Network setup
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL!);
  const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

  const sepoliaTokenAddress = "0xb51926aCaa39E6571c08d7bCBfc94087D72475Ed";
  const sepoliaBridgeAddress = "0x371F045B08772E36E352F67C38868FFC4113fF85";
  const recipient = "0x30a6C9D1d70d41756673Cce044189577F0953a75";

  console.log("Test Configuration:");
  console.log("- Sepolia Token:", sepoliaTokenAddress);
  console.log("- Sepolia Bridge:", sepoliaBridgeAddress);
  console.log("- User:", recipient);
  console.log("- Expected COTI Bridge:", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
  console.log();

  // Test amount - using a smaller amount to test decimal conversion
  const testAmount = ethers.parseUnits("5", 18); // 5 tokens with 18 decimals

  console.log("💰 Test Amount:");
  console.log("- Amount (18 decimals):", testAmount.toString());
  console.log("- Amount formatted:", ethers.formatUnits(testAmount, 18), "tokens");
  console.log("- Expected on COTI (6 decimals):", ethers.formatUnits(testAmount / 1000000000000n, 6), "cpUSDC");
  console.log();

  // Contract ABIs
  const tokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, uint256 amount) external",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  const bridgeABI = [
    "function lockTokens(uint256 amount) external",
    "function destinationBridge() external view returns (bytes32)",
    "event TokensLocked(address indexed user, uint256 amount, bytes32 destinationBridge)"
  ];

  const sepoliaToken = new ethers.Contract(sepoliaTokenAddress, tokenABI, sepoliaWallet);
  const sepoliaBridge = new ethers.Contract(sepoliaBridgeAddress, bridgeABI, sepoliaWallet);

  try {
    // Check current balance
    const balance = await sepoliaToken.balanceOf(recipient);
    console.log("📊 Sepolia Balance:", ethers.formatUnits(balance, 18), "tokens");

    // Check if we have enough tokens
    if (balance < testAmount) {
      console.log("🏭 Minting tokens for test...");
      const mintTx = await sepoliaToken.mint(recipient, testAmount * 2n); // Mint double for safety
      await mintTx.wait();
      console.log("✅ Tokens minted");
    }

    // Check destination bridge
    const destinationBridge = await sepoliaBridge.destinationBridge();
    console.log("🎯 Destination Bridge:", destinationBridge);

    // Check allowance
    const allowance = await sepoliaToken.allowance(recipient, sepoliaBridgeAddress);
    console.log("📋 Current Allowance:", ethers.formatUnits(allowance, 18));

    if (allowance < testAmount) {
      console.log("🔓 Approving tokens...");
      const approveTx = await sepoliaToken.approve(sepoliaBridgeAddress, testAmount);
      await approveTx.wait();
      console.log("✅ Tokens approved");
    }

    console.log("\n🚀 Initiating Cross-Chain Transfer...");
    console.log("Locking", ethers.formatUnits(testAmount, 18), "tokens on Sepolia");
    
    const lockTx = await sepoliaBridge.lockTokens(testAmount, {
      gasLimit: 500000
    });

    console.log("Transaction Hash:", lockTx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await lockTx.wait();
    console.log("✅ Tokens locked successfully!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Parse events
    console.log("\nEvents:");
    for (const log of receipt.logs) {
      try {
        const parsed = sepoliaBridge.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsed) {
          console.log(`- ${parsed.name}:`, parsed.args);
        }
      } catch (e) {
        // Ignore unparseable logs
      }
    }

    console.log("\n=== Expected Results ===");
    console.log("1. ✅ Tokens locked on Sepolia");
    console.log("2. 🔄 Hyperlane message sent to COTI");
    console.log("3. 🎯 COTI bridge will receive 18-decimal amount");
    console.log("4. 🔧 Bridge will convert to 6-decimal amount");
    console.log("5. 🏭 Bridge will mint correct amount on COTI");
    console.log();
    console.log("Expected on COTI:");
    console.log(`- Input: ${ethers.formatUnits(testAmount, 18)} tokens (18 decimals)`);
    console.log(`- Converted: ${ethers.formatUnits(testAmount / 1000000000000n, 6)} cpUSDC (6 decimals)`);
    console.log("- No more trillion-fold errors! ✅");

  } catch (error) {
    console.error("❌ Cross-chain test failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 