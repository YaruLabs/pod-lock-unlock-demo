import { ethers } from "hardhat";

async function main() {
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    console.log("Checking basic contract variables...");
    console.log("COTI bridge address:", cotiBridgeAddress);

    try {
        // Try to read basic public variables
        const token = await bridge.token();
        console.log("Token address:", token);
        
        const mailbox = await bridge.mailbox();
        console.log("Mailbox address:", mailbox);
        
        const sepoliaBridgeAddress = await bridge.sepoliaBridgeAddress();
        console.log("Sepolia bridge address (bytes32):", sepoliaBridgeAddress);
        
        const sepoliaDomain = await bridge.sepoliaDomain();
        console.log("Sepolia domain:", sepoliaDomain.toString());
        
        console.log("✅ Contract is accessible and basic variables can be read");
        
    } catch (error) {
        console.error("❌ Error reading basic contract variables:", error);
        console.log("This suggests the contract might not be deployed at this address or there's an RPC issue");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 