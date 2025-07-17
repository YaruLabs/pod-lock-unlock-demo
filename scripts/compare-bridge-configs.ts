import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Comparing Bridge Configurations");
    console.log("==================================");

    const [deployer] = await ethers.getSigners();

    // Contract addresses
    const sepoliaBridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    // @ts-ignore
    const hre = require("hardhat");
    const network = hre.network.name;

    if (network === "sepolia") {
        console.log("\n📊 SEPOLIA BRIDGE CONFIGURATION");
        console.log("==============================");
        
        const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
        const bridge = SepoliaBridge.attach(sepoliaBridgeAddress);

        try {
            const cotiBridgeAddr = await bridge.cotiBridgeAddress();
            const cotiDomain = await bridge.cotiDomain();
            const mailboxAddr = await bridge.mailbox();
            
            console.log("Sepolia bridge address:", sepoliaBridgeAddress);
            console.log("COTI bridge address (bytes32):", cotiBridgeAddr);
            console.log("COTI domain:", cotiDomain.toString());
            console.log("Mailbox address:", mailboxAddr);
            
            // Convert bytes32 to address format
            const cotiAddrFromBytes32 = "0x" + cotiBridgeAddr.slice(-40);
            console.log("COTI bridge address (as address):", cotiAddrFromBytes32);
            
            // Check if addresses match
            if (cotiAddrFromBytes32.toLowerCase() === cotiBridgeAddress.toLowerCase()) {
                console.log("✅ COTI bridge addresses match!");
            } else {
                console.log("❌ COTI bridge address MISMATCH!");
                console.log("  Expected:", cotiBridgeAddress);
                console.log("  Configured:", cotiAddrFromBytes32);
            }
            
        } catch (error) {
            console.error("Error reading Sepolia bridge config:", error);
        }

    } else if (network === "coti") {
        console.log("\n📊 COTI BRIDGE CONFIGURATION");
        console.log("============================");
        
        const CotiBridge = await ethers.getContractFactory("CotiBridge");
        const bridge = CotiBridge.attach(cotiBridgeAddress);

        try {
            const sepoliaBridgeAddr = await bridge.sepoliaBridgeAddress();
            const sepoliaDomain = await bridge.sepoliaDomain();
            const mailboxAddr = await bridge.mailbox();
            
            console.log("COTI bridge address:", cotiBridgeAddress);
            console.log("Sepolia bridge address (bytes32):", sepoliaBridgeAddr);
            console.log("Sepolia domain:", sepoliaDomain.toString());
            console.log("Mailbox address:", mailboxAddr);
            
            // Convert bytes32 to address format
            const sepoliaAddrFromBytes32 = "0x" + sepoliaBridgeAddr.slice(-40);
            console.log("Sepolia bridge address (as address):", sepoliaAddrFromBytes32);
            
            // Check if addresses match
            if (sepoliaAddrFromBytes32.toLowerCase() === sepoliaBridgeAddress.toLowerCase()) {
                console.log("✅ Sepolia bridge addresses match!");
            } else {
                console.log("❌ Sepolia bridge address MISMATCH!");
                console.log("  Expected:", sepoliaBridgeAddress);
                console.log("  Configured:", sepoliaAddrFromBytes32);
            }
            
            // Check domain
            if (sepoliaDomain.toString() === "11155111") {
                console.log("✅ Sepolia domain correct!");
            } else {
                console.log("❌ Sepolia domain incorrect!");
                console.log("  Expected: 11155111");
                console.log("  Configured:", sepoliaDomain.toString());
            }
            
        } catch (error) {
            console.error("Error reading COTI bridge config:", error);
        }
        
        // Also check if we can simulate a message to see what would be sent
        console.log("\n🧪 Simulating message content...");
        try {
            // Get the expected message format
            const user = deployer.address;
            const amount = ethers.parseUnits("0.000001", 6);
            
            // This is what the message should contain
            const messageData = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "uint256"],
                [user, amount]
            );
            
            console.log("Message data:", messageData);
            console.log("Message length:", messageData.length);
            
        } catch (simError) {
            console.log("Could not simulate message");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 