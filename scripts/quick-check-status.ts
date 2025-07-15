import { ethers } from "hardhat";

async function main() {
  console.log("Quick status check for cross-chain message delivery...");

  const messageId = "0xd93e4ebab407ac00ebc2e87dbaee9ea315fe0efe0973f0beecc75fd57956e642";
  console.log("Message ID:", messageId);

  try {
    // Connect to COTI network
    const cotiProvider = new ethers.JsonRpcProvider("https://testnet.coti.io/rpc");
    const cotiSigner = new ethers.Wallet("0xce785e1d3f790d1e8d67ea8e811741dbcb6f9d02c9dd0a232539b51d386beb03", cotiProvider);
    
    // Bridge and token addresses
    const bridgeAddress = "0xb681dFFC5182a4A878aE102D0a0FcA3a172DA35B";
    const tokenAddress = "0xC41bb5D7fec4aE9AE4f76C3300248b85EeA8Fe59";
    
    console.log("Bridge address:", bridgeAddress);
    console.log("Token address:", tokenAddress);
    
    // Get current block
    const currentBlock = await cotiProvider.getBlockNumber();
    console.log("Current block:", currentBlock);
    
    // Check recent bridge events (last 50 blocks)
    console.log("\n=== Checking Recent Bridge Events ===");
    const fromBlock = Math.max(0, currentBlock - 50);
    
    const bridgeLogs = await cotiProvider.getLogs({
      address: bridgeAddress,
      fromBlock: fromBlock,
      toBlock: currentBlock,
    });
    
    console.log("Found", bridgeLogs.length, "bridge logs in recent blocks");
    
    let messageDelivered = false;
    let bridgeActionExecuted = false;
    
    for (const log of bridgeLogs) {
      // Check for MessageReceived event
      const messageReceivedSignature = "MessageReceived(uint32,bytes32,address,uint256,bool)";
      const messageReceivedTopic = ethers.keccak256(messageReceivedSignature);
      
      if (log.topics[0] === messageReceivedTopic) {
        console.log("✅ MESSAGE DELIVERED!");
        messageDelivered = true;
        
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint32", "bytes32", "address", "uint256", "bool"],
          log.data
        );
        console.log("  - Block:", log.blockNumber);
        console.log("  - Origin:", decoded[0].toString());
        console.log("  - Sender:", decoded[1]);
        console.log("  - User:", decoded[2]);
        console.log("  - Amount:", decoded[3].toString());
        console.log("  - Is Mint:", decoded[4]);
      }
      
      // Check for BridgeAction event
      const bridgeActionSignature = "BridgeAction(address,uint256,bool)";
      const bridgeActionTopic = ethers.keccak256(bridgeActionSignature);
      
      if (log.topics[0] === bridgeActionTopic) {
        console.log("🌉 BRIDGE ACTION EXECUTED!");
        bridgeActionExecuted = true;
        
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["address", "uint256", "bool"],
          log.data
        );
        console.log("  - Block:", log.blockNumber);
        console.log("  - User:", decoded[0]);
        console.log("  - Amount:", decoded[1].toString());
        console.log("  - Is Mint:", decoded[2]);
      }
    }
    
    // Check recent token events
    console.log("\n=== Checking Recent Token Events ===");
    const tokenLogs = await cotiProvider.getLogs({
      address: tokenAddress,
      fromBlock: fromBlock,
      toBlock: currentBlock,
    });
    
    console.log("Found", tokenLogs.length, "token logs in recent blocks");
    
    let mintEventFound = false;
    
    for (const log of tokenLogs) {
      // Check for Transfer event (mint)
      const transferSignature = "Transfer(address,address,uint256)";
      const transferTopic = ethers.keccak256(transferSignature);
      
      if (log.topics[0] === transferTopic) {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["address", "address", "uint256"],
          log.data
        );
        
        if (decoded[0] === "0x0000000000000000000000000000000000000000") {
          console.log("🎉 TOKEN MINTED!");
          mintEventFound = true;
          console.log("  - Block:", log.blockNumber);
          console.log("  - To:", decoded[1]);
          console.log("  - Amount:", decoded[2].toString());
          console.log("  - Amount (formatted):", ethers.formatUnits(decoded[2], 6), "tokens");
        }
      }
    }
    
    // Check token total supply
    console.log("\n=== Checking Token Total Supply ===");
    const token = await ethers.getContractAt("CotiToken", tokenAddress, cotiSigner);
    const totalSupply = await token.totalSupply();
    console.log("Total Supply:", totalSupply.toString());
    
    console.log("\n=== Status Summary ===");
    if (messageDelivered) {
      console.log("✅ Cross-chain message was delivered");
    } else {
      console.log("⏳ Cross-chain message has not been delivered yet");
    }
    
    if (bridgeActionExecuted) {
      console.log("✅ Bridge action was executed");
    } else {
      console.log("⏳ Bridge action has not been executed yet");
    }
    
    if (mintEventFound) {
      console.log("🎉 Tokens were minted successfully");
    } else {
      console.log("⚠️ No mint events found yet");
    }
    
    if (totalSupply > 0) {
      console.log("💰 Token supply is greater than 0 - minting occurred!");
    } else {
      console.log("💤 Token supply is still 0 - no minting yet");
    }
    
    console.log("\n=== Next Steps ===");
    console.log("1. If no delivery yet, wait a few more minutes");
    console.log("2. Check Hyperlane explorer: https://explorer.hyperlane.xyz/");
    console.log("3. Search for message ID:", messageId);
    console.log("4. Run this script again: npm run quick-check-status");
    
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