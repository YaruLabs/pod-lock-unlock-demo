import { ethers } from "hardhat";

async function main() {
  console.log("🔥 Simple COTI Burn Test (18 decimals)");
  
  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);
  
  const cotiTokenAddress = "0xa4661A5B5DF03840024e144D123a274969DdeBA2";
  const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";
  
  try {
    // Connect to contracts
    const cotiToken = await ethers.getContractAt("CotiToken", cotiTokenAddress);
    const cotiBridge = await ethers.getContractAt("CotiBridge", cotiBridgeAddress);
    
    console.log("✅ Connected to contracts");
    
    // Check decimals
    const decimals = await cotiToken.decimals();
    console.log("Token decimals:", decimals.toString());
    
    // Check balance
    const balance = await cotiToken['balanceOf(address)'](deployer.address);
    console.log("Current balance:", ethers.formatUnits(balance, 18), "cpUSDC");
    
    // Small burn amount (10 tokens)
    const burnAmount = ethers.parseUnits("10", 18);
    console.log("Burn amount:", ethers.formatUnits(burnAmount, 18), "cpUSDC");
    
    // Get fee quote
    console.log("Getting fee quote...");
    const fee = await cotiBridge.quoteBurnFee(burnAmount);
    console.log("Cross-chain fee:", ethers.formatEther(fee), "ETH");
    
    // Transfer tokens to bridge first
    console.log("Transferring tokens to bridge...");
    const transferTx = await cotiToken['transfer(address,uint256)'](
      cotiBridgeAddress, 
      burnAmount,
      { gasLimit: 150000 }
    );
    await transferTx.wait();
    console.log("✅ Tokens transferred to bridge");
    console.log("Transfer tx:", transferTx.hash);
    
    // Check bridge balance
    const bridgeBalance = await cotiToken['balanceOf(address)'](cotiBridgeAddress);
    console.log("Bridge balance:", ethers.formatUnits(bridgeBalance, 18), "cpUSDC");
    
    // Now burn and send cross-chain message
    console.log("Burning tokens and sending cross-chain unlock message...");
    const burnTx = await cotiBridge.burn(burnAmount, { 
      value: fee,
      gasLimit: 300000
    });
    
    console.log("✅ Burn transaction submitted");
    console.log("Burn tx hash:", burnTx.hash);
    
    // Wait for confirmation
    console.log("Waiting for confirmation...");
    const receipt = await burnTx.wait();
    
    console.log("✅ Burn transaction confirmed!");
    console.log("Gas used:", receipt?.gasUsed.toString());
    console.log("Block:", receipt?.blockNumber);
    
    // Check final state
    const finalBalance = await cotiToken['balanceOf(address)'](deployer.address);
    console.log("Final balance:", ethers.formatUnits(finalBalance, 18), "cpUSDC");
    
    const finalBridgeBalance = await cotiToken['balanceOf(address)'](cotiBridgeAddress);
    console.log("Final bridge balance:", ethers.formatUnits(finalBridgeBalance, 18), "cpUSDC");
    
    console.log("\n📡 Cross-chain unlock message sent to Sepolia!");
    console.log("Check Sepolia network to verify unlock...");
    
  } catch (error) {
    console.error("❌ Error during COTI burn test:");
    console.error(error.message);
    
    if (error.message.includes("pending block")) {
      console.log("\n⚠️ Network connectivity issue detected");
      console.log("Try again in a few moments when COTI network stabilizes");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 