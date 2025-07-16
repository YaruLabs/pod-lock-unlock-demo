import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("🚀 Deploying Fixed COTI Token with Proper Burn Functionality");
    console.log("============================================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    console.log("\n📄 Deploying Fixed CotiToken...");
    
    try {
        const CotiToken = await ethers.getContractFactory("CotiToken");
        const token = await CotiToken.deploy({
            gasPrice: 1000000000, // 1 gwei
            gasLimit: 8000000
        });
        
        console.log("⏳ Waiting for deployment...");
        await token.waitForDeployment();
        
        const tokenAddress = await token.getAddress();
        console.log("✅ CotiToken deployed to:", tokenAddress);
        
        // Test basic functions
        console.log("\n🧪 Testing basic functions...");
        
        try {
            const name = await token.name();
            const symbol = await token.symbol();
            const decimals = await token.decimals();
            
            console.log("📝 Token name:", name);
            console.log("📝 Token symbol:", symbol);  
            console.log("📝 Token decimals:", decimals.toString());
            
        } catch (error) {
            console.log("⚠️ Could not read token info:", error.message);
        }
        
        // Save deployment info
        const deploymentInfo = {
            network: "coti",
            contracts: {
                CotiTokenFixed: tokenAddress
            },
            deployer: deployer.address,
            timestamp: new Date().toISOString()
        };
        
        // Create deployments directory if it doesn't exist
        if (!fs.existsSync("deployments")) {
            fs.mkdirSync("deployments");
        }
        
        fs.writeFileSync(
            "deployments/coti-fixed.json",
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log("\n✅ Deployment completed successfully!");
        console.log("📄 Address saved to deployments/coti-fixed.json");
        
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