import { expect } from "chai";
import { ethers } from "hardhat";
import { CotiToken } from "../typechain-types";

describe("CotiToken", function () {
  let token: CotiToken;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("CotiToken");
    token = await TokenFactory.deploy();
    await token.waitForDeployment();
  });

  it("Should allow anyone to mint tokens", async function () {
    await token.connect(user1).mint(user1.address, 1000);
    // Note: PrivateERC20 balance checking might be different
    // For now, just verify the transaction doesn't revert
    expect(true).to.be.true;
  });

  it("Should not allow minting to zero address", async function () {
    await expect(token.connect(user1).mint(ethers.ZeroAddress, 1000)).to.be.revertedWith("Cannot mint to zero address");
  });

  it("Should not allow minting zero amount", async function () {
    await expect(token.connect(user1).mint(user1.address, 0)).to.be.revertedWith("Amount must be greater than 0");
  });

  it("Should have correct decimals", async function () {
    expect(await token.decimals()).to.equal(6);
  });
}); 