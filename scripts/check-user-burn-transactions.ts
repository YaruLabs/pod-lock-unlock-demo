import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    console.log("User address:", deployer.address);
    console.log("COTI bridge address:", cotiBridgeAddress);

    try {
        const userBurnTxs = await bridge.getUserBurnTransactions(deployer.address);
        console.log("User burn transactions count:", userBurnTxs.length);
        
        if (userBurnTxs.length > 0) {
            console.log("Burn transaction IDs:");
            userBurnTxs.forEach((txId, i) => {
                console.log(`  ${i + 1}. ${txId}`);
            });
        } else {
            console.log("No burn transactions found for this user");
        }
    } catch (error) {
        console.error("Error reading user burn transactions:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 