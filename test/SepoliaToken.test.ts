import { expect } from "chai";
import { ethers } from "hardhat";
import { SepoliaToken } from "../typechain-types";

describe("SepoliaToken", function () {
  let token: SepoliaToken;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("SepoliaToken");
    token = await TokenFactory.deploy();
    await token.waitForDeployment();
  });

  it("Should allow anyone to mint tokens", async function () {
    await token.connect(user1).mint(user1.address, 1000);
    expect(await token.balanceOf(user1.address)).to.equal(1000);
    await token.connect(user2).mint(user2.address, 500);
    expect(await token.balanceOf(user2.address)).to.equal(500);
  });

  it("Should increase total supply when minted", async function () {
    const initialSupply = await token.totalSupply();
    await token.connect(user1).mint(user1.address, 1000);
    expect(await token.totalSupply()).to.equal(initialSupply + BigInt(1000));
  });

  it("Should not allow minting to zero address", async function () {
    await expect(token.connect(user1).mint(ethers.ZeroAddress, 1000)).to.be.revertedWith("Cannot mint to zero address");
  });

  it("Should not allow minting zero amount", async function () {
    await expect(token.connect(user1).mint(user1.address, 0)).to.be.revertedWith("Amount must be greater than 0");
  });
}); 