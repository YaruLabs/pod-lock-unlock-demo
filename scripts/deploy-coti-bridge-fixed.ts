import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("🚀 Deploying COTI Bridge with Fixed Token");
    console.log("==========================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Read fixed token deployment
    const tokenDeployment = JSON.parse(fs.readFileSync("deployments/coti-fixed.json", "utf8"));
    const tokenAddress = tokenDeployment.contracts.CotiTokenFixed;
    
    console.log("🪙 Using Fixed Token:", tokenAddress);
    
    // Hyperlane configuration
    const hyperlaneMailbox = "0x7FE7EA170cf08A25C2ff315814D96D93C311E692";
    const sepoliaDomain = 11155111;
    const sepoliaBridgeAddress = "0x7e15E19218b2f105bb85ea6476521FBECbe3B5a3";
    
    console.log("\n📄 Deploying CotiBridge...");
    
    try {
        const CotiBridge = await ethers.getContractFactory("CotiBridge");
        const bridge = await CotiBridge.deploy(
            tokenAddress,
            hyperlaneMailbox,
            {
                gasPrice: 1000000000, // 1 gwei
                gasLimit: 8000000
            }
        );
        
        console.log("⏳ Waiting for deployment...");
        await bridge.waitForDeployment();
        
        const bridgeAddress = await bridge.getAddress();
        console.log("✅ CotiBridge deployed to:", bridgeAddress);
        
        // Configure the bridge
        console.log("\n🔧 Configuring bridge...");
        
        // Set Sepolia bridge address
        const sepoliaBridgeBytes32 = ethers.zeroPadValue(sepoliaBridgeAddress, 32);
        
        const configTx = await bridge.setSepoliaBridgeAddress(sepoliaBridgeBytes32, {
            gasPrice: 1000000000,
            gasLimit: 200000
        });
        
        await configTx.wait();
        console.log("✅ Bridge configured with Sepolia address");
        
        // Test bridge configuration
        console.log("\n🧪 Testing bridge configuration...");
        
        try {
            const configuredSepoliaBridge = await bridge.sepoliaBridgeAddress();
            const sepoliaDomainFromContract = await bridge.sepoliaDomain();
            
            console.log("📋 Bridge Configuration:");
            console.log("- Sepolia Bridge:", configuredSepoliaBridge);
            console.log("- Sepolia Domain:", sepoliaDomainFromContract.toString());
            console.log("- Token Address:", await bridge.token());
            console.log("- Mailbox Address:", await bridge.mailbox());
            
        } catch (error) {
            console.log("⚠️ Could not read bridge config:", error.message);
        }
        
        // Save deployment info
        const deploymentInfo = {
            network: "coti",
            contracts: {
                CotiTokenFixed: tokenAddress,
                CotiBridgeFixed: bridgeAddress
            },
            deployer: deployer.address,
            hyperlane: {
                mailbox: hyperlaneMailbox,
                sepoliaDomain: sepoliaDomain,
                sepoliaBridgeAddress: sepoliaBridgeAddress
            },
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(
            "deployments/coti-bridge-fixed.json",
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log("\n✅ Bridge deployment completed successfully!");
        console.log("📄 Address saved to deployments/coti-bridge-fixed.json");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Script failed:", error);
        process.exit(1);
    }); 