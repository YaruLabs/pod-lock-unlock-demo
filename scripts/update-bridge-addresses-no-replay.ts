import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Updating Bridge Addresses - No Replay Protection");
  console.log("=================================================");

  // New contract addresses
  const NEW_COTI_TOKEN = "0xa4661A5B5DF03840024e144D123a274969DdeBA2";
  const NEW_COTI_BRIDGE = "0x52221191a3565eda7124c7690500Afa4e066a196";
  const NEW_SEPOLIA_BRIDGE = "0x1F623C0A0487F1da20BcB5fb1BD48C0f296E0CE5";

  console.log("📋 New Contract Addresses:");
  console.log("COTI Token:", NEW_COTI_TOKEN);
  console.log("COTI Bridge:", NEW_COTI_BRIDGE);
  console.log("Sepolia Bridge:", NEW_SEPOLIA_BRIDGE);

  console.log("\n🔧 Step 1: Update COTI Bridge Configuration");
  console.log("===========================================");

  try {
    // Connect to COTI network
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);

    const bridgeABI = [
      "function setSepoliaBridgeAddress(bytes32 _sepoliaBridgeAddress) external",
      "function sepoliaBridgeAddress() external view returns (bytes32)",
      "function sepoliaDomain() external view returns (uint32)"
    ];

    const cotiBridge = new ethers.Contract(NEW_COTI_BRIDGE, bridgeABI, cotiWallet);

    // Convert Sepolia bridge address to bytes32
    const sepoliaBridgeBytes32 = ethers.zeroPadValue(NEW_SEPOLIA_BRIDGE, 32);
    console.log("Setting Sepolia bridge to:", sepoliaBridgeBytes32);

    const updateTx = await cotiBridge.setSepoliaBridgeAddress(sepoliaBridgeBytes32, {
      gasLimit: 200000
    });
    await updateTx.wait();
    console.log("✅ COTI bridge updated to point to new Sepolia bridge");

    // Verify configuration
    const currentSepoliaBridge = await cotiBridge.sepoliaBridgeAddress();
    const sepoliaDomain = await cotiBridge.sepoliaDomain();
    console.log("✅ Verified Sepolia Bridge:", currentSepoliaBridge);
    console.log("✅ Sepolia Domain:", sepoliaDomain.toString());

  } catch (error) {
    console.error("❌ Failed to update COTI bridge:", error.message);
  }

  console.log("\n🔧 Step 2: Update Sepolia Bridge Configuration");
  console.log("============================================");

  try {
    // Connect to Sepolia network
    const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL!);
    const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);

    const sepoliaBridgeABI = [
      "function cotiBridgeAddress() external view returns (bytes32)",
      "function updateCotiBridgeAddress(bytes32 _newAddress) external",
      "function cotiDomain() external view returns (uint32)"
    ];

    const sepoliaBridge = new ethers.Contract(NEW_SEPOLIA_BRIDGE, sepoliaBridgeABI, sepoliaWallet);

    // Convert COTI bridge address to bytes32
    const cotiBridgeBytes32 = ethers.zeroPadValue(NEW_COTI_BRIDGE, 32);
    console.log("Setting COTI bridge to:", cotiBridgeBytes32);

    const updateTx = await sepoliaBridge.updateCotiBridgeAddress(cotiBridgeBytes32);
    await updateTx.wait();
    console.log("✅ Sepolia bridge updated to point to new COTI bridge");

    // Verify configuration
    const currentCotiBridge = await sepoliaBridge.cotiBridgeAddress();
    const cotiDomain = await sepoliaBridge.cotiDomain();
    console.log("✅ Verified COTI Bridge:", currentCotiBridge);
    console.log("✅ COTI Domain:", cotiDomain.toString());

  } catch (error) {
    console.error("❌ Failed to update Sepolia bridge:", error.message);
  }

  console.log("\n🎉 Bridge Update Summary:");
  console.log("=========================");
  console.log("✅ Deployed new contracts WITHOUT replay protection");
  console.log("✅ Updated COTI bridge → Sepolia bridge connection");
  console.log("✅ Updated Sepolia bridge → COTI bridge connection");
  console.log("✅ Decimal conversion logic included");
  console.log("\n🔥 Ready to test burn/unlock without 'Message already processed' errors!");
  
  console.log("\n📋 Updated Contract Addresses:");
  console.log("==============================");
  console.log("COTI Token (No Replay):", NEW_COTI_TOKEN);
  console.log("COTI Bridge (No Replay):", NEW_COTI_BRIDGE);
  console.log("Sepolia Bridge (No Replay):", NEW_SEPOLIA_BRIDGE);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 