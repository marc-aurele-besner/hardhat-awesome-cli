import { expect } from 'chai'
// @ts-ignore-next-line
import { ethers } from 'hardhat'

let mockERC1155: any
let deployer: any
let user1: any
let user2: any

describe('MockERC1155', function () {
    beforeEach(async function () {
        ;[deployer, user1, user2] = await ethers.getSigners()

        const MockERC1155 = await ethers.getContractFactory('MockERC1155')
        mockERC1155 = await MockERC1155.deploy()
        await mockERC1155.deployed()
    })

    it('Should return the name of the token', async function () {
        expect(await mockERC1155.name()).to.equal('MockERC1155')
    })

    it('Should return the symbol of the token', async function () {
        expect(await mockERC1155.symbol()).to.equal('MOCK')
    })

    it('Should mint a batch and update per-id balance', async function () {
        const tokenId = 1
        const amount = 100
        await mockERC1155.mint(user1.address, tokenId, amount)

        expect(await mockERC1155.balanceOf(user1.address, tokenId)).to.equal(amount)
    })

    it('Should revert mint when recipient is the zero address', async function () {
        let reverted = false
        try {
            await mockERC1155.mint(ethers.constants.AddressZero, 1, 100)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should revert mint when token id is zero', async function () {
        let reverted = false
        try {
            await mockERC1155.mint(user1.address, 0, 100)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should revert mint when amount is zero', async function () {
        let reverted = false
        try {
            await mockERC1155.mint(user1.address, 1, 0)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should burn tokens the caller owns', async function () {
        const tokenId = 1
        const amount = 100
        await mockERC1155.mint(user1.address, tokenId, amount)
        await mockERC1155.connect(user1).burn(tokenId, amount)

        expect(await mockERC1155.balanceOf(user1.address, tokenId)).to.equal(0)
    })

    it('Should burnFrom tokens from any holder', async function () {
        const tokenId = 1
        const amount = 100
        await mockERC1155.mint(user1.address, tokenId, amount)

        await mockERC1155.burnFrom(user1.address, tokenId, amount)
        expect(await mockERC1155.balanceOf(user1.address, tokenId)).to.equal(0)
    })

    it('Should report balanceOfBatch for multiple holders and ids', async function () {
        await mockERC1155.mint(user1.address, 1, 10)
        await mockERC1155.mint(user1.address, 2, 20)
        await mockERC1155.mint(user2.address, 1, 30)

        const balances = await mockERC1155.balanceOfBatch([user1.address, user1.address, user2.address], [1, 2, 1])
        expect(balances[0]).to.equal(10)
        expect(balances[1]).to.equal(20)
        expect(balances[2]).to.equal(30)
    })

    it('Should set and read operator approval via setApprovalForAll', async function () {
        expect(await mockERC1155.isApprovedForAll(deployer.address, user1.address)).to.equal(false)

        await mockERC1155.setApprovalForAll(user1.address, true)
        expect(await mockERC1155.isApprovedForAll(deployer.address, user1.address)).to.equal(true)

        await mockERC1155.setApprovalForAll(user1.address, false)
        expect(await mockERC1155.isApprovedForAll(deployer.address, user1.address)).to.equal(false)
    })

    it('Should safeTransferFrom a single id by an operator', async function () {
        const tokenId = 1
        const amount = 100
        await mockERC1155.mint(deployer.address, tokenId, amount)
        await mockERC1155.setApprovalForAll(user1.address, true)

        await mockERC1155.connect(user1).safeTransferFrom(deployer.address, user2.address, tokenId, amount, '0x')
        expect(await mockERC1155.balanceOf(user2.address, tokenId)).to.equal(amount)
    })

    it('Should safeBatchTransferFrom multiple ids by an operator', async function () {
        await mockERC1155.mint(deployer.address, 1, 10)
        await mockERC1155.mint(deployer.address, 2, 20)
        await mockERC1155.setApprovalForAll(user1.address, true)

        await mockERC1155
            .connect(user1)
            .safeBatchTransferFrom(deployer.address, user2.address, [1, 2], [10, 20], '0x')

        expect(await mockERC1155.balanceOf(user2.address, 1)).to.equal(10)
        expect(await mockERC1155.balanceOf(user2.address, 2)).to.equal(20)
    })
})