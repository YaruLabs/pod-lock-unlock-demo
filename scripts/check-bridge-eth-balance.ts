import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Checking Sepolia Bridge ETH Balance");
    console.log("=====================================");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

    // Bridge address from deployments
    const bridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    
    // Check bridge ETH balance
    const bridgeBalance = await deployer.provider.getBalance(bridgeAddress);
    console.log("Bridge address:", bridgeAddress);
    console.log("Bridge ETH balance:", ethers.formatEther(bridgeBalance), "ETH");

    // If bridge has less than 0.005 ETH, fund it
    const minBalance = ethers.parseEther("0.005");
    if (bridgeBalance < minBalance) {
        console.log("\n💰 Bridge needs funding! Sending 0.008 ETH...");
        
        const fundAmount = ethers.parseEther("0.008");
        const tx = await deployer.sendTransaction({
            to: bridgeAddress,
            value: fundAmount,
            gasLimit: 21000
        });
        
        console.log("Funding transaction:", tx.hash);
        await tx.wait();
        
        const newBalance = await deployer.provider.getBalance(bridgeAddress);
        console.log("New bridge balance:", ethers.formatEther(newBalance), "ETH");
    } else {
        console.log("✅ Bridge has sufficient ETH balance");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 