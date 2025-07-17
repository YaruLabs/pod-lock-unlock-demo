import { ethers } from "hardhat";

async function main() {
    console.log("🔥 Simple Burn Test (No Approve)");
    console.log("=================================");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    const cotiTokenAddress = "0x3371F18A7a0704e7F3f33322F650575C6846bd9a";
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    // Get contract instances
    const CotiToken = await ethers.getContractFactory("CotiToken");
    const token = CotiToken.attach(cotiTokenAddress);

    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    // Check current balance
    const userBalance = await token["balanceOf(address)"](deployer.address);
    console.log("Current cpUSDC balance:", ethers.formatUnits(userBalance, 6), "cpUSDC");

    if (userBalance === 0n) {
        console.log("❌ No tokens available. Cannot test burn function.");
        return;
    }

    // Check current allowance
    try {
        const currentAllowance = await token["allowance(address,address)"](deployer.address, bridge.target);
        console.log("Current allowance:", ethers.formatUnits(currentAllowance, 6), "cpUSDC");
    } catch (allowanceError) {
        console.log("Could not check allowance");
    }

    console.log("\n🔥 Testing burn function directly...");
    
    // Use a small burn amount
    const burnAmount = ethers.parseUnits("0.000001", 6); // 0.000001 cpUSDC (very small)
    console.log("Burning:", ethers.formatUnits(burnAmount, 6), "cpUSDC");
    
    try {
        // Try burn directly with fixed gas
        console.log("Executing burn with fixed gas...");
        const burnTx = await bridge.burn(burnAmount, {
            value: ethers.parseEther("0.05"),  // More ETH for cross-chain message
            gasLimit: 2000000,                // Very high gas limit
            gasPrice: ethers.parseUnits("5", "gwei"), // Lower gas price
            nonce: await deployer.getNonce()
        });
        
        console.log("🔥 Burn tx sent:", burnTx.hash);
        console.log("Block submitted, waiting for confirmation...");
        
        // Wait for confirmation with timeout
        try {
            const burnReceipt = await burnTx.wait();
            console.log("✅ Burn confirmed! Block:", burnReceipt?.blockNumber);
            console.log("Gas used:", burnReceipt?.gasUsed.toString());
            
            // Check for burn events
            try {
                const events = await bridge.queryFilter(
                    bridge.filters.TokensBurned(), 
                    burnReceipt?.blockNumber, 
                    burnReceipt?.blockNumber
                );
                
                if (events.length > 0) {
                    console.log("🎉 TokensBurned event found!");
                    const event = events[0];
                    console.log("  User:", event.args?.user);
                    console.log("  Amount:", ethers.formatUnits(event.args?.amount || 0, 6), "cpUSDC");
                    console.log("  Message ID:", event.args?.messageId);
                } else {
                    console.log("⚠️ No TokensBurned events found");
                }
            } catch (eventError) {
                console.log("Could not query events (RPC issue)");
            }
            
            console.log("\n🎯 Burn operation completed!");
            console.log("💡 Now check Sepolia for unlock confirmation");
            
        } catch (waitError: any) {
            console.log("⚠️ Wait failed but transaction was sent:", burnTx.hash);
            console.log("💡 Transaction might still succeed - check COTI explorer");
        }
        
    } catch (error: any) {
        console.error("❌ Burn failed:");
        console.error("Error:", error.message);
        
        if (error.message.includes("ERC20InsufficientAllowance")) {
            console.log("💡 Need to approve bridge first");
            
            // Try to set allowance with a very high gas limit
            console.log("\n🔓 Trying to set allowance...");
            try {
                const allowanceTx = await token["approve(address,uint256)"](bridge.target, userBalance, {
                    gasLimit: 200000,
                    gasPrice: ethers.parseUnits("5", "gwei"),
                    nonce: await deployer.getNonce()
                });
                
                console.log("Allowance tx sent:", allowanceTx.hash);
                console.log("💡 Try running the script again after this confirms");
                
            } catch (approveError) {
                console.log("❌ Approve also failed:", approveError);
            }
        }
        
        if (error.transaction?.hash) {
            console.log("Transaction hash:", error.transaction.hash);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script error:", error);
        process.exit(1);
    }); 