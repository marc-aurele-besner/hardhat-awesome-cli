const { expect } = require('chai')
const { ethers } = require('hardhat')

let mockERC721
let deployer
let user1
let user2

describe('MockERC721', function () {
    beforeEach(async function () {
        ;[deployer, user1, user2] = await ethers.getSigners()

        const MockERC721 = await ethers.getContractFactory('MockERC721')
        mockERC721 = await MockERC721.deploy()
        await mockERC721.deployed()
    })

    it('Should return the name of the token', async function () {
        expect(await mockERC721.name()).to.equal('MockERC721')
    })

    it('Should return the symbol of the token', async function () {
        expect(await mockERC721.symbol()).to.equal('MOCK')
    })

    it('Should mint a token to an address and update ownerOf / balanceOf', async function () {
        const tokenId = 1
        await mockERC721.mint(user1.address, tokenId)

        expect(await mockERC721.balanceOf(user1.address)).to.equal(1)
        expect(await mockERC721.ownerOf(tokenId)).to.equal(user1.address)
    })

    it('Should revert mint when token id is zero', async function () {
        let reverted = false
        try {
            await mockERC721.mint(user1.address, 0)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should revert mint when recipient is the zero address', async function () {
        let reverted = false
        try {
            await mockERC721.mint(ethers.constants.AddressZero, 1)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should burn a token the caller owns', async function () {
        const tokenId = 1
        await mockERC721.mint(user1.address, tokenId)
        await mockERC721.connect(user1).burn(tokenId)

        expect(await mockERC721.balanceOf(user1.address)).to.equal(0)
        let reverted = false
        try {
            await mockERC721.ownerOf(tokenId)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should revert burn when the token does not exist', async function () {
        let reverted = false
        try {
            await mockERC721.burn(1)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should approve and report the approved address via getApproved', async function () {
        const tokenId = 1
        await mockERC721.mint(deployer.address, tokenId)

        expect(await mockERC721.getApproved(tokenId)).to.equal(ethers.constants.AddressZero)

        await mockERC721.approve(user1.address, tokenId)
        expect(await mockERC721.getApproved(tokenId)).to.equal(user1.address)
    })

    it('Should transfer a token from the owner', async function () {
        const tokenId = 1
        await mockERC721.mint(deployer.address, tokenId)

        await mockERC721.transferFrom(deployer.address, user1.address, tokenId)
        expect(await mockERC721.ownerOf(tokenId)).to.equal(user1.address)
        expect(await mockERC721.balanceOf(deployer.address)).to.equal(0)
        expect(await mockERC721.balanceOf(user1.address)).to.equal(1)
    })

    it('Should transfer a token by an approved operator', async function () {
        const tokenId = 1
        await mockERC721.mint(deployer.address, tokenId)
        await mockERC721.approve(user1.address, tokenId)

        await mockERC721.connect(user1).transferFrom(deployer.address, user2.address, tokenId)
        expect(await mockERC721.ownerOf(tokenId)).to.equal(user2.address)
    })

    it('Should revert transferFrom when the caller is not approved', async function () {
        const tokenId = 1
        await mockERC721.mint(deployer.address, tokenId)

        let reverted = false
        try {
            await mockERC721.connect(user1).transferFrom(deployer.address, user2.address, tokenId)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should set and read operator approval via setApprovalForAll', async function () {
        expect(await mockERC721.isApprovedForAll(deployer.address, user1.address)).to.equal(false)

        await mockERC721.setApprovalForAll(user1.address, true)
        expect(await mockERC721.isApprovedForAll(deployer.address, user1.address)).to.equal(true)

        await mockERC721.setApprovalForAll(user1.address, false)
        expect(await mockERC721.isApprovedForAll(deployer.address, user1.address)).to.equal(false)
    })

    it('Should allow an operator to move any token via setApprovalForAll', async function () {
        const tokenId = 1
        await mockERC721.mint(deployer.address, tokenId)
        await mockERC721.setApprovalForAll(user1.address, true)

        await mockERC721.connect(user1).transferFrom(deployer.address, user2.address, tokenId)
        expect(await mockERC721.ownerOf(tokenId)).to.equal(user2.address)
    })

    it('Should safeTransferFrom a token to a recipient', async function () {
        const tokenId = 1
        await mockERC721.mint(deployer.address, tokenId)

        await mockERC721['safeTransferFrom(address,address,uint256)'](deployer.address, user1.address, tokenId)
        expect(await mockERC721.ownerOf(tokenId)).to.equal(user1.address)
    })
})
