/*
import { expect } from "chai";
import { ethers } from "hardhat";

let mockERC1155: any;
let deployer: any;

describe("MockERC1155", function () {
    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        const MockERC1155 = await ethers.getContractFactory("MockERC1155");
        mockERC1155 = await MockERC1155.deploy();
        await mockERC1155.deployed();
    });

    it("Should return the name of the token", async function () {
        expect(await mockERC1155.name()).to.equal("MockERC1155");
    });

    it("Should return the symbol of the token", async function () {
        expect(await mockERC1155.symbol()).to.equal("MOCK");
    });
});
*/
