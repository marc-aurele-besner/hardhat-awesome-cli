/* global user1, user2 */
const { expect } = require('chai')
const { ethers } = require('hardhat')

let mockERC20Upgradeable
let deployer
let user1
let user2

describe('MockERC20Upgradeable', function () {
    beforeEach(async function () {
        ;[deployer, user1, user2] = await ethers.getSigners()

        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
        mockERC20Upgradeable = await MockERC20Upgradeable.deploy()
        await mockERC20Upgradeable.deployed()
        await mockERC20Upgradeable.initialize('MockERC20Upgradeable', 'MOCK')
    })

    it('Should return the name of the token', async function () {
        expect(await mockERC20Upgradeable.name()).to.equal('MockERC20Upgradeable')
    })

    it('Should return the symbol of the token', async function () {
        expect(await mockERC20Upgradeable.symbol()).to.equal('MOCK')
    })

    it('Should mint token and have the right balanceOf', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)

        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(amount)
    })

    it('Should mint token and have the right totalSupply', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)

        expect(await mockERC20Upgradeable.totalSupply()).to.equal(amount)
    })

    it('Should mint token and burn them', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)
        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(amount)

        await mockERC20Upgradeable.burn(amount)
        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(0)
    })

    it('Should mint token and transfer them', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)
        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(amount)

        await mockERC20Upgradeable.transfer(user1.address, amount)
        expect(await mockERC20Upgradeable.balanceOf(user1.address)).to.equal(1000)
    })

    it('Should mint token and transferFrom them', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)
        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(amount)

        await mockERC20Upgradeable.approve(user1.address, amount)
        await mockERC20Upgradeable.connect(user1).transferFrom(deployer.address, user2.address, amount)
        expect(await mockERC20Upgradeable.balanceOf(user2.address)).to.equal(1000)
    })

    it('Should track allowance after approve and reset to zero', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)

        expect(await mockERC20Upgradeable.allowance(deployer.address, user1.address)).to.equal(0)

        await mockERC20Upgradeable.approve(user1.address, amount)
        expect(await mockERC20Upgradeable.allowance(deployer.address, user1.address)).to.equal(amount)

        await mockERC20Upgradeable.approve(user1.address, 0)
        expect(await mockERC20Upgradeable.allowance(deployer.address, user1.address)).to.equal(0)
    })

    it('Should revert transferFrom when allowance is exceeded', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)

        await mockERC20Upgradeable.approve(user1.address, amount - 1)
        let reverted = false
        try {
            await mockERC20Upgradeable.connect(user1).transferFrom(deployer.address, user2.address, amount)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should burnFrom a holder balance', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)
        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(amount)

        await mockERC20Upgradeable.burnFrom(deployer.address, amount)
        expect(await mockERC20Upgradeable.balanceOf(deployer.address)).to.equal(0)
        expect(await mockERC20Upgradeable.totalSupply()).to.equal(0)
    })

    it('Should revert burnFrom when amount is zero', async function () {
        const amount = 1000
        await mockERC20Upgradeable.mint(deployer.address, amount)

        let reverted = false
        try {
            await mockERC20Upgradeable.burnFrom(deployer.address, 0)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })
})
