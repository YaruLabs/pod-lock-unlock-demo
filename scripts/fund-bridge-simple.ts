import { ethers } from "hardhat";

async function main() {
    console.log("💰 Funding Sepolia Bridge");
    console.log("=========================");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

    const bridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    
    const currentBalance = await deployer.provider.getBalance(bridgeAddress);
    console.log("Current bridge balance:", ethers.formatEther(currentBalance), "ETH");

    const fundAmount = ethers.parseEther("0.005");
    console.log("Attempting to send:", ethers.formatEther(fundAmount), "ETH");

    try {
        const gasEstimate = await deployer.estimateGas({
            to: bridgeAddress,
            value: fundAmount
        });
        console.log("Gas estimate:", gasEstimate.toString());

        const tx = await deployer.sendTransaction({
            to: bridgeAddress,
            value: fundAmount,
            gasLimit: gasEstimate + 10000n
        });
        
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt?.blockNumber);
        
        const newBalance = await deployer.provider.getBalance(bridgeAddress);
        console.log("New bridge balance:", ethers.formatEther(newBalance), "ETH");
        
    } catch (error) {
        console.error("❌ Funding failed:", error);
    }
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});
