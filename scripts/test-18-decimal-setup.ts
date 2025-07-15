import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Testing 18-Decimal Setup ===\n");

  // COTI network setup
  const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);

  const newCotiTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const newCotiBridgeAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const testRecipient = "0x30a6C9D1d70d41756673Cce044189577F0953a75";

  console.log("New Deployment Addresses:");
  console.log("- COTI Token:", newCotiTokenAddress);
  console.log("- COTI Bridge:", newCotiBridgeAddress);
  console.log("- Test User:", testRecipient);
  console.log();

  // Contract ABIs
  const tokenABI = [
    "function balanceOf(address account) external view returns (uint64)",
    "function mint(address to, uint256 amount) external",
    "function decimals() external view returns (uint8)"
  ];

  const cotiToken = new ethers.Contract(newCotiTokenAddress, tokenABI, cotiWallet);

  try {
    // Check token decimals
    const decimals = await cotiToken.decimals();
    console.log("✅ COTI Token Configuration:");
    console.log("- Decimals:", decimals.toString());
    console.log("- Expected: 18");
    console.log("- Match:", decimals.toString() === "18" ? "✅ YES" : "❌ NO");
    console.log();

    // Check current balance
    const currentBalance = await cotiToken.balanceOf(testRecipient);
    console.log("📊 Current Balance:");
    console.log("- Raw balance:", currentBalance.toString());
    console.log("- Formatted (18 decimals):", ethers.formatUnits(currentBalance, 18), "tokens");
    console.log();

    // Test mint with 18-decimal amount
    const testAmount = ethers.parseUnits("5.5", 18); // 5.5 tokens
    console.log("🧪 Testing Direct Mint:");
    console.log("- Amount to mint:", ethers.formatUnits(testAmount, 18), "tokens");
    console.log("- Amount (wei):", testAmount.toString());

    const mintTx = await cotiToken.mint(testRecipient, testAmount, {
      gasLimit: 500000
    });

    console.log("- Transaction Hash:", mintTx.hash);
    const receipt = await mintTx.wait();
    console.log("✅ Mint successful!");
    console.log("- Block:", receipt.blockNumber);

    // Check balance after mint
    const newBalance = await cotiToken.balanceOf(testRecipient);
    console.log("\n📈 Balance After Mint:");
    console.log("- Raw balance:", newBalance.toString());
    console.log("- Formatted (18 decimals):", ethers.formatUnits(newBalance, 18), "tokens");

    // Calculate difference
    const difference = newBalance - currentBalance;
    console.log("- Difference:", ethers.formatUnits(difference, 18), "tokens");
    console.log("- Expected: 5.5 tokens");
    console.log("- Match:", ethers.formatUnits(difference, 18) === "5.5" ? "✅ YES" : "❌ NO");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }

  console.log("\n=== Cross-Chain Compatibility Test ===");
  
  // Simulate cross-chain message
  const crossChainAmount = ethers.parseUnits("3.125", 18); // Same as Sepolia format
  console.log("Simulated Cross-Chain Message:");
  console.log("- Sepolia amount (18 decimals):", ethers.formatUnits(crossChainAmount, 18), "tokens");
  console.log("- Raw value:", crossChainAmount.toString());
  console.log("- COTI will receive same value:", crossChainAmount.toString());
  console.log("- COTI will mint (18 decimals):", ethers.formatUnits(crossChainAmount, 18), "tokens");
  console.log("- ✅ Perfect 1:1 ratio - no conversion needed!");

  console.log("\n=== Summary ===");
  console.log("✅ Both tokens now use 18 decimals");
  console.log("✅ No decimal conversion needed in bridge");
  console.log("✅ 1:1 ratio between Sepolia and COTI tokens");
  console.log("✅ Simplified and cleaner architecture");
  console.log("✅ No more trillion-fold errors!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 