import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Usage:
// npx hardhat run scripts/new/fetch-coti-tx-details.ts --network coti

const TX_HASH = "0xeec796fcbb5fa8f19784ec71794f584e19563ff9630eb6002083e42148fe6c6f";
const CONTRACT_ADDRESS = "0x7FE7EA170cf08A25C2ff315814D96D93C311E692";

async function main() {
  console.log("🔎 Fetching COTI transaction details and events");
  console.log("==============================================");
  console.log("Transaction hash:", TX_HASH);

  const provider = ethers.provider;

  // Load ABI from artifact
  const artifactPath = path.join(
    __dirname,
    "../../artifacts/contracts/CotiBridge.sol/CotiBridge.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  try {
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    if (!receipt) {
      console.log("❌ Transaction receipt not found");
      return;
    }
    console.log("\nTransaction Receipt:");
    console.log(receipt);

    console.log("\n📋 All Logs from Transaction:");
    console.log("=============================");
    
    if (receipt.logs.length === 0) {
      console.log("No logs found in transaction");
    } else {
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`\nLog ${i + 1}:`);
        console.log(`  Address: ${log.address}`);
        console.log(`  Topics: ${log.topics}`);
        console.log(`  Data: ${log.data}`);
        
        // Try to decode with CotiBridge ABI
        if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
          const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed) {
              console.log(`  ✅ Decoded Event: ${parsed.name}`);
              console.log(`  Arguments:`, parsed.args);
            }
          } catch (e: any) {
            console.log(`  ❌ Failed to decode with CotiBridge ABI: ${e.message}`);
          }
        } else {
          console.log(`  ℹ️  Not from CotiBridge contract`);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Error fetching transaction details:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 