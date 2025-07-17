import { ethers } from "hardhat";

async function main() {
  console.log("🔥 Simple COTI Burn Test");
  console.log("========================");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Contract addresses
  const COTI_TOKEN = "0x3371F18A7a0704e7F3f33322F650575C6846bd9a";
  const COTI_BRIDGE = "0xF89DAB589711f891B591405059e2B7b3dC795888";

  try {
    // Connect to contracts with specific gas settings
    const cotiToken = await ethers.getContractAt("CotiToken", COTI_TOKEN);
    const cotiBridge = await ethers.getContractAt("CotiBridge", COTI_BRIDGE);
    
    console.log("✅ Connected to contracts");
    
    // Check current balance with explicit gas settings
    console.log("Checking balance...");
    const balance = await cotiToken['balanceOf(address)'](deployer.address, {
      gasLimit: 100000
    });
    console.log("Current balance:", ethers.formatUnits(balance, 18), "cpUSDC");
    
    // Mint tokens if needed
    if (balance === 0n) {
      console.log("Minting tokens...");
      const mintAmount = ethers.parseUnits("100", 18);
      const mintTx = await cotiToken.mint(deployer.address, mintAmount, {
        gasLimit: 200000,
        gasPrice: ethers.parseUnits("1", "gwei")
      });
      
      console.log("Mint tx hash:", mintTx.hash);
      await mintTx.wait();
      console.log("✅ Tokens minted");
      
      // Check new balance
      const newBalance = await cotiToken['balanceOf(address)'](deployer.address);
      console.log("New balance:", ethers.formatUnits(newBalance, 18), "cpUSDC");
    }
    
    // Small burn test
    const burnAmount = ethers.parseUnits("5", 18); // 5 tokens
    console.log("Burn amount:", ethers.formatUnits(burnAmount, 18), "cpUSDC");
    
    // Get fee quote
    console.log("Getting fee quote...");
    const fee = await cotiBridge.quoteBurnFee(burnAmount, {
      gasLimit: 100000
    });
    console.log("Cross-chain fee:", ethers.formatEther(fee), "ETH");
    
    // Transfer tokens to bridge
    console.log("Transferring tokens to bridge...");
    const transferTx = await cotiToken['transfer(address,uint256)'](
      COTI_BRIDGE, 
      burnAmount,
      {
        gasLimit: 150000,
        gasPrice: ethers.parseUnits("1", "gwei")
      }
    );
    
    console.log("Transfer tx hash:", transferTx.hash);
    await transferTx.wait();
    console.log("✅ Tokens transferred");
    
    // Call burn function
    console.log("Calling burn function...");
    const burnTx = await cotiBridge.burn(burnAmount, {
      value: fee,
      gasLimit: 300000,
      gasPrice: ethers.parseUnits("1", "gwei")
    });
    
    console.log("✅ Burn transaction submitted");
    console.log("Burn tx hash:", burnTx.hash);
    
    // Wait for confirmation
    console.log("Waiting for confirmation...");
    const receipt = await burnTx.wait();
    
    console.log("✅ Burn completed!");
    console.log("Gas used:", receipt?.gasUsed.toString());
    console.log("Block number:", receipt?.blockNumber);
    
    // Check final state
    const finalBalance = await cotiToken['balanceOf(address)'](deployer.address);
    console.log("Final balance:", ethers.formatUnits(finalBalance, 18), "cpUSDC");
    
    console.log("\n🎉 Burn test successful!");
    console.log("📡 Cross-chain message sent to Sepolia!");
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    
    // More specific error handling
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Need more ETH for gas fees");
    } else if (error.message.includes("nonce")) {
      console.log("💡 Try again - nonce issue");
    } else if (error.message.includes("gas")) {
      console.log("💡 Try with higher gas limit");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });