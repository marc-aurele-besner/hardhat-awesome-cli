/*
const { expect } = require("chai");
const { ethers } = require("hardhat");

let MockERC20Upgradeable;
let mockERC20Upgradeable;

describe("MockERC20Upgradeable", function () {
  beforeEach(async function () {
    MockERC20Upgradeable = await ethers.getContractFactory("MockERC20Upgradeable");
    mockERC20Upgradeable = await MockERC20Upgradeable.deploy();
    await mockERC20Upgradeable.deployed();
    await mockERC20Upgradeable.initialize('MockERC20Upgradeable', 'MOCK');
  });
  
  it("Should return the name of the token", async function () {
    expect(await mockERC20Upgradeable.name()).to.equal("MockERC20Upgradeable");
  });

  it("Should return the symbol of the token", async function () {
    expect(await mockERC20Upgradeable.symbol()).to.equal("MOCK");
  });
});
*/
