import { ethers } from "hardhat";

async function main() {
    console.log("🔥 COTI Burn Test with Fixed Gas");
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

    console.log("\n🔥 Starting burn test with fixed gas parameters...");
    
    // Use a reasonable burn amount (1 cpUSDC)
    const burnAmount = ethers.parseUnits("1.0", 6);
    console.log("Burning:", ethers.formatUnits(burnAmount, 6), "cpUSDC");
    
    try {
        // Step 1: Approve with fixed gas
        console.log("\n1️⃣ Approving bridge to spend tokens...");
        const approveTx = await token["approve(address,uint256)"](bridge.target, burnAmount, {
            gasLimit: 100000,           // Fixed gas limit
            gasPrice: ethers.parseUnits("10", "gwei"), // Fixed gas price
            nonce: await deployer.getNonce() // Get nonce manually
        });
        
        console.log("Approve tx sent:", approveTx.hash);
        console.log("Waiting for approve confirmation...");
        
        const approveReceipt = await approveTx.wait();
        console.log("✅ Approval confirmed! Block:", approveReceipt?.blockNumber);
        console.log("Gas used:", approveReceipt?.gasUsed.toString());
        
        // Step 2: Burn with fixed gas
        console.log("\n2️⃣ Executing burn...");
        const burnTx = await bridge.burn(burnAmount, {
            value: ethers.parseEther("0.02"),  // Extra ETH for cross-chain message
            gasLimit: 1500000,                // High fixed gas limit
            gasPrice: ethers.parseUnits("10", "gwei"), // Fixed gas price  
            nonce: await deployer.getNonce()  // Get fresh nonce
        });
        
        console.log("🔥 Burn tx sent:", burnTx.hash);
        console.log("Waiting for burn confirmation...");
        
        const burnReceipt = await burnTx.wait();
        console.log("✅ Burn confirmed! Block:", burnReceipt?.blockNumber);
        console.log("Gas used:", burnReceipt?.gasUsed.toString());
        
        // Step 3: Check events
        console.log("\n3️⃣ Checking burn events...");
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
                console.log("  Sepolia User:", event.args?.sepoliaUser);
            } else {
                console.log("⚠️ No TokensBurned events found");
            }
        } catch (eventError) {
            console.log("Could not query events (RPC issue):", eventError);
        }
        
        // Step 4: Check updated balance
        console.log("\n4️⃣ Checking updated balance...");
        try {
            const newBalance = await token["balanceOf(address)"](deployer.address);
            console.log("Updated balance:", ethers.formatUnits(newBalance, 6), "cpUSDC");
            
            const burned = userBalance - newBalance;
            console.log("Tokens burned:", ethers.formatUnits(burned, 6), "cpUSDC");
        } catch (balanceError) {
            console.log("Could not check balance (RPC issue)");
        }
        
        console.log("\n🎯 Burn operation completed successfully!");
        console.log("💡 Cross-chain message sent to Sepolia");
        console.log("💡 Check Sepolia bridge for unlock confirmation");
        
    } catch (error: any) {
        console.error("❌ Burn test failed:");
        console.error("Error message:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Insufficient ETH for gas fees");
        } else if (error.message.includes("insufficient allowance")) {
            console.log("💡 Token approval may have failed");
        } else if (error.message.includes("pending block")) {
            console.log("💡 COTI RPC issue - transaction might still succeed");
            console.log("💡 Check transaction hash on COTI explorer");
        } else if (error.message.includes("nonce")) {
            console.log("💡 Nonce issue - transaction might be pending");
        }
        
        // Try to get transaction hash even if it failed
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