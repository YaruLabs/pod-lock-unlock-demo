import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Testing COTI Bridge Handle Function & Mint ===\n");

  // COTI network setup
  const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);

  const cotiBridgeAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const cotiTokenAddress = "0xC41bb5D7fec4aE9AE4f76C3300248b85EeA8Fe59";
  const cotiMailboxAddress = "0x7FE7EA170cf08A25C2ff315814D96D93C311E692";

  // Contract ABIs
  const bridgeABI = [
    "function handle(uint32 _origin, bytes32 _sender, bytes calldata _message) external",
    "function token() external view returns (address)",
    "function mailbox() external view returns (address)",
    "event MessageReceived(uint32 origin, bytes32 sender, address user, uint256 amount, bool isMint)",
    "event BridgeAction(address indexed user, uint256 amount, bool isMint)",
    "event RawMessage(uint32 origin, bytes32 sender, bytes message)",
    "event MintSuccess(address indexed user, uint256 amount)",
    "event MintFailed(address indexed user, uint256 amount, string reason)"
  ];

  const tokenABI = [
    "function balanceOf(address account) external view returns (uint64)",
    "function mint(address to, uint256 amount) external returns (bool)",
    "function owner() external view returns (address)"
  ];

  // Connect to contracts
  const cotiBridge = new ethers.Contract(cotiBridgeAddress, bridgeABI, cotiWallet);
  const cotiToken = new ethers.Contract(cotiTokenAddress, tokenABI, cotiWallet);

  console.log("COTI Bridge Address:", cotiBridgeAddress);
  console.log("COTI Token Address:", cotiTokenAddress);
  console.log("COTI Mailbox Address:", cotiMailboxAddress);
  console.log("Caller Address:", cotiWallet.address);
  console.log();

  // Check current configuration
  try {
    const bridgeTokenAddress = await cotiBridge.token();
    const bridgeMailboxAddress = await cotiBridge.mailbox();
    
    console.log("Bridge Configuration:");
    console.log("- Token Address:", bridgeTokenAddress);
    console.log("- Mailbox Address:", bridgeMailboxAddress);
    console.log();
  } catch (error) {
    console.error("Error checking bridge configuration:", error);
    return;
  }

  // Test recipient
  const testRecipient = "0x30a6C9D1d70d41756673Cce044189577F0953a75";
  const testAmount = ethers.parseUnits("3.125", 18); // 3.125 tokens

  console.log("Test Parameters:");
  console.log("- Recipient:", testRecipient);
  console.log("- Amount:", ethers.formatUnits(testAmount, 18), "tokens");
  console.log();

  // Check recipient's balance before
  try {
    const balanceBefore = await cotiToken.balanceOf(testRecipient);
    console.log("Balance Before:", ethers.formatUnits(balanceBefore, 18), "tokens");
  } catch (error) {
    console.error("Error checking balance before:", error);
  }

  // Construct the message that would come from Hyperlane
  // Based on our analysis: user address (32 bytes) + amount (32 bytes) + bool (32 bytes)
  const userAddressBytes32 = ethers.zeroPadValue(testRecipient, 32);
  const amountBytes32 = ethers.zeroPadValue(ethers.toBeHex(testAmount), 32);
  const boolBytes32 = ethers.zeroPadValue("0x01", 32); // true
  
  const fullMessage = userAddressBytes32 + amountBytes32.slice(2) + boolBytes32.slice(2);
  
  console.log("Constructed Message:");
  console.log("- User (32 bytes):", userAddressBytes32);
  console.log("- Amount (32 bytes):", amountBytes32);
  console.log("- Bool (32 bytes):", boolBytes32);
  console.log("- Full Message:", fullMessage);
  console.log("- Message Length:", fullMessage.length, "characters");
  console.log();

  // Test the handle function
  // Origin: 11155111 (Sepolia)
  // Sender: 0x371F045B08772E36E352F67C38868FFC4113fF85 (Sepolia Bridge)
  const origin = 11155111;
  const senderBytes32 = ethers.zeroPadValue("0x371F045B08772E36E352F67C38868FFC4113fF85", 32);

  console.log("Handle Function Parameters:");
  console.log("- Origin:", origin, "(Sepolia)");
  console.log("- Sender:", senderBytes32);
  console.log();

  try {
    console.log("Calling handle function...");
    
    // First, let's simulate/estimate gas
    try {
      const gasEstimate = await cotiBridge.handle.estimateGas(origin, senderBytes32, fullMessage);
      console.log("Gas Estimate:", gasEstimate.toString());
    } catch (gasError) {
      console.log("Gas estimation failed:", gasError.message);
    }

    // Call the handle function
    const tx = await cotiBridge.handle(origin, senderBytes32, fullMessage, {
      gasLimit: 500000 // Set a reasonable gas limit
    });
    
    console.log("Transaction Hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log();

    // Parse events
    console.log("Events:");
    for (const log of receipt.logs) {
      try {
        const parsed = cotiBridge.interface.parseLog({
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
    console.log();

    // Check recipient's balance after
    try {
      const balanceAfter = await cotiToken.balanceOf(testRecipient);
      console.log("Balance After:", ethers.formatUnits(balanceAfter, 18), "tokens");
      
      // Calculate the difference
      const balanceBefore = await cotiToken.balanceOf(testRecipient);
      const difference = balanceAfter - balanceBefore;
      if (difference > 0) {
        console.log("✅ Tokens minted successfully!");
        console.log("Amount minted:", ethers.formatUnits(difference, 18), "tokens");
      } else {
        console.log("❌ No tokens were minted");
      }
    } catch (error) {
      console.error("Error checking balance after:", error);
    }

  } catch (error) {
    console.error("❌ Handle function failed:");
    console.error("Error:", error.message);
    
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    
    if (error.data) {
      console.error("Data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 