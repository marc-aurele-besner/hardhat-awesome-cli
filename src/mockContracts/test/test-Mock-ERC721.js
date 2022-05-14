/*
const { expect } = require('chai');
const { ethers } = require('hardhat');

let mockERC721;
let deployer;

describe('MockERC721', function () {
    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        const MockERC721 = await ethers.getContractFactory('MockERC721');
        mockERC721 = await MockERC721.deploy();
        await mockERC721.deployed();
    });

    it('Should return the name of the token', async function () {
        expect(await mockERC721.name()).to.equal('MockERC721');
    });

    it('Should return the symbol of the token', async function () {
        expect(await mockERC721.symbol()).to.equal('MOCK');
    });
});
*/
