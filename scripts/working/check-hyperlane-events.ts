import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Checking Hyperlane Mailbox Events");
    console.log("===================================");
    
    // Use the configured provider
    const [signer] = await ethers.getSigners();
    const provider = signer.provider;
    
    if (!provider) {
        throw new Error("No provider available");
    }
    
    // Hyperlane Mailbox on Sepolia (from our hardhat config)
    const mailboxAddress = "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766";
    
    // Transaction hash we want to analyze
    const txHash = "0xded23812c30aa38958cd299d63d5133da1b2fee372f587ca2873136dfc6139e8";
    
    console.log(`📋 Analyzing transaction: ${txHash}`);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
        console.log("❌ Transaction not found");
        return;
    }
    
    console.log(`📊 Transaction has ${receipt.logs.length} logs`);
    
    // Hyperlane Mailbox events
    const mailboxInterface = new ethers.Interface([
        "event Dispatch(address indexed sender, uint32 indexed destination, bytes32 indexed recipient, bytes message)",
        "event DispatchId(bytes32 indexed messageId)"
    ]);
    
    // Check each log
    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`\n📝 Log ${i}:`);
        console.log(`   Address: ${log.address}`);
        console.log(`   Topics: ${log.topics.join(', ')}`);
        
        // Check if this is from the Mailbox
        if (log.address.toLowerCase() === mailboxAddress.toLowerCase()) {
            console.log(`   ✅ This is a Mailbox event!`);
            
            try {
                const decoded = mailboxInterface.parseLog({
                    topics: log.topics,
                    data: log.data
                });
                
                if (decoded) {
                    console.log(`   🎯 Event: ${decoded.name}`);
                    
                    if (decoded.name === "Dispatch") {
                        console.log(`   📤 Sender: ${decoded.args.sender}`);
                        console.log(`   🎯 Destination: ${decoded.args.destination}`);
                        console.log(`   📧 Recipient: ${decoded.args.recipient}`);
                        console.log(`   📨 Message: ${decoded.args.message}`);
                        console.log(`   📏 Message Length: ${decoded.args.message.length}`);
                        
                        // Try to decode the message as (address, uint256, bool)
                        try {
                            const decodedMessage = ethers.AbiCoder.defaultAbiCoder().decode(
                                ["address", "uint256", "bool"],
                                decoded.args.message
                            );
                            console.log(`   ✅ Decoded Message:`);
                            console.log(`      User: ${decodedMessage[0]}`);
                            console.log(`      Amount: ${decodedMessage[1].toString()}`);
                            console.log(`      Is Mint: ${decodedMessage[2]}`);
                            
                            // Format amount
                            const readableAmount = ethers.formatUnits(decodedMessage[1], 18);
                            console.log(`      Amount (formatted): ${readableAmount} tokens`);
                            
                        } catch (err) {
                            console.log(`   ❌ Could not decode message as (address, uint256, bool)`);
                            console.log(`   Error: ${err}`);
                            
                            // Try other formats
                            try {
                                const decodedAsBytes = ethers.AbiCoder.defaultAbiCoder().decode(
                                    ["address", "uint256"],
                                    decoded.args.message
                                );
                                console.log(`   🔄 Trying (address, uint256):`);
                                console.log(`      User: ${decodedAsBytes[0]}`);
                                console.log(`      Amount: ${decodedAsBytes[1].toString()}`);
                            } catch (err2) {
                                console.log(`   ❌ Could not decode as (address, uint256) either`);
                            }
                        }
                    } else if (decoded.name === "DispatchId") {
                        console.log(`   🆔 Message ID: ${decoded.args.messageId}`);
                    }
                }
            } catch (error) {
                console.log(`   ❌ Could not decode Mailbox event: ${error}`);
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