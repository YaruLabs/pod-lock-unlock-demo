import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 COTI Cross-Chain Bridge Test");
  console.log("================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Load deployment addresses
  const deploymentsDir = path.join(__dirname, "..", "..", "deployments");
  const sepoliaDeploymentPath = path.join(deploymentsDir, "sepolia.json");
  const cotiDeploymentPath = path.join(deploymentsDir, "coti.json");
  
  if (!fs.existsSync(sepoliaDeploymentPath) || !fs.existsSync(cotiDeploymentPath)) {
    console.error("❌ Deployment files not found. Please deploy contracts first.");
    console.log("Expected files:");
    console.log("- deployments/sepolia.json");
    console.log("- deployments/coti.json");
    process.exit(1);
  }
  
  const sepoliaDeployment = JSON.parse(fs.readFileSync(sepoliaDeploymentPath, "utf8"));
  const cotiDeployment = JSON.parse(fs.readFileSync(cotiDeploymentPath, "utf8"));
  
  console.log("\n📋 Contract Addresses:");
  console.log("Sepolia Token:", sepoliaDeployment.contracts.SepoliaToken);
  console.log("Sepolia Bridge:", sepoliaDeployment.contracts.SepoliaBridge);
  console.log("COTI Token:", cotiDeployment.contracts.CotiToken);
  console.log("COTI Bridge:", cotiDeployment.contracts.CotiBridge);

  try {
    // Step 1: Mint tokens on Sepolia (if needed)
    console.log("\n🪙 Step 1: Ensure tokens on Sepolia");
    const sepoliaToken = await ethers.getContractAt("SepoliaToken", sepoliaDeployment.contracts.SepoliaToken);
    
    const currentBalance = await sepoliaToken.balanceOf(deployer.address);
    console.log("Current Sepolia balance:", ethers.formatUnits(currentBalance, 18), "tokens");
    
    const requiredAmount = ethers.parseUnits("60", 18); // Need 60 tokens to lock 50
    
    if (currentBalance < requiredAmount) {
      console.log("💰 Minting tokens on Sepolia...");
      const mintAmount = ethers.parseUnits("100", 18);
      const mintTx = await sepoliaToken.mint(deployer.address, mintAmount);
      await mintTx.wait();
      console.log("✅ Minted 100 tokens on Sepolia");
      
      const newBalance = await sepoliaToken.balanceOf(deployer.address);
      console.log("New balance:", ethers.formatUnits(newBalance, 18), "tokens");
    } else {
      console.log("✅ Sufficient balance available");
    }

    // Step 2: Lock tokens and trigger cross-chain transfer
    console.log("\n🔒 Step 2: Lock tokens on Sepolia Bridge");
    const sepoliaBridge = await ethers.getContractAt("SepoliaBridge", sepoliaDeployment.contracts.SepoliaBridge);
    
    const lockAmount = ethers.parseUnits("50", 18); // Lock 50 tokens
    console.log("Locking", ethers.formatUnits(lockAmount, 18), "tokens...");
    
    // First approve the bridge to spend tokens
    console.log("📝 Approving bridge to spend tokens...");
    const approveTx = await sepoliaToken.approve(sepoliaDeployment.contracts.SepoliaBridge, lockAmount);
    await approveTx.wait();
    console.log("✅ Approval successful");
    
    // Get the required fee for the cross-chain message
    console.log("💸 Getting Hyperlane message fee...");
    const fee = await sepoliaBridge.quoteLockFee(lockAmount);
    console.log("Required fee:", ethers.formatEther(fee), "ETH");
    
    // Lock tokens and send cross-chain message
    console.log("🚀 Locking tokens and sending cross-chain message...");
    const lockTx = await sepoliaBridge.lock(lockAmount, {
      gasLimit: 500000,
      value: fee, // Include the Hyperlane dispatch fee
    });
    const lockReceipt = await lockTx.wait();
    console.log("✅ Lock transaction successful!");
    console.log("📄 Transaction hash:", lockReceipt?.hash);
    console.log("🧱 Block number:", lockReceipt?.blockNumber);
    
    // Extract message ID from logs
    const messageId = extractMessageId(lockReceipt);
    if (messageId) {
      console.log("🎯 Hyperlane Message ID:", messageId);
    }
    
    // Check updated balances
    const newBalance = await sepoliaToken.balanceOf(deployer.address);
    const bridgeBalance = await sepoliaToken.balanceOf(sepoliaDeployment.contracts.SepoliaBridge);
    
    console.log("\n📊 Updated Balances:");
    console.log("Your Sepolia balance:", ethers.formatUnits(newBalance, 18), "tokens");
    console.log("Bridge locked tokens:", ethers.formatUnits(bridgeBalance, 18), "tokens");

    // Step 3: Show cross-chain message details
    console.log("\n📨 Step 3: Cross-chain Message Details");
    const messageData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bool"],
      [deployer.address, lockAmount, true] // user, amount, isMint
    );
    
    console.log("Message sent to COTI:");
    console.log("- Recipient:", deployer.address);
    console.log("- Amount:", ethers.formatUnits(lockAmount, 18), "tokens");
    console.log("- Action: Mint");
    console.log("- Expected COTI tokens: 50 cpUSDC (6 decimals)");

    console.log("\n🎯 Cross-Chain Test Summary:");
    console.log("================================");
    console.log("✅ Tokens locked on Sepolia:", ethers.formatUnits(lockAmount, 18));
    console.log("✅ Hyperlane message sent with ID:", messageId || "Check logs");
    console.log("✅ Expected result: 50 cpUSDC minted on COTI");
    console.log("");
    console.log("🔍 To verify the result:");
    console.log("Run: npx hardhat run scripts/working/decrypt-balance.ts");
    console.log("");
    console.log("⏰ Note: Hyperlane delivery may take a few minutes");

  } catch (error: any) {
    console.error("❌ Cross-chain test failed:", error.message);
    throw error;
  }
}

// Helper function to extract message ID from transaction logs
function extractMessageId(receipt: any): string | null {
  if (!receipt?.logs) return null;
  
  for (const log of receipt.logs) {
    try {
      // Look for Hyperlane Dispatch event
      if (log.topics && log.topics[0] === "0x769f711d20c679153d382254f59892613b58a97cc876b249134ac25c80f9c814") {
        return log.topics[1]; // Message ID is typically the first indexed parameter
      }
    } catch (e) {
      // Continue searching
    }
  }
  return null;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 