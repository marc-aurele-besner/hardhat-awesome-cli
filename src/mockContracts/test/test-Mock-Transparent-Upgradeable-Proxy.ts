import { expect } from 'chai'
// @ts-ignore-next-line
import { ethers } from 'hardhat'

let mockTransparentUpgradeableProxy: any
let mockProxyAdmin: any
let logicContract = ''
let proxyAdminContract = ''
let deployer: any

describe('MockTransparentUpgradeableProxy', function () {
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
        ;[deployer] = await ethers.getSigners()

        const MockTransparentUpgradeableProxy = await ethers.getContractFactory('MockTransparentUpgradeableProxy')
        mockTransparentUpgradeableProxy = await MockTransparentUpgradeableProxy.deploy(
            logicContract,
            proxyAdminContract,
            '0x'
        )
        await mockTransparentUpgradeableProxy.deployed()
    })

    it('Should return the admin of the proxy', async function () {
        expect(await mockProxyAdmin.getProxyAdmin(mockTransparentUpgradeableProxy.address)).to.equal(proxyAdminContract)
    })

    it('Should return the implementation of the proxy', async function () {
        expect(await mockProxyAdmin.getProxyImplementation(mockTransparentUpgradeableProxy.address)).to.equal(
            logicContract
        )
    })

    it('Should deploy a new Admin Proxy contract and change the admin of the proxy', async function () {
        const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin')
        const MockERC20UpgradeableV2 = await MockProxyAdmin.deploy()

        await MockERC20UpgradeableV2.deployed()
        await mockProxyAdmin.changeProxyAdmin(mockTransparentUpgradeableProxy.address, MockERC20UpgradeableV2.address)
        expect(await mockProxyAdmin.getProxyAdmin(mockTransparentUpgradeableProxy.address)).to.equal(
            MockERC20UpgradeableV2.address
        )
    })

    it('Should deploy a new contract logic and upgrade the implementation of the proxy', async function () {
        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
        const MockERC20UpgradeableV2 = await MockERC20Upgradeable.deploy()

        await MockERC20UpgradeableV2.deployed()
        await mockProxyAdmin.upgrade(mockTransparentUpgradeableProxy.address, MockERC20UpgradeableV2.address)
        expect(await mockProxyAdmin.getProxyImplementation(mockTransparentUpgradeableProxy.address)).to.equal(
            MockERC20UpgradeableV2.address
        )
    })
})
