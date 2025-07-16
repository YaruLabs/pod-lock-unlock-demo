import { expect } from "chai";
import { ethers } from "hardhat";
import { SepoliaBridge, SepoliaToken } from "../typechain-types";

describe("SepoliaBridge", function () {
  let bridge: SepoliaBridge;
  let token: SepoliaToken;
  let owner: any;
  let user1: any;

  const COTI_DOMAIN = 7082400;
  const MOCK_MAILBOX = "0x1234567890123456789012345678901234567890";
  const COTI_BRIDGE_ADDRESS = "0x1234567890123456789012345678901234567890123456789012345678901234";

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    // Deploy SepoliaToken
    const TokenFactory = await ethers.getContractFactory("SepoliaToken");
    token = await TokenFactory.deploy();
    await token.waitForDeployment();
    
    // Deploy SepoliaBridge
    const BridgeFactory = await ethers.getContractFactory("SepoliaBridge");
    bridge = await BridgeFactory.deploy(
      MOCK_MAILBOX,
      await token.getAddress(),
      COTI_DOMAIN,
      COTI_BRIDGE_ADDRESS
    );
    await bridge.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await bridge.token()).to.equal(await token.getAddress());
    });

    it("Should set the correct COTI domain", async function () {
      expect(await bridge.cotiDomain()).to.equal(COTI_DOMAIN);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update COTI bridge address", async function () {
      const newAddress = "0x9876543210987654321098765432109876543210987654321098765432109876";
      
      await expect(bridge.connect(owner).updateCotiBridgeAddress(newAddress))
        .to.emit(bridge, "BridgeAddressUpdated")
        .withArgs(newAddress);
    });

    it("Should not allow non-owner to update bridge address", async function () {
      const newAddress = "0x9876543210987654321098765432109876543210987654321098765432109876";
      
      await expect(
        bridge.connect(user1).updateCotiBridgeAddress(newAddress)
      ).to.be.revertedWithCustomError(bridge, "OwnableUnauthorizedAccount");
    });
  });
}); 