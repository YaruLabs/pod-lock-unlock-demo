import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config();

async function main() {
    console.log("🔥 Simple COTI Burn Test (COTI-Ethers)");
    console.log("======================================");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    // Load addresses from deployments/coti.json
    const deploymentFile = path.join("deployments", "coti.json");
    let cotiTokenAddress: string, cotiBridgeAddress: string;
    try {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
        cotiTokenAddress = deployment.contracts["CotiToken"];
        cotiBridgeAddress = deployment.contracts["CotiBridge"];
        if (!cotiTokenAddress || !cotiBridgeAddress) throw new Error("Token or bridge address not found in deployment file");
    } catch (e) {
        throw new Error(`Failed to load deployment file or addresses: ${e}`);
    }
    console.log(`CotiToken address: ${cotiTokenAddress}`);
    console.log(`CotiBridge address: ${cotiBridgeAddress}`);

    // Import coti-ethers
    const { CotiNetwork, getDefaultProvider, Wallet } = await import('@coti-io/coti-ethers');
    const cotiProvider = await getDefaultProvider(CotiNetwork.Testnet);

    // Use private key from env or fallback
    const privateKey = process.env.PRIVATE_KEY || "";
    const cotiWallet = new Wallet(privateKey, cotiProvider);
    await cotiWallet.generateOrRecoverAes();
    console.log(`📝 COTI Wallet address: ${cotiWallet.address}`);

    // Get contract ABI for approve and burn
    const tokenABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function approve(address spender, (uint256 ciphertext, bytes signature) value) external returns (bool)"
    ];
    const bridgeABI = [
        "function burn(uint256 amount) external payable"
    ];
    const { Contract } = await import("ethers");
    const token = new Contract(cotiTokenAddress, tokenABI, cotiWallet);
    const bridge = new Contract(cotiBridgeAddress, bridgeABI, cotiWallet);

    // Check current balance
    const userBalance = await token.balanceOf(cotiWallet.address);
    console.log("Current cpUSDC balance:", userBalance.toString());

    if (userBalance > 0n) {
        console.log("\n🔥 Testing burn function...");
        // Use a reasonable burn amount (10 cpUSDC)
        const burnAmount = 10_000_000; // 10 cpUSDC, 6 decimals, as uint64
        console.log("Burning:", burnAmount / 1_000_000, "cpUSDC");

        try {
            // Encrypt the burn amount as itUint64
            // console.log("Encrypting burn amount for approve...");
            // const encryptedAmount = await cotiWallet.encryptValue(burnAmount);
            // console.log("Encrypted amount:", encryptedAmount);

            // // Approve bridge to spend tokens (using itUint64)
            // console.log("Approving bridge to spend tokens (encrypted)...");
            // const approveTx = await token.approve(cotiBridgeAddress, [encryptedAmount.ciphertext, encryptedAmount.signature], {});
            // console.log("Approve tx hash:", approveTx.hash);
            // await approveTx.wait();
            // console.log("✅ Approve confirmed");

            // Now burn (standard uint256, not encrypted)
            console.log("Executing burn...");
            const burnTx = await bridge.burn(burnAmount, {
                value: ethers.parseEther("0.01"), // Add some ETH for gas
                gasLimit: 1000000
            });
            console.log("🔥 Burn transaction sent:", burnTx.hash);
            const receipt = await burnTx.wait();
            console.log("✅ Burn successful! Block:", receipt?.blockNumber);
            console.log("Gas used:", receipt?.gasUsed?.toString());

            // Check updated balance
            const newBalance = await token.balanceOf(cotiWallet.address);
            console.log("\n💰 Updated balance:", newBalance.toString(), "cpUSDC");
            console.log("\n🎯 Burn test completed!");
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