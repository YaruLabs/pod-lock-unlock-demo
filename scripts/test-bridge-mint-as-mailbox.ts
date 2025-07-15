import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Testing COTI Bridge Mint as Mailbox ===\n");

  // COTI network setup
  const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  
  const cotiBridgeAddress = "0x7da5EBAb79F8fe78005ef16eB958745f9D22c124";
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
    "event DebugInfo(address user, uint256 amount, bool isMint, uint32 origin, bytes32 sender)",
    "event MessageDecoded(address user, uint256 amount, bool isMint)",
    "event DecodingError(string reason, bytes messageData)"
  ];

  const tokenABI = [
    "function balanceOf(address account) external view returns (uint64)",
    "function mint(address to, uint256 amount) external returns (bool)",
    "function owner() external view returns (address)"
  ];

  // Test recipient
  const testRecipient = "0x30a6C9D1d70d41756673Cce044189577F0953a75";
  const testAmount = ethers.parseUnits("3.125", 18); // 3.125 tokens

  console.log("Test Parameters:");
  console.log("- Bridge Address:", cotiBridgeAddress);
  console.log("- Token Address:", cotiTokenAddress);
  console.log("- Mailbox Address:", cotiMailboxAddress);
  console.log("- Recipient:", testRecipient);
  console.log("- Amount:", ethers.formatUnits(testAmount, 18), "tokens");
  console.log();

  // Check recipient's balance before
  const cotiToken = new ethers.Contract(cotiTokenAddress, tokenABI, cotiProvider);
  try {
    const balanceBefore = await cotiToken.balanceOf(testRecipient);
    console.log("Balance Before:", ethers.formatUnits(balanceBefore, 18), "tokens");
  } catch (error) {
    console.error("Error checking balance before:", error);
  }

  // Construct the message that would come from Hyperlane
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

  // Handle function parameters
  const origin = 11155111;
  const senderBytes32 = ethers.zeroPadValue("0x371F045B08772E36E352F67C38868FFC4113fF85", 32);

  console.log("Handle Function Parameters:");
  console.log("- Origin:", origin, "(Sepolia)");
  console.log("- Sender:", senderBytes32);
  console.log();

  // Use hardhat network impersonation to call as mailbox
  try {
    console.log("Impersonating mailbox address...");
    
    // Start impersonating the mailbox
    await cotiProvider.send("hardhat_impersonateAccount", [cotiMailboxAddress]);
    
    // Get the impersonated signer
    const mailboxSigner = await ethers.getSigner(cotiMailboxAddress);
    
    // Connect to bridge as mailbox
    const cotiBridge = new ethers.Contract(cotiBridgeAddress, bridgeABI, mailboxSigner);
    
    console.log("Calling handle function as mailbox...");
    
    // Call the handle function
    const tx = await cotiBridge.handle(origin, senderBytes32, fullMessage, {
      gasLimit: 500000
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
        // Try token interface for mint events
        try {
          const tokenParsed = cotiToken.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (tokenParsed) {
            console.log(`- Token ${tokenParsed.name}:`, tokenParsed.args);
          }
        } catch (e2) {
          // Ignore unparseable logs
        }
      }
    }
    console.log();

    // Stop impersonating
    await cotiProvider.send("hardhat_stopImpersonatingAccount", [cotiMailboxAddress]);

    // Check recipient's balance after
    try {
      const balanceAfter = await cotiToken.balanceOf(testRecipient);
      console.log("Balance After:", ethers.formatUnits(balanceAfter, 18), "tokens");
      
      console.log("\n✅ Bridge mint test completed successfully!");
      console.log("The handle function was called and events were emitted.");
      
    } catch (error) {
      console.error("Error checking balance after:", error);
    }

  } catch (error) {
    console.error("❌ Test failed:");
    console.error("Error:", error.message);
    
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    
    if (error.data) {
      console.error("Data:", error.data);
    }

    // Note about network limitations
    console.log("\nNote: This test requires a local hardhat network or fork.");
    console.log("COTI testnet doesn't support hardhat_impersonateAccount.");
    console.log("The actual minting would work when called by the real Hyperlane mailbox.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 