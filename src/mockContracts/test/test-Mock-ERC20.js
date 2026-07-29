/* global user1, user2 */
const { expect } = require('chai')
const { ethers } = require('hardhat')

let mockERC20
let deployer
let user1
let user2

describe('MockERC20', function () {
    beforeEach(async function () {
        ;[deployer, user1, user2] = await ethers.getSigners()

        const MockERC20 = await ethers.getContractFactory('MockERC20')
        mockERC20 = await MockERC20.deploy()
        await mockERC20.deployed()
    })

    it('Should return the name of the token', async function () {
        expect(await mockERC20.name()).to.equal('MockERC20')
    })

    it('Should return the symbol of the token', async function () {
        expect(await mockERC20.symbol()).to.equal('MOCK')
    })

    it('Should mint token and have the right balanceOf', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)

        expect(await mockERC20.balanceOf(deployer.address)).to.equal(amount)
    })

    it('Should mint token and have the right totalSupply', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)

        expect(await mockERC20.totalSupply()).to.equal(amount)
    })

    it('Should mint token and burn them', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)
        expect(await mockERC20.balanceOf(deployer.address)).to.equal(amount)

        await mockERC20.burn(amount)
        expect(await mockERC20.balanceOf(deployer.address)).to.equal(0)
    })

    it('Should mint token and transfer them', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)
        expect(await mockERC20.balanceOf(deployer.address)).to.equal(amount)

        await mockERC20.transfer(user1.address, amount)
        expect(await mockERC20.balanceOf(user1.address)).to.equal(1000)
    })

    it('Should mint token and transferFrom them', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)
        expect(await mockERC20.balanceOf(deployer.address)).to.equal(amount)

        await mockERC20.approve(user1.address, amount)
        await mockERC20.connect(user1).transferFrom(deployer.address, user2.address, amount)
        expect(await mockERC20.balanceOf(user2.address)).to.equal(1000)
    })

    it('Should track allowance after approve and reset to zero', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)

        expect(await mockERC20.allowance(deployer.address, user1.address)).to.equal(0)

        await mockERC20.approve(user1.address, amount)
        expect(await mockERC20.allowance(deployer.address, user1.address)).to.equal(amount)

        await mockERC20.approve(user1.address, 0)
        expect(await mockERC20.allowance(deployer.address, user1.address)).to.equal(0)
    })

    it('Should revert transferFrom when allowance is exceeded', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)

        await mockERC20.approve(user1.address, amount - 1)
        let reverted = false
        try {
            await mockERC20.connect(user1).transferFrom(deployer.address, user2.address, amount)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should burnFrom a holder balance', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)
        expect(await mockERC20.balanceOf(deployer.address)).to.equal(amount)

        await mockERC20.burnFrom(deployer.address, amount)
        expect(await mockERC20.balanceOf(deployer.address)).to.equal(0)
        expect(await mockERC20.totalSupply()).to.equal(0)
    })

    it('Should revert burnFrom when amount is zero', async function () {
        const amount = 1000
        await mockERC20.mint(deployer.address, amount)

        let reverted = false
        try {
            await mockERC20.burnFrom(deployer.address, 0)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })
})
