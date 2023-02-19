import { expect } from 'chai'
// @ts-ignore-next-line
import { ethers } from 'hardhat'

let mockERC20: any
let deployer: any
let user1: any
let user2: any

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
})
