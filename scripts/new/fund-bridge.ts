import { ethers } from "hardhat";
import * as fs from "fs";

// Usage:
// npx hardhat run scripts/new/fund-bridge.ts --network sepolia
// npx hardhat run scripts/new/fund-bridge.ts --network coti

async function main() {
    // Chain IDs
    const SEPOLIA_CHAIN_ID = 11155111n;
    const COTI_CHAIN_ID = 7082400n; // COTI chain ID (user rule)

    const networkInfo = await ethers.provider.getNetwork();
    let bridgeType: "sepolia" | "coti" | undefined;
    if (networkInfo.chainId === SEPOLIA_CHAIN_ID) {
        bridgeType = "sepolia";
    } else if (networkInfo.chainId === COTI_CHAIN_ID) {
        bridgeType = "coti";
    } else {
        console.log(`This script only supports Sepolia (chainId: ${SEPOLIA_CHAIN_ID}) or COTI (chainId: ${COTI_CHAIN_ID}) networks. Current chainId: ${networkInfo.chainId}`);
        process.exit(1);
    }

    console.log(`💰 Funding ${bridgeType === "sepolia" ? "Sepolia" : "COTI"} Bridge`);
    console.log("=========================");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    // Load deployment files
    let sepoliaDeployment: any;
    let cotiDeployment: any;

    try {
        sepoliaDeployment = JSON.parse(fs.readFileSync("deployments/sepolia.json", "utf8"));
        cotiDeployment = JSON.parse(fs.readFileSync("deployments/coti.json", "utf8"));
    } catch (error) {
        console.error("Error loading deployment files. Make sure to deploy contracts first.");
        console.error("Run: npx hardhat run scripts/deploy-18-decimal-contracts.ts --network sepolia");
        console.error("And: npx hardhat run scripts/deploy-18-decimal-contracts.ts --network coti");
        process.exit(1);
    }

    const sepoliaBridgeAddress = sepoliaDeployment.contracts.SepoliaBridge;
    const cotiBridgeAddress = cotiDeployment.contracts.CotiBridge;

    let bridgeAddress: string;
    let fundAmount: bigint;
    if (bridgeType === "sepolia") {
        bridgeAddress = sepoliaBridgeAddress;
        fundAmount = ethers.parseEther("0.005");
    } else {
        bridgeAddress = cotiBridgeAddress;
        fundAmount = ethers.parseEther("0.1");
    }

    const currentBalance = await deployer.provider.getBalance(bridgeAddress);
    console.log("Current bridge balance:", ethers.formatEther(currentBalance), "ETH");

    console.log("Attempting to send:", ethers.formatEther(fundAmount), "ETH");

    try {
        let tx;
        if (bridgeType === "coti") {
            // USER RULE: Use fixed gas limit and gas price for COTI
            const FIXED_GAS_LIMIT = 100000n;
            const FIXED_GAS_PRICE = ethers.parseUnits("1", "gwei"); // 1 gwei
            tx = await deployer.sendTransaction({
                to: bridgeAddress,
                value: fundAmount,
                gasLimit: FIXED_GAS_LIMIT,
                gasPrice: FIXED_GAS_PRICE
            });
        } else {
            // Sepolia: estimate gas as usual
            const gasEstimate = await deployer.estimateGas({
                to: bridgeAddress,
                value: fundAmount
            });
            console.log("Gas estimate:", gasEstimate.toString());
            tx = await deployer.sendTransaction({
                to: bridgeAddress,
                value: fundAmount,
                gasLimit: gasEstimate + 10000n
            });
        }

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
