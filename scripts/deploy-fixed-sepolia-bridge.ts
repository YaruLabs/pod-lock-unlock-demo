import { ethers } from "hardhat";

async function main() {
    console.log("🔧 Deploying Fixed Sepolia Bridge with Decimal Conversion");
    console.log("========================================================");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Get current balance
    const balance = await deployer.provider!.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Contract addresses for Sepolia
    const mailboxAddress = "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766";
    const tokenAddress = "0x9d422b5ef943517eBdF5B4b5F36a9748B77D3e37";
    const cotiDomain = 7082400;
    const cotiBridgeAddress = "0x461E03AA6375b82dd8574E67b6E2119ec2bC27aB";

    console.log("\n📋 Configuration:");
    console.log("Mailbox:", mailboxAddress);
    console.log("Token:", tokenAddress);
    console.log("COTI Domain:", cotiDomain);
    console.log("COTI Bridge:", cotiBridgeAddress);

    try {
        // Deploy SepoliaBridge with decimal conversion fix
        console.log("\n🚀 Deploying SepoliaBridge with decimal conversion fix...");
        
        const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
        const sepoliaBridge = await SepoliaBridge.deploy(
            mailboxAddress,
            tokenAddress,
            cotiDomain,
            `0x${cotiBridgeAddress.slice(2).padStart(64, '0')}` // Convert to bytes32
        );

        await sepoliaBridge.waitForDeployment();
        const sepoliaBridgeAddress = await sepoliaBridge.getAddress();

        console.log("✅ SepoliaBridge deployed to:", sepoliaBridgeAddress);

        // Verify deployment
        console.log("\n🔍 Verifying deployment...");
        
        const configMailbox = await sepoliaBridge.mailbox();
        const configToken = await sepoliaBridge.token();
        const configCotiDomain = await sepoliaBridge.cotiDomain();
        const configCotiBridge = await sepoliaBridge.cotiBridgeAddress();

        console.log("Mailbox address:", configMailbox);
        console.log("Token address:", configToken);
        console.log("COTI domain:", configCotiDomain.toString());
        console.log("COTI bridge:", configCotiBridge);

        console.log("\n=== DECIMAL CONVERSION FIX ===");
        console.log("✅ Added decimal conversion logic to handle function:");
        console.log("  - Detects 18-decimal amounts (> 1e9)");
        console.log("  - Converts: amount / 1e12 (18 → 6 decimals)");
        console.log("  - Uses converted amount for validation and transfers");
        
        console.log("\n📊 Test Scenario:");
        console.log("- COTI sends: 50,000,000,000,000,000,000 (50 cpUSDC in 18 decimals)");
        console.log("- Bridge detects: amount > 1e9, applies conversion");
        console.log("- Converted: 50,000,000,000,000,000,000 / 1e12 = 50,000,000");
        console.log("- Result: 50.0 sUSDC unlock (6 decimals) ✅");

        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("✅ SepoliaBridge (Fixed):", sepoliaBridgeAddress);
        console.log("🔧 Decimal conversion: Auto-detects and converts 18→6 decimals");
        console.log("🎯 Ready to handle COTI burn messages correctly");
        
        // Save deployment info
        const deploymentInfo = {
            network: "sepolia",
            contracts: {
                SepoliaBridge: sepoliaBridgeAddress,
                SepoliaToken: tokenAddress
            },
            configuration: {
                mailbox: mailboxAddress,
                cotiDomain: cotiDomain,
                cotiBridge: cotiBridgeAddress
            },
            fix: "Added decimal conversion from 18 (COTI) to 6 (Sepolia) decimals",
            deployer: deployer.address,
            timestamp: new Date().toISOString()
        };

        console.log("\n📁 Deployment info:");
        console.log(JSON.stringify(deploymentInfo, null, 2));

        console.log("\n📋 Next Steps:");
        console.log("==============");
        console.log("1. 🔄 Update COTI bridge to point to new Sepolia bridge");
        console.log("2. 🧪 Test burn/unlock with fixed decimal conversion");
        console.log("3. ✅ Should resolve 'Insufficient locked tokens' error");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 