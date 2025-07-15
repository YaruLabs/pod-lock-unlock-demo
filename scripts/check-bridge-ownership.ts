import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Checking Bridge Ownership & Setup ===\n");

  // COTI network setup
  const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);

  const newCotiTokenAddress = "0xefb11596825C5aB53Ec3667864fF53339A582dBe";
  const newCotiBridgeAddress = "0x2830F52B310bC900f285709d9ef92e9D5aCfB32f";
  const cotiMailboxAddress = "0x7FE7EA170cf08A25C2ff315814D96D93C311E692";

  console.log("Addresses:");
  console.log("- COTI Token:", newCotiTokenAddress);
  console.log("- COTI Bridge:", newCotiBridgeAddress);
  console.log("- COTI Mailbox:", cotiMailboxAddress);
  console.log("- Deployer:", cotiWallet.address);
  console.log();

  // Contract ABIs
  const tokenABI = [
    "function owner() external view returns (address)",
    "function mint(address to, uint256 amount) external",
    "function transferOwnership(address newOwner) external"
  ];

  const bridgeABI = [
    "function token() external view returns (address)",
    "function mailbox() external view returns (address)"
  ];

  const cotiToken = new ethers.Contract(newCotiTokenAddress, tokenABI, cotiWallet);
  const cotiBridge = new ethers.Contract(newCotiBridgeAddress, bridgeABI, cotiProvider);

  try {
    // Check token ownership
    console.log("🏭 Token Ownership:");
    const tokenOwner = await cotiToken.owner();
    console.log("- Token Owner:", tokenOwner);
    console.log("- Bridge Address:", newCotiBridgeAddress);
    console.log("- Owner is Bridge:", tokenOwner.toLowerCase() === newCotiBridgeAddress.toLowerCase() ? "✅ YES" : "❌ NO");
    console.log("- Owner is Deployer:", tokenOwner.toLowerCase() === cotiWallet.address.toLowerCase() ? "✅ YES" : "❌ NO");

    // Check bridge configuration
    console.log("\n🌉 Bridge Configuration:");
    const bridgeTokenAddress = await cotiBridge.token();
    const bridgeMailboxAddress = await cotiBridge.mailbox();
    
    console.log("- Bridge Token:", bridgeTokenAddress);
    console.log("- Expected Token:", newCotiTokenAddress);
    console.log("- Token Match:", bridgeTokenAddress.toLowerCase() === newCotiTokenAddress.toLowerCase() ? "✅ YES" : "❌ NO");
    
    console.log("- Bridge Mailbox:", bridgeMailboxAddress);
    console.log("- Expected Mailbox:", cotiMailboxAddress);
    console.log("- Mailbox Match:", bridgeMailboxAddress.toLowerCase() === cotiMailboxAddress.toLowerCase() ? "✅ YES" : "❌ NO");

    // Transfer ownership if needed
    if (tokenOwner.toLowerCase() === cotiWallet.address.toLowerCase()) {
      console.log("\n🔧 Transferring Token Ownership to Bridge...");
      try {
        const transferTx = await cotiToken.transferOwnership(newCotiBridgeAddress, {
          gasLimit: 100000
        });
        
        console.log("Transfer Transaction Hash:", transferTx.hash);
        const receipt = await transferTx.wait();
        console.log("✅ Ownership transferred successfully!");
        console.log("Block:", receipt.blockNumber);
        
        // Verify ownership transfer
        const newOwner = await cotiToken.owner();
        console.log("- New Owner:", newOwner);
        console.log("- Transfer Success:", newOwner.toLowerCase() === newCotiBridgeAddress.toLowerCase() ? "✅ YES" : "❌ NO");
        
      } catch (error) {
        console.error("❌ Failed to transfer ownership:", error.message);
      }
    } else if (tokenOwner.toLowerCase() === newCotiBridgeAddress.toLowerCase()) {
      console.log("\n✅ Token ownership is already correctly set!");
    } else {
      console.log("\n❌ Token ownership needs to be fixed manually!");
    }

    // Test mint function
    console.log("\n🧪 Testing Mint Capability...");
    const testUser = "0x30a6C9D1d70d41756673Cce044189577F0953a75";
    const testAmount = ethers.parseUnits("1", 18); // 1 token

    try {
      // Try to mint directly (should fail if bridge doesn't own token)
      const mintTx = await cotiToken.mint(testUser, testAmount, {
        gasLimit: 500000
      });
      
      console.log("Direct mint transaction:", mintTx.hash);
      const receipt = await mintTx.wait();
      console.log("✅ Direct mint successful! (deployer can still mint)");
      
    } catch (error) {
      console.log("❌ Direct mint failed:", error.message);
      console.log("This is expected if ownership was transferred correctly.");
    }

  } catch (error) {
    console.error("❌ Ownership check failed:", error.message);
  }

  console.log("\n=== Summary ===");
  console.log("For the bridge to work correctly:");
  console.log("1. ✅ Bridge token address must match deployed token");
  console.log("2. ✅ Bridge mailbox address must match COTI mailbox");
  console.log("3. ✅ Token owner must be the bridge contract");
  console.log("4. 🔄 Hyperlane messages will trigger bridge mint function");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 