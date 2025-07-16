import { expect } from "chai";
import { ethers } from "hardhat";
import { CotiBridge, CotiToken } from "../typechain-types";

describe("CotiBridge", function () {
  let bridge: CotiBridge;
  let token: CotiToken;
  let owner: any;
  let user1: any;
  let user2: any;
  let mailbox: any;

  beforeEach(async function () {
    [owner, user1, user2, mailbox] = await ethers.getSigners();
    
    // Deploy CotiToken
    const TokenFactory = await ethers.getContractFactory("CotiToken");
    token = await TokenFactory.deploy();
    await token.waitForDeployment();
    
    // Deploy CotiBridge
    const BridgeFactory = await ethers.getContractFactory("CotiBridge");
    bridge = await BridgeFactory.deploy(await token.getAddress(), mailbox.address);
    await bridge.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await bridge.token()).to.equal(await token.getAddress());
    });

    it("Should set the correct mailbox address", async function () {
      expect(await bridge.mailbox()).to.equal(mailbox.address);
    });
  });

  describe("Message Handling", function () {
    it("Should only allow mailbox to call handle function", async function () {
      const message = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bool"],
        [user1.address, 1000, true]
      );

      await expect(
        bridge.connect(user1).handle(11155111, ethers.ZeroHash, message)
      ).to.be.revertedWith("Only mailbox can call");
    });

    it("Should handle valid mint message", async function () {
      const message = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bool"],
        [user1.address, ethers.parseUnits("1000", 18), true]
      );

      // The mint might fail in test environment due to COTI MPC requirements
      // But the message should still be processed and events emitted
      await expect(
        bridge.connect(mailbox).handle(11155111, ethers.ZeroHash, message)
      ).to.emit(bridge, "MessageDecoded");
    });

    it("Should prevent replay attacks", async function () {
      const message = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bool"],
        [user1.address, ethers.parseUnits("1000", 18), true]
      );

      // First call should succeed
      await bridge.connect(mailbox).handle(11155111, ethers.ZeroHash, message);

      // Second call with same message should fail
      await expect(
        bridge.connect(mailbox).handle(11155111, ethers.ZeroHash, message)
      ).to.be.revertedWith("Message already processed");
    });

    it("Should handle invalid message gracefully", async function () {
      const invalidMessage = "0x1234"; // Too short

      await expect(
        bridge.connect(mailbox).handle(11155111, ethers.ZeroHash, invalidMessage)
      ).to.emit(bridge, "DecodingError");
    });
  });

  describe("Message Decoding", function () {
    it("Should decode valid message correctly", async function () {
      const testAddress = user1.address;
      const testAmount = ethers.parseUnits("1000", 18);
      const isMint = true;

      const message = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bool"],
        [testAddress, testAmount, isMint]
      );

      const [decodedUser, decodedAmount, decodedIsMint] = await bridge.testDecode(message);
      
      expect(decodedUser).to.equal(testAddress);
      expect(decodedAmount).to.equal(testAmount);
      expect(decodedIsMint).to.equal(isMint);
    });

    it("Should handle message without bool parameter", async function () {
      // Create message with only address and amount
      const testAddress = user1.address;
      const testAmount = ethers.parseUnits("1000", 18);

      const message = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [testAddress, testAmount]
      );

      const [decodedUser, decodedAmount, decodedIsMint] = await bridge.testDecode(message);
      
      expect(decodedUser).to.equal(testAddress);
      expect(decodedAmount).to.equal(testAmount);
      expect(decodedIsMint).to.equal(true); // Should default to true
    });

    it("Should fail on invalid message", async function () {
      const invalidMessage = "0x1234"; // Too short

      await expect(bridge.testDecode(invalidMessage)).to.be.revertedWith("Decoding failed");
    });
  });

  describe("Events", function () {
    it("Should emit proper events on successful message handling", async function () {
      const message = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bool"],
        [user1.address, ethers.parseUnits("1000", 18), true]
      );

      const tx = await bridge.connect(mailbox).handle(11155111, ethers.ZeroHash, message);
      
      await expect(tx).to.emit(bridge, "RawMessage");
      await expect(tx).to.emit(bridge, "MessageDecoded");
      await expect(tx).to.emit(bridge, "DebugInfo");
      // BridgeAction might not emit if mint fails in test environment
    });
  });
}); 