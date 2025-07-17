import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    console.log("User address:", deployer.address);
    console.log("COTI bridge address:", cotiBridgeAddress);

    const latestBlock = await deployer.provider.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 1000, 0); // Last 1000 blocks

    try {
        console.log(`Checking TokensBurned events from block ${fromBlock} to ${latestBlock}...`);
        
        const burnEvents = await bridge.queryFilter(
            bridge.filters.TokensBurned(),
            fromBlock,
            latestBlock
        );
        
        console.log(`Found ${burnEvents.length} TokensBurned events`);
        
        if (burnEvents.length > 0) {
            console.log("Burn events:");
            burnEvents.forEach((event, i) => {
                console.log(`  ${i + 1}. Block ${event.blockNumber}`);
                console.log(`     User: ${event.args?.user}`);
                console.log(`     Amount: ${ethers.formatUnits(event.args?.amount || 0, 6)} cpUSDC`);
                console.log(`     Message ID: ${event.args?.messageId}`);
                console.log(`     Sepolia User: ${event.args?.sepoliaUser}`);
                console.log("");
            });
        } else {
            console.log("No TokensBurned events found in recent blocks");
        }
        
    } catch (error) {
        console.error("Error reading burn events:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 