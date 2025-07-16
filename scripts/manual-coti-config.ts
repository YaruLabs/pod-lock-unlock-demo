import { ethers } from "hardhat";

async function main() {
  console.log("Manually configuring COTI bridge...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";
  const sepoliaBridgeAddress = "0x92102DD1FED780957826aD1623198056f985774f";
  
  console.log("COTI Bridge:", cotiBridgeAddress);
  console.log("Setting Sepolia Bridge:", sepoliaBridgeAddress);
  
  const cotiBridge = await ethers.getContractAt("CotiBridge", cotiBridgeAddress);
  
  // Convert Sepolia bridge address to bytes32
  const sepoliaBridgeBytes32 = ethers.zeroPadValue(sepoliaBridgeAddress, 32);
  
  try {
    const tx = await cotiBridge.setSepoliaBridgeAddress(sepoliaBridgeBytes32, {
      gasLimit: 200000
    });
    await tx.wait();
    
    console.log("✅ COTI bridge configured successfully");
    console.log("Transaction hash:", tx.hash);
  } catch (error) {
    console.log("⚠️ Configuration failed, but continuing with test...");
    console.log("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 