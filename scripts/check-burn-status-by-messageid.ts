import { ethers } from "hardhat";

async function main() {
    // COTI bridge address and messageId
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";
    const messageId = "0x9711a189fed28249c37c8c71e6bb3217f0b8333ffd2003811639995337f635e2";

    const CotiBridge = await ethers.getContractFactory("CotiBridge");
    const bridge = CotiBridge.attach(cotiBridgeAddress);

    try {
        const [exists, success] = await bridge.getBurnTransactionStatus(messageId);
        console.log("Message ID:", messageId);
        console.log("Exists:", exists);
        console.log("Success:", success);
    } catch (error) {
        console.error("Error reading burn transaction status:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 