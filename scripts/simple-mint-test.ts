import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Simple COTI Token Mint Test");
  console.log("==============================");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  const COTI_TOKEN = "0x3371F18A7a0704e7F3f33322F650575C6846bd9a";

  try {
    const cotiToken = await ethers.getContractAt("CotiToken", COTI_TOKEN);
    console.log("✅ Connected to COTI token");

    // Check current balance
    const currentBalance = await cotiToken['balanceOf(address)'](deployer.address);
    console.log("Current balance:", ethers.formatUnits(currentBalance, 18), "cpUSDC");

    // Check ETH balance
    const ethBalance = await deployer.provider!.getBalance(deployer.address);
    console.log("ETH balance:", ethers.formatEther(ethBalance), "ETH");

    // Try minting with simple gas settings
    const mintAmount = ethers.parseUnits("10", 18);
    console.log("Attempting to mint:", ethers.formatUnits(mintAmount, 18), "cpUSDC");

    const mintTx = await cotiToken.mint(deployer.address, mintAmount, {
      gasLimit: 300000,
      gasPrice: ethers.parseUnits("1", "gwei")
    });

    console.log("Mint tx hash:", mintTx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await mintTx.wait();
    
    if (receipt?.status === 1) {
      console.log("✅ Mint successful!");
      console.log("Gas used:", receipt.gasUsed.toString());
      
      const newBalance = await cotiToken['balanceOf(address)'](deployer.address);
      console.log("New balance:", ethers.formatUnits(newBalance, 18), "cpUSDC");
      
      console.log("\n🎉 Tokens minted successfully!");
      console.log("💡 Now you can test the burn function");
      
    } else {
      console.log("❌ Mint transaction failed");
    }

  } catch (error: any) {
    console.error("❌ Mint error:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("💡 This might be due to COTI MPC requirements");
      console.log("💡 The token contract might need special initialization on COTI network");
    } else if (error.message.includes("gas")) {
      console.log("💡 Try adjusting gas settings");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });