import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Checking Sepolia Bridge Message");
    console.log("=================================");
    
    // Use the configured provider
    const [signer] = await ethers.getSigners();
    const provider = signer.provider;
    
    if (!provider) {
        throw new Error("No provider available");
    }
    
    // Bridge contract
    const bridgeAddress = "0x371F045B08772E36E352F67C38868FFC4113fF85";
    const bridgeAbi = [
        "event TokensLocked(address indexed user, uint256 amount, bytes32 messageId)",
        "event MessageSent(uint32 indexed destination, bytes32 indexed recipient, bytes message)"
    ];
    
    const bridge = new ethers.Contract(bridgeAddress, bridgeAbi, provider);
    
    // Get recent blocks
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 100; // Check last 100 blocks
    
    console.log(`📊 Checking blocks ${fromBlock} to ${currentBlock}`);
    
    // Get TokensLocked events
    const lockedEvents = await bridge.queryFilter(
        bridge.filters.TokensLocked(),
        fromBlock,
        currentBlock
    );
    
    console.log(`🔒 Found ${lockedEvents.length} TokensLocked events`);
    
    // Get the most recent event
    const latestEvent = lockedEvents[lockedEvents.length - 1];
    
    if (latestEvent) {
        console.log(`\n🔒 Latest Locked Event (Block ${latestEvent.blockNumber}):`);
        console.log(`   User: ${latestEvent.args.user}`);
        console.log(`   Amount: ${latestEvent.args.amount.toString()}`);
        console.log(`   Message ID: ${latestEvent.args.messageId}`);
        console.log(`   Tx: ${latestEvent.transactionHash}`);
        
        // Get the full transaction details
        const tx = await provider.getTransaction(latestEvent.transactionHash);
        const receipt = await provider.getTransactionReceipt(latestEvent.transactionHash);
        
        if (tx) {
            console.log(`\n📝 Transaction Details:`);
            console.log(`   Data: ${tx.data}`);
            console.log(`   Data Length: ${tx.data.length}`);
            console.log(`   Value: ${tx.value}`);
            console.log(`   Gas Used: ${receipt?.gasUsed}`);
            
            // Try to decode the transaction data using the bridge interface
            const bridgeInterface = new ethers.Interface([
                "function lockTokens(uint256 amount)",
                "function lockTokensWithCallback(uint256 amount, address callback)"
            ]);
            
            try {
                const decoded = bridgeInterface.parseTransaction({ data: tx.data });
                console.log(`   ✅ Decoded Function: ${decoded?.name}`);
                console.log(`   ✅ Decoded Args:`, decoded?.args);
            } catch (error) {
                console.log(`   ❌ Could not decode transaction`);
            }
        }
        
        // Get all events from this transaction
        if (receipt) {
            console.log(`\n📋 All Events in Transaction:`);
            for (let i = 0; i < receipt.logs.length; i++) {
                const log = receipt.logs[i];
                console.log(`   Event ${i}: ${log.topics[0]} from ${log.address}`);
                
                // Try to decode known events
                try {
                    const bridgeInterface = new ethers.Interface([
                        "event TokensLocked(address indexed user, uint256 amount, bytes32 messageId)",
                        "event MessageSent(uint32 indexed destination, bytes32 indexed recipient, bytes message)"
                    ]);
                    
                    const decoded = bridgeInterface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    
                    if (decoded) {
                        console.log(`     ✅ ${decoded.name}:`, decoded.args);
                        
                        // If this is a MessageSent event, check the message content
                        if (decoded.name === "MessageSent") {
                            console.log(`     📨 Message Data: ${decoded.args.message}`);
                            console.log(`     📏 Message Length: ${decoded.args.message.length}`);
                            
                            // Try to decode the message
                            try {
                                const decodedMessage = ethers.AbiCoder.defaultAbiCoder().decode(
                                    ["address", "uint256", "bool"],
                                    decoded.args.message
                                );
                                console.log(`     ✅ Decoded Message:`);
                                console.log(`        User: ${decodedMessage[0]}`);
                                console.log(`        Amount: ${decodedMessage[1].toString()}`);
                                console.log(`        Is Mint: ${decodedMessage[2]}`);
                            } catch (err) {
                                console.log(`     ❌ Could not decode message: ${err}`);
                            }
                        }
                    }
                } catch (error) {
                    // Not a bridge event, skip
                }
            }
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 