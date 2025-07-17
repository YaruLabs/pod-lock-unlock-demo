import { ethers } from "hardhat";

async function main() {
    console.log("🔥 Simple COTI Burn Test (Fixed)");
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

    if (userBalance > 0n) {
        console.log("\n🔥 Testing burn function...");
        
        // Use a reasonable burn amount (1 cpUSDC)
        const burnAmount = ethers.parseUnits("1.0", 6);
        console.log("Burning:", ethers.formatUnits(burnAmount, 6), "cpUSDC");
        
        try {
            // Use explicit function signature for approve
            console.log("Approving bridge to spend tokens...");
            const approveTx = await token["approve(address,uint256)"](bridge.target, burnAmount);
            const approveReceipt = await approveTx.wait();
            console.log("✅ Approval successful, gas used:", approveReceipt?.gasUsed.toString());
            
            // Now burn
            console.log("Executing burn...");
            const burnTx = await bridge.burn(burnAmount, {
                value: ethers.parseEther("0.01"), // Add some ETH for gas
                gasLimit: 1000000
            });
            
            console.log("🔥 Burn transaction sent:", burnTx.hash);
            const receipt = await burnTx.wait();
            console.log("✅ Burn successful! Block:", receipt?.blockNumber);
            console.log("Gas used:", receipt?.gasUsed.toString());
            
            // Check for burn events
            console.log("\n📜 Checking for TokensBurned events...");
            try {
                const events = await bridge.queryFilter(
                    bridge.filters.TokensBurned(), 
                    receipt?.blockNumber, 
                    receipt?.blockNumber
                );
                
                if (events.length > 0) {
                    console.log("✅ TokensBurned event found!");
                    const event = events[0];
                    console.log("  User:", event.args?.user);
                    console.log("  Amount:", ethers.formatUnits(event.args?.amount || 0, 6), "cpUSDC");
                    console.log("  Message ID:", event.args?.messageId);
                } else {
                    console.log("⚠️ No TokensBurned events found in this block");
                }
            } catch (eventError) {
                console.log("Could not query events:", eventError);
            }
            
            // Check updated balance
            const newBalance = await token["balanceOf(address)"](deployer.address);
            console.log("\n💰 Updated balance:", ethers.formatUnits(newBalance, 6), "cpUSDC");
            
            console.log("\n🎯 Burn test completed!");
            console.log("💡 Now check Sepolia bridge for confirmations...");
            
        } catch (error: any) {
            console.error("❌ Burn test failed:", error.message);
            if (error.message.includes("insufficient balance")) {
                console.log("💡 Token balance insufficient for burn amount");
            } else if (error.message.includes("allowance")) {
                console.log("💡 Approval may have failed");
            }
        }
        
    } else {
        console.log("❌ No tokens available for burn test");
        console.log("💡 Run the minting test first");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 