import { ethers, network } from "hardhat";

const CONTRACTS = {
  sepolia: {
    token: "0x3738B0638CAd52c6D9C0ea4eEE514C390f9Afe57",  // NEW 18-decimal token
    bridge: "0x92102DD1FED780957826aD1623198056f985774f", // NEW bridge (no conversion)
  },
  coti: {
    token: "0xa4661A5B5DF03840024e144D123a274969DdeBA2",  // EXISTING 18-decimal token
    bridge: "0x52221191a3565eda7124c7690500Afa4e066a196", // EXISTING bridge
  }
};

async function testSepoliaLockMint() {
  console.log("\n🔄 Testing Sepolia Lock → COTI Mint Flow (18 decimals)");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Connect to contracts
  const sepoliaToken = await ethers.getContractAt("SepoliaToken", CONTRACTS.sepolia.token);
  const sepoliaBridge = await ethers.getContractAt("SepoliaBridge", CONTRACTS.sepolia.bridge);
  
  // Check token decimals
  const decimals = await sepoliaToken.decimals();
  console.log("SepoliaToken decimals:", decimals.toString());
  
  // Check initial balance
  const initialBalance = await sepoliaToken.balanceOf(deployer.address);
  console.log("Initial balance:", ethers.formatUnits(initialBalance, 18));
  
  // Mint some tokens if needed
  if (initialBalance < ethers.parseUnits("1000", 18)) {
    console.log("Minting tokens...");
    const mintTx = await sepoliaToken.mint(deployer.address, ethers.parseUnits("10000", 18));
    await mintTx.wait();
    console.log("✅ Minted 10,000 tokens");
  }
  
  // Lock amount (100 tokens with 18 decimals)
  const lockAmount = ethers.parseUnits("100", 18);
  console.log("Lock amount:", ethers.formatUnits(lockAmount, 18), "tokens");
  
  // Approve bridge to spend tokens
  console.log("Approving bridge...");
  const approveTx = await sepoliaToken.approve(CONTRACTS.sepolia.bridge, lockAmount);
  await approveTx.wait();
  console.log("✅ Bridge approved");
  
  // Get quote for cross-chain message
  console.log("Getting fee quote...");
  const fee = await sepoliaBridge.quoteLockFee(lockAmount);
  console.log("Cross-chain fee:", ethers.formatEther(fee), "ETH");
  
  // Lock tokens and trigger cross-chain mint
  console.log("Locking tokens and triggering cross-chain mint...");
  const lockTx = await sepoliaBridge.lock(lockAmount, { value: fee });
  const receipt = await lockTx.wait();
  
  console.log("✅ Lock transaction completed");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());
  
  // Check locked tokens
  const lockedTokens = await sepoliaBridge.lockedTokens(deployer.address);
  console.log("Total locked tokens:", ethers.formatUnits(lockedTokens, 18));
  
  // Check bridge token balance
  const bridgeBalance = await sepoliaToken.balanceOf(CONTRACTS.sepolia.bridge);
  console.log("Bridge token balance:", ethers.formatUnits(bridgeBalance, 18));
  
  console.log("\n📡 Cross-chain message sent to COTI for minting");
  console.log("Check COTI network for mint result...");
}

async function testCotiBurnUnlock() {
  console.log("\n🔥 Testing COTI Burn → Sepolia Unlock Flow (18 decimals)");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Connect to contracts
  const cotiToken = await ethers.getContractAt("CotiToken", CONTRACTS.coti.token);
  const cotiBridge = await ethers.getContractAt("CotiBridge", CONTRACTS.coti.bridge);
  
  // Check token decimals
  const decimals = await cotiToken.decimals();
  console.log("CotiToken decimals:", decimals.toString());
  
  // Check initial balance
  const initialBalance = await cotiToken['balanceOf(address)'](deployer.address);
  console.log("Initial balance:", ethers.formatUnits(initialBalance, 18));
  
  // We already have plenty of tokens, no need to mint more
  console.log("We have sufficient balance for testing");
  
  // Burn amount (50 tokens with 18 decimals)
  const burnAmount = ethers.parseUnits("50", 18);
  console.log("Burn amount:", ethers.formatUnits(burnAmount, 18), "tokens");
  
  // Transfer tokens to bridge (bridge will burn them)
  console.log("Transferring tokens to bridge...");
  const transferTx = await cotiToken['transfer(address,uint256)'](CONTRACTS.coti.bridge, burnAmount);
  await transferTx.wait();
  console.log("✅ Tokens transferred to bridge");
  
  // Get quote for cross-chain message
  console.log("Getting fee quote...");
  const fee = await cotiBridge.quoteBurnFee(burnAmount);
  console.log("Cross-chain fee:", ethers.formatEther(fee), "ETH");
  
  // Burn tokens and trigger cross-chain unlock
  console.log("Burning tokens and triggering cross-chain unlock...");
  const burnTx = await cotiBridge.burn(burnAmount, { value: fee });
  const receipt = await burnTx.wait();
  
  console.log("✅ Burn transaction completed");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());
  
  // Check token supply
  const totalSupply = await cotiToken.totalSupply();
  console.log("Total token supply:", ethers.formatUnits(totalSupply, 18));
  
  console.log("\n📡 Cross-chain message sent to Sepolia for unlocking");
  console.log("Check Sepolia network for unlock result...");
}

async function main() {
  console.log("🧪 Testing 18-Decimal Bridge Flows");
  console.log("Network:", network.name);
  console.log("Current time:", new Date().toISOString());
  
  if (network.name === "sepolia") {
    await testSepoliaLockMint();
  } else if (network.name === "coti") {
    await testCotiBurnUnlock();
  } else {
    console.log("❌ Unsupported network. Use --network sepolia or --network coti");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 