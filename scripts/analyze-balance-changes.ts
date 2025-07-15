import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Analyzing COTI Balance Changes ===\n");

  // COTI network setup
  const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
  const cotiWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, cotiProvider);

  const cotiTokenAddress = "0xC41bb5D7fec4aE9AE4f76C3300248b85EeA8Fe59";
  const cotiBridgeAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const testUser = "0x30a6C9D1d70d41756673Cce044189577F0953a75";

  console.log("Analyzing:");
  console.log("- Token:", cotiTokenAddress);
  console.log("- Bridge:", cotiBridgeAddress);
  console.log("- User:", testUser);
  console.log();

  // Token ABI with transfer and mint events
  const tokenABI = [
    "function balanceOf(address account) external view returns (uint64)",
    "function mint(address to, uint256 amount) external",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event MintEvent(address indexed to, uint256 amount)" // If exists
  ];

  const cotiToken = new ethers.Contract(cotiTokenAddress, tokenABI, cotiProvider);

  // Get current balance
  try {
    const currentBalance = await cotiToken.balanceOf(testUser);
    console.log("🔍 Current Balance Analysis:");
    console.log("- Raw balance:", currentBalance.toString());
    console.log("- Formatted balance:", ethers.formatUnits(currentBalance, 18));
    console.log("- In millions:", (Number(ethers.formatUnits(currentBalance, 18)) / 1000000).toFixed(2), "M tokens");
    console.log();
  } catch (error) {
    console.error("Error getting balance:", error.message);
  }

  // Check recent Transfer events (includes mints)
  try {
    console.log("🔎 Analyzing Recent Transfer Events...");
    
    const currentBlock = await cotiProvider.getBlockNumber();
    console.log("Current block:", currentBlock);
    
    // Look at last 1000 blocks
    const fromBlock = Math.max(1, currentBlock - 1000);
    
    const transferFilter = cotiToken.filters.Transfer(null, testUser);
    const transferEvents = await cotiToken.queryFilter(transferFilter, fromBlock, "latest");
    
    console.log(`Found ${transferEvents.length} Transfer events to ${testUser} in last 1000 blocks:`);
    
    let totalMinted = 0n;
    
    for (const event of transferEvents.slice(-10)) { // Show last 10 events
      const block = await cotiProvider.getBlock(event.blockNumber);
      const timestamp = new Date(block.timestamp * 1000);
      
      console.log(`\n📝 Transfer Event:`);
      console.log(`- Block: ${event.blockNumber}`);
      console.log(`- Time: ${timestamp.toISOString()}`);
      console.log(`- From: ${event.args.from}`);
      console.log(`- To: ${event.args.to}`);
      console.log(`- Amount: ${event.args.value.toString()}`);
      console.log(`- Amount (formatted): ${ethers.formatUnits(event.args.value, 18)} tokens`);
      
      // Check if it's a mint (from zero address)
      if (event.args.from === ethers.ZeroAddress) {
        console.log(`- 🏭 MINT EVENT detected!`);
        totalMinted += event.args.value;
      }
    }
    
    if (totalMinted > 0n) {
      console.log(`\n💰 Total Minted in Recent History: ${ethers.formatUnits(totalMinted, 18)} tokens`);
    }
    
  } catch (error) {
    console.error("Error analyzing Transfer events:", error.message);
  }

  // Check recent transactions from our wallet
  try {
    console.log("\n🔍 Checking Recent Mint Transactions...");
    
    const currentBlock = await cotiProvider.getBlockNumber();
    const fromBlock = Math.max(1, currentBlock - 100);
    
    for (let blockNum = currentBlock; blockNum >= fromBlock; blockNum--) {
      try {
        const block = await cotiProvider.getBlock(blockNum, true);
        
        for (const tx of block.transactions) {
          if (tx.to?.toLowerCase() === cotiTokenAddress.toLowerCase() && 
              tx.from?.toLowerCase() === testUser.toLowerCase()) {
            
            console.log(`\n📄 Transaction in block ${blockNum}:`);
            console.log(`- Hash: ${tx.hash}`);
            console.log(`- From: ${tx.from}`);
            console.log(`- To: ${tx.to}`);
            console.log(`- Data: ${tx.data}`);
            
            // Try to decode if it's a mint call
            if (tx.data.startsWith("0x40c10f19")) { // mint(address,uint256) selector
              try {
                const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                  ["address", "uint256"], 
                  "0x" + tx.data.slice(10)
                );
                console.log(`- 🏭 MINT CALL detected!`);
                console.log(`- Mint to: ${decoded[0]}`);
                console.log(`- Mint amount: ${decoded[1].toString()}`);
                console.log(`- Mint amount (formatted): ${ethers.formatUnits(decoded[1], 18)} tokens`);
              } catch (e) {
                console.log(`- Could not decode mint data`);
              }
            }
          }
        }
      } catch (e) {
        // Skip blocks that can't be fetched
      }
    }
    
  } catch (error) {
    console.error("Error checking recent transactions:", error.message);
  }

  console.log("\n=== Analysis Summary ===");
  console.log("The dramatic balance increase suggests:");
  console.log("1. 🔴 Multiple mint operations have occurred");
  console.log("2. 🔴 Mint amounts may be incorrect (using wrong decimals?)");
  console.log("3. 🔴 Bridge may be minting on every test, not just cross-chain messages");
  console.log("4. 🔴 Test mint calls may be accumulating");
  
  console.log("\n💡 Recommendations:");
  console.log("1. Check if bridge is receiving duplicate messages");
  console.log("2. Verify mint amount calculations (18 decimals vs 6 decimals)");
  console.log("3. Add better mint amount validation");
  console.log("4. Consider implementing maximum mint limits");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 