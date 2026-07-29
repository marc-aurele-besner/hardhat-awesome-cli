const { expect } = require('chai')
const { ethers } = require('hardhat')

let mockProxyAdmin
let proxy
let logicContract = ''
let proxyAdminContract = ''
let deployer
let user1

describe('MockProxyAdmin', function () {
    before(async function () {
        if (!logicContract) {
            const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
            const mockERC20Upgradeable = await MockERC20Upgradeable.deploy()
            await mockERC20Upgradeable.deployed()
            logicContract = mockERC20Upgradeable.address
        }
        if (!proxyAdminContract) {
            const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin')
            mockProxyAdmin = await MockProxyAdmin.deploy()
            await mockProxyAdmin.deployed()
            proxyAdminContract = mockProxyAdmin.address
        }
    })
    beforeEach(async function () {
        ;[deployer, user1] = await ethers.getSigners()

        const MockTransparentUpgradeableProxy = await ethers.getContractFactory('MockTransparentUpgradeableProxy')
        proxy = await MockTransparentUpgradeableProxy.deploy(logicContract, proxyAdminContract, '0x')
        await proxy.deployed()
    })

    it('Should set the initial owner to the deployer', async function () {
        expect(await mockProxyAdmin.owner()).to.equal(deployer.address)
    })

    it('Should report the proxy admin address', async function () {
        expect(await mockProxyAdmin.getProxyAdmin(proxy.address)).to.equal(proxyAdminContract)
    })

    it('Should report the proxy implementation address', async function () {
        expect(await mockProxyAdmin.getProxyImplementation(proxy.address)).to.equal(logicContract)
    })

    it('Should change the proxy admin to a new admin', async function () {
        const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin')
        const newAdmin = await MockProxyAdmin.deploy()
        await newAdmin.deployed()

        await mockProxyAdmin.changeProxyAdmin(proxy.address, newAdmin.address)
        expect(await mockProxyAdmin.getProxyAdmin(proxy.address)).to.equal(newAdmin.address)
    })

    it('Should upgrade the proxy to a new implementation', async function () {
        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
        const newLogic = await MockERC20Upgradeable.deploy()
        await newLogic.deployed()

        await mockProxyAdmin.upgrade(proxy.address, newLogic.address)
        expect(await mockProxyAdmin.getProxyImplementation(proxy.address)).to.equal(newLogic.address)
    })

    it('Should upgrade the proxy and invoke a function via upgradeAndCall', async function () {
        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
        const newLogic = await MockERC20Upgradeable.deploy()
        await newLogic.deployed()

        const MockERC20UpgradeableFactory = await ethers.getContractFactory('MockERC20Upgradeable')
        const fragment = MockERC20UpgradeableFactory.interface.getFunction('initialize', 'string,string')
        const callData = MockERC20UpgradeableFactory.interface.encodeFunctionData(fragment, ['UpgradedToken', 'UPG'])

        await mockProxyAdmin.upgradeAndCall(proxy.address, newLogic.address, callData)
        expect(await mockProxyAdmin.getProxyImplementation(proxy.address)).to.equal(newLogic.address)
    })

    it('Should transfer ownership of the proxy admin', async function () {
        await mockProxyAdmin.transferOwnership(user1.address)
        expect(await mockProxyAdmin.owner()).to.equal(user1.address)
    })

    it('Should renounce ownership of the proxy admin', async function () {
        await mockProxyAdmin.renounceOwnership()
        expect(await mockProxyAdmin.owner()).to.equal(ethers.constants.AddressZero)
    })

    it('Should revert changeProxyAdmin when called by a non-owner', async function () {
        const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin')
        const newAdmin = await MockProxyAdmin.deploy()
        await newAdmin.deployed()

        let reverted = false
        try {
            await mockProxyAdmin.connect(user1).changeProxyAdmin(proxy.address, newAdmin.address)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })
})