import { ethers } from "hardhat";

async function main() {
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    console.log("Verifying contract code...");
    console.log("COTI bridge address:", cotiBridgeAddress);

    try {
        // Get the contract code
        const code = await ethers.provider.getCode(cotiBridgeAddress);
        console.log("Contract code length:", code.length);
        
        if (code === "0x") {
            console.log("❌ No contract code found at this address");
            return;
        }
        
        console.log("✅ Contract code exists");
        
        // Try to get the contract bytecode from our compilation
        const CotiBridge = await ethers.getContractFactory("CotiBridge");
        const factory = CotiBridge.attach(cotiBridgeAddress);
        
        // Try to call a simple function that should work
        console.log("\nTesting simple function calls...");
        
        try {
            const token = await factory.token();
            console.log("✅ token() function works:", token);
        } catch (error) {
            console.log("❌ token() function failed:", error.message);
        }
        
        try {
            const mailbox = await factory.mailbox();
            console.log("✅ mailbox() function works:", mailbox);
        } catch (error) {
            console.log("❌ mailbox() function failed:", error.message);
        }
        
        try {
            const sepoliaBridgeAddress = await factory.sepoliaBridgeAddress();
            console.log("✅ sepoliaBridgeAddress() function works:", sepoliaBridgeAddress);
        } catch (error) {
            console.log("❌ sepoliaBridgeAddress() function failed:", error.message);
        }
        
        try {
            const sepoliaDomain = await factory.sepoliaDomain();
            console.log("✅ sepoliaDomain() function works:", sepoliaDomain.toString());
        } catch (error) {
            console.log("❌ sepoliaDomain() function failed:", error.message);
        }
        
        // Try the problematic functions
        console.log("\nTesting problematic functions...");
        
        try {
            const [deployer] = await ethers.getSigners();
            const userBurnTxs = await factory.getUserBurnTransactions(deployer.address);
            console.log("✅ getUserBurnTransactions() function works, count:", userBurnTxs.length);
        } catch (error) {
            console.log("❌ getUserBurnTransactions() function failed:", error.message);
        }
        
        const messageId = "0x9711a189fed28249c37c8c71e6bb3217f0b8333ffd2003811639995337f635e2";
        try {
            const [exists, success] = await factory.getBurnTransactionStatus(messageId);
            console.log("✅ getBurnTransactionStatus() function works");
            console.log("  Exists:", exists);
            console.log("  Success:", success);
        } catch (error) {
            console.log("❌ getBurnTransactionStatus() function failed:", error.message);
        }
        
    } catch (error) {
        console.error("Error verifying contract:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 