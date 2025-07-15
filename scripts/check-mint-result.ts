import { ethers } from "hardhat";

async function main() {
  console.log("Checking mint function result on COTI bridge...");

  try {
    // Connect to COTI network
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    console.log("Connected to COTI network");
    
    // Get the latest block
    const latestBlock = await cotiProvider.getBlockNumber();
    console.log("Latest block:", latestBlock);
    
    // Check the new bridge contract with mint function
    const bridgeAddress = "0xb681dFFC5182a4A878aE102D0a0FcA3a172DA35B";
    console.log("Checking bridge contract with mint function:", bridgeAddress);
    
    // Get contract code to verify it exists
    const code = await cotiProvider.getCode(bridgeAddress);
    console.log("Contract code length:", code.length);
    
    if (code === "0x") {
      console.log("❌ Contract not found at address");
      return;
    }
    
    console.log("✅ Contract found at address");
    
    // Try to get recent logs
    const fromBlock = Math.max(0, latestBlock - 100);
    console.log("Checking logs from block", fromBlock, "to", latestBlock);
    
    const logs = await cotiProvider.getLogs({
      address: bridgeAddress,
      fromBlock: fromBlock,
      toBlock: latestBlock,
    });
    
    console.log("Found", logs.length, "logs");
    
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      console.log(`\nLog ${i + 1}:`);
      console.log("- Block:", log.blockNumber);
      console.log("- Transaction:", log.transactionHash);
      console.log("- Topics:", log.topics);
      console.log("- Data:", log.data);
      
      // Try to decode the event
      try {
        // DebugInfo event signature
        const debugEventSignature = "DebugInfo(address,uint256,bool,uint32,bytes32)";
        const debugEventTopic = ethers.keccak256(debugEventSignature);
        
        if (log.topics[0] === debugEventTopic) {
          console.log("🔍 This is a DebugInfo event!");
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["address", "uint256", "bool", "uint32", "bytes32"],
            log.data
          );
          console.log("- User:", decoded[0]);
          console.log("- Amount:", decoded[1].toString());
          console.log("- IsMint:", decoded[2]);
          console.log("- Origin:", decoded[3].toString());
          console.log("- Sender:", decoded[4]);
        }
        
        // BridgeAction event signature
        const bridgeActionSignature = "BridgeAction(address,uint256,bool)";
        const bridgeActionTopic = ethers.keccak256(bridgeActionSignature);
        
        if (log.topics[0] === bridgeActionTopic) {
          console.log("🎯 This is a BridgeAction event!");
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["address", "uint256", "bool"],
            log.data
          );
          console.log("- User:", decoded[0]);
          console.log("- Amount:", decoded[1].toString());
          console.log("- IsMint:", decoded[2]);
        }
        
        // MessageReceived event signature
        const messageReceivedSignature = "MessageReceived(uint32,bytes32,address,uint256,bool)";
        const messageReceivedTopic = ethers.keccak256(messageReceivedSignature);
        
        if (log.topics[0] === messageReceivedTopic) {
          console.log("📨 This is a MessageReceived event!");
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["uint32", "bytes32", "address", "uint256", "bool"],
            log.data
          );
          console.log("- Origin:", decoded[0].toString());
          console.log("- Sender:", decoded[1]);
          console.log("- User:", decoded[2]);
          console.log("- Amount:", decoded[3].toString());
          console.log("- IsMint:", decoded[4]);
        }
        
        // RawMessage event signature
        const rawMessageSignature = "RawMessage(uint32,bytes32,bytes)";
        const rawMessageTopic = ethers.keccak256(rawMessageSignature);
        
        if (log.topics[0] === rawMessageTopic) {
          console.log("📦 This is a RawMessage event!");
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["uint32", "bytes32", "bytes"],
            log.data
          );
          console.log("- Origin:", decoded[0].toString());
          console.log("- Sender:", decoded[1]);
          console.log("- Message length:", decoded[2].length);
        }
        
      } catch (error) {
        console.log("Could not decode event:", error instanceof Error ? error.message : error);
      }
    }
    
    // Also check the COTI token contract for any mint events
    const tokenAddress = "0xC41bb5D7fec4aE9AE4f76C3300248b85EeA8Fe59";
    console.log("\n=== Checking COTI Token Contract ===");
    console.log("Token address:", tokenAddress);
    
    const tokenLogs = await cotiProvider.getLogs({
      address: tokenAddress,
      fromBlock: fromBlock,
      toBlock: latestBlock,
    });
    
    console.log("Found", tokenLogs.length, "token logs");
    
    for (let i = 0; i < tokenLogs.length; i++) {
      const log = tokenLogs[i];
      console.log(`\nToken Log ${i + 1}:`);
      console.log("- Block:", log.blockNumber);
      console.log("- Transaction:", log.transactionHash);
      console.log("- Topics:", log.topics);
      console.log("- Data:", log.data);
    }
    
    if (logs.length === 0 && tokenLogs.length === 0) {
      console.log("\n⚠️ No logs found in recent blocks");
      console.log("This could mean:");
      console.log("1. The message hasn't been delivered yet");
      console.log("2. The message was delivered but no events were emitted");
      console.log("3. The events are in older blocks");
      console.log("4. The mint function failed silently");
    } else if (logs.length > 0) {
      console.log("\n🎉 SUCCESS: Bridge events found!");
      console.log("The cross-chain message was delivered and processed");
      console.log("Check the events above for details");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 