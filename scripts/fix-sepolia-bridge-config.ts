import { ethers } from "hardhat";

async function main() {
    console.log("🔧 Fixing Sepolia Bridge Configuration");
    console.log("=====================================");

    const [deployer] = await ethers.getSigners();

    // Contract addresses
    const sepoliaBridgeAddress = "0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5";
    const cotiBridgeAddress = "0x52221191a3565eda7124c7690500Afa4e066a196";

    const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
    const bridge = SepoliaBridge.attach(sepoliaBridgeAddress);

    // Convert COTI bridge address to bytes32
    const cotiBridgeBytes32 = ethers.zeroPadValue(cotiBridgeAddress, 32);

    console.log("Current deployer:", deployer.address);
    console.log("Sepolia bridge:", sepoliaBridgeAddress);
    console.log("Setting COTI bridge address to:", cotiBridgeAddress);
    console.log("As bytes32:", cotiBridgeBytes32);

    try {
        // Check current owner
        const owner = await bridge.owner();
        console.log("Bridge owner:", owner);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log("❌ You are not the owner of this bridge contract");
            console.log("❌ Current owner:", owner);
            console.log("❌ Your address:", deployer.address);
            return;
        }

        // Check current configuration
        const currentCotiAddress = await bridge.cotiBridgeAddress();
        const currentCotiDomain = await bridge.cotiDomain();
        
        console.log("Current COTI address (bytes32):", currentCotiAddress);
        console.log("Current COTI domain:", currentCotiDomain.toString());
        
        // Update COTI bridge address
        console.log("\nUpdating COTI bridge address...");
        const tx = await bridge.updateCotiBridgeAddress(cotiBridgeBytes32, {
            gasLimit: 100000
        });
        
        console.log("Configuration update tx sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Sepolia bridge configuration updated!");
        console.log("Gas used:", receipt?.gasUsed.toString());
        
        // Verify the update
        const newCotiAddress = await bridge.cotiBridgeAddress();
        const newCotiAddressAsAddress = "0x" + newCotiAddress.slice(-40);
        
        console.log("\n✅ Configuration verification:");
        console.log("New COTI address (bytes32):", newCotiAddress);
        console.log("New COTI address (as address):", newCotiAddressAsAddress);
        
        if (newCotiAddressAsAddress.toLowerCase() === cotiBridgeAddress.toLowerCase()) {
            console.log("🎉 COTI bridge address correctly configured!");
        } else {
            console.log("❌ Configuration verification failed");
        }
        
    } catch (error: any) {
        console.error("❌ Failed to update Sepolia bridge:", error.message);
        
        if (error.message.includes("OwnableUnauthorizedAccount")) {
            console.log("💡 You need to be the owner to update the bridge configuration");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 