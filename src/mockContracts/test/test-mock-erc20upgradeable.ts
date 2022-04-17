/*
import { expect } from "chai";
import { ethers } from "hardhat";

let mockERC20Upgradeable: any;
let deployer: any;

describe("MockERC721Upgradeable", function () {

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        const MockERC20Upgradeable = await ethers.getContractFactory("MockERC20Upgradeable");
        mockERC20Upgradeable = await MockERC20Upgradeable.deploy();
        await mockERC20Upgradeable.deployed();
        await mockERC20Upgradeable.initialize('MockERC20Upgradeable', 'MOCK');
    });

    it("Should return the name of the token", async function () {
        expect(await mockERC721.name()).to.equal("MockERC20Upgradeable");
    });

    it("Should return the symbol of the token", async function () {
        expect(await mockERC721.symbol()).to.equal("MOCK");
    });

    it("Should mint token and have the right balanceOf", async function () {
        const amount = 1000;
        await mockERC20Upgradeable.mint(deployer.address, amount);

        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(amount);
    });

    it("Should mint token and have the right totalSupply", async function () {
        const amount = 1000;
        await mockERC20Upgradeable.mint(deployer.address, amount);

        expect(await mockERC20Upgradeable.totalSupply()).to.equal(amount);
    });

    it("Should mint token and burn them", async function () {
        const amount = 1000;
        await mockERC20Upgradeable.mint(deployer.address, amount);
        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(amount);

        await mockERC20Upgradeable.burn(amount);
        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(0);
    });
});
*/
