import { ethers } from "hardhat";

async function main() {
    console.log("🔧 Fixing Bridge Configurations (Corrected)");
    console.log("===========================================");

    const [deployer] = await ethers.getSigners();

    // Contract addresses
    const sepoliaBridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    // @ts-ignore
    const hre = require("hardhat");
    const network = hre.network.name;

    if (network === "sepolia") {
        console.log("\n🔧 FIXING SEPOLIA BRIDGE CONFIGURATION");
        console.log("=====================================");
        
        const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
        const bridge = SepoliaBridge.attach(sepoliaBridgeAddress);

        // Convert COTI bridge address to bytes32
        const cotiBridgeBytes32 = ethers.zeroPadValue(cotiBridgeAddress, 32);
        const cotiDomain = 7082400; // COTI domain ID

        console.log("Setting COTI bridge address to:", cotiBridgeAddress);
        console.log("As bytes32:", cotiBridgeBytes32);
        console.log("COTI domain:", cotiDomain);

        try {
            // Set bridge address
            const tx1 = await bridge.setCotiBridgeAddress(cotiBridgeBytes32, {
                gasLimit: 100000
            });
            console.log("Bridge address update tx sent:", tx1.hash);
            await tx1.wait();
            console.log("✅ COTI bridge address updated!");

            // Set domain
            const tx2 = await bridge.setCotiDomain(cotiDomain, {
                gasLimit: 100000
            });
            console.log("Domain update tx sent:", tx2.hash);
            await tx2.wait();
            console.log("✅ COTI domain updated!");
            
        } catch (error: any) {
            console.error("❌ Failed to update Sepolia bridge:", error.message);
        }

    } else if (network === "coti") {
        console.log("\n🔧 FIXING COTI BRIDGE CONFIGURATION");
        console.log("===================================");
        
        const CotiBridge = await ethers.getContractFactory("CotiBridge");
        const bridge = CotiBridge.attach(cotiBridgeAddress);

        // Convert Sepolia bridge address to bytes32
        const sepoliaBridgeBytes32 = ethers.zeroPadValue(sepoliaBridgeAddress, 32);
        const sepoliaDomain = 11155111; // Sepolia domain ID

        console.log("Setting Sepolia bridge address to:", sepoliaBridgeAddress);
        console.log("As bytes32:", sepoliaBridgeBytes32);
        console.log("Sepolia domain:", sepoliaDomain);

        try {
            // Set bridge address
            const tx1 = await bridge.setSepoliaBridgeAddress(sepoliaBridgeBytes32, {
                gasLimit: 100000,
                gasPrice: ethers.parseUnits("5", "gwei")
            });
            console.log("Bridge address update tx sent:", tx1.hash);
            
            try {
                await tx1.wait();
                console.log("✅ Sepolia bridge address updated!");
            } catch (waitError) {
                console.log("⚠️ Wait failed but transaction was sent:", tx1.hash);
            }

            // Set domain
            const tx2 = await bridge.setSepoliaDomain(sepoliaDomain, {
                gasLimit: 100000,
                gasPrice: ethers.parseUnits("5", "gwei")
            });
            console.log("Domain update tx sent:", tx2.hash);
            
            try {
                await tx2.wait();
                console.log("✅ Sepolia domain updated!");
            } catch (waitError) {
                console.log("⚠️ Wait failed but transaction was sent:", tx2.hash);
            }
            
        } catch (error: any) {
            console.error("❌ Failed to update COTI bridge:", error.message);
            if (error.message.includes("pending block")) {
                console.log("💡 Transaction might still succeed despite RPC error");
            }
        }
    }

    console.log("\n💡 After fixing both bridges, test the burn function again!");
    console.log("💡 The burn → unlock → confirmation cycle should now work!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 