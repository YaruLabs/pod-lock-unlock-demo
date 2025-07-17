import { ethers } from "hardhat";

async function main() {
    console.log("🔍 COTI Network Balance Check");
    console.log("=============================");

    const [deployer] = await ethers.getSigners();
    const userAddress = deployer.address;
    console.log("User address:", userAddress);
    console.log("User ETH balance:", ethers.formatEther(await deployer.provider.getBalance(userAddress)), "ETH");

    const cotiTokenAddress = "0x3371F18A7a0704e7F3f33322F650575C6846bd9a";
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    try {
        // Get token contract - use the address version of balanceOf
        const CotiToken = await ethers.getContractFactory("CotiToken");
        const token = CotiToken.attach(cotiTokenAddress);

        // Use explicit function signature to avoid ambiguity
        const userBalance = await token["balanceOf(address)"](userAddress);
        console.log("User cpUSDC balance:", ethers.formatUnits(userBalance, 6), "cpUSDC");

        const bridgeBalance = await token["balanceOf(address)"](cotiBridgeAddress);
        console.log("Bridge cpUSDC balance:", ethers.formatUnits(bridgeBalance, 6), "cpUSDC");

        // Check bridge ETH balance
        const bridgeEthBalance = await deployer.provider.getBalance(cotiBridgeAddress);
        console.log("Bridge ETH balance:", ethers.formatEther(bridgeEthBalance), "ETH");

        // If user has tokens, we can test burn function
        if (userBalance > 0n) {
            console.log("\n✅ User has tokens available for burn testing!");
            console.log("💡 You can now test the burn function");
        } else {
            console.log("\n⚠️ User has no cpUSDC tokens");
            console.log("💡 Need to mint tokens first (requires MPC setup)");
        }

    } catch (error) {
        console.error("Error checking balances:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 