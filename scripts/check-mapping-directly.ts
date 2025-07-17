import { ethers } from "hardhat";

async function main() {
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";
    const messageId = "0x9711a189fed28249c37c8c71e6bb3217f0b8333ffd2003811639995337f635e2";

    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    console.log("Message ID:", messageId);
    console.log("COTI bridge address:", cotiBridgeAddress);

    try {
        // Try to read the mappings directly
        console.log("\nTrying to read burnTransactionExists mapping...");
        const exists = await bridge.burnTransactionExists(messageId);
        console.log("burnTransactionExists:", exists);
        
        console.log("\nTrying to read burnTransactionStatus mapping...");
        const status = await bridge.burnTransactionStatus(messageId);
        console.log("burnTransactionStatus:", status);
        
        if (exists) {
            console.log("✅ Transaction exists in mapping");
            console.log("Status:", status ? "Confirmed ✅" : "Pending ⏰");
        } else {
            console.log("❌ Transaction does not exist in mapping");
            console.log("This suggests the burn transaction was not properly recorded in the mapping");
        }
        
    } catch (error) {
        console.error("Error reading mappings:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 