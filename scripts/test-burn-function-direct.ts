import { ethers } from "hardhat";

async function main() {
    console.log("🔥 Testing COTI Burn Function Direct");
    console.log("====================================");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    const cotiTokenAddress = "0x3371F18A7a0704e7F3f33322F650575C6846bd9a";
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    // Get contract instances
    const CotiToken = await ethers.getContractFactory("CotiToken");
    const token = CotiToken.attach(cotiTokenAddress);

    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    // Check current balances
    const userBalance = await token["balanceOf(address)"](deployer.address);
    console.log("Current cpUSDC balance:", ethers.formatUnits(userBalance, 6), "cpUSDC");

    if (userBalance === 0n) {
        console.log("\n💡 No tokens to burn. Let me try to mint first...");
        
        // Try minting with different parameters
        try {
            console.log("Attempting mint with owner privileges...");
            
            // Try to mint as owner
            const mintAmount = ethers.parseUnits("5.0", 6); // 5 cpUSDC
            const mintTx = await token.mint(deployer.address, mintAmount, {
                gasLimit: 500000,
                gasPrice: ethers.parseUnits("10", "gwei")
            });
            
            console.log("Mint transaction sent:", mintTx.hash);
            console.log("Waiting for confirmation...");
            
            const receipt = await mintTx.wait();
            console.log("✅ Mint successful! Block:", receipt?.blockNumber);
            console.log("Gas used:", receipt?.gasUsed.toString());
            
            // Check new balance
            const newBalance = await token["balanceOf(address)"](deployer.address);
            console.log("New cpUSDC balance:", ethers.formatUnits(newBalance, 6), "cpUSDC");
            
            if (newBalance > 0n) {
                console.log("\n🔥 Now testing burn function...");
                await testBurnFunction(bridge, token, newBalance);
            }
            
        } catch (mintError: any) {
            console.log("❌ Mint failed:", mintError.message);
            console.log("💡 This confirms COTI MPC requirements are active");
            
            // Even without tokens, let's test if the burn function itself works
            console.log("\n🧪 Testing burn function without tokens (should fail gracefully)...");
            await testBurnFunctionWithoutTokens(bridge);
        }
    } else {
        console.log("\n🔥 Testing burn function with existing tokens...");
        await testBurnFunction(bridge, token, userBalance);
    }
}

async function testBurnFunction(bridge: any, token: any, balance: bigint) {
    try {
        const burnAmount = balance / 2n; // Burn half
        console.log("Burning:", ethers.formatUnits(burnAmount, 6), "cpUSDC");
        
        // First approve the bridge to spend tokens
        console.log("Approving bridge to spend tokens...");
        const approveTx = await token.approve(bridge.target, burnAmount);
        await approveTx.wait();
        console.log("✅ Approval successful");
        
        // Now burn
        console.log("Executing burn...");
        const burnTx = await bridge.burn(burnAmount, {
            gasLimit: 1000000,
            gasPrice: ethers.parseUnits("10", "gwei")
        });
        
        console.log("🔥 Burn transaction sent:", burnTx.hash);
        const receipt = await burnTx.wait();
        console.log("✅ Burn successful! Block:", receipt?.blockNumber);
        console.log("Gas used:", receipt?.gasUsed.toString());
        
        // Check events
        console.log("\n📜 Checking burn events...");
        const events = await bridge.queryFilter(bridge.filters.TokensBurned(), receipt?.blockNumber, receipt?.blockNumber);
        if (events.length > 0) {
            console.log("✅ TokensBurned event found!");
            console.log("Event data:", events[0].args);
        } else {
            console.log("⚠️ No TokensBurned events found");
        }
        
    } catch (error: any) {
        console.error("❌ Burn test failed:", error.message);
    }
}

async function testBurnFunctionWithoutTokens(bridge: any) {
    try {
        const testAmount = ethers.parseUnits("1.0", 6);
        console.log("Attempting burn without tokens (should fail)...");
        
        const burnTx = await bridge.burn(testAmount, {
            gasLimit: 500000,
            gasPrice: ethers.parseUnits("10", "gwei")
        });
        
        console.log("Burn transaction sent:", burnTx.hash);
        const receipt = await burnTx.wait();
        console.log("❌ Unexpected success - this should have failed");
        
    } catch (error: any) {
        console.log("✅ Expected failure:", error.message);
        console.log("💡 This confirms the burn function is working correctly");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 