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

    it('Should delegate calls to the logic contract (proxy returns the logic name)', async function () {
        // Read name() through the proxy. Transparent proxy forwards the call
        // to the logic via delegatecall, so the proxy returns whatever the
        // logic's storage-backed `name()` returns.
        const proxyAsErc20 = await ethers.getContractAt('MockERC20Upgradeable', mockTransparentUpgradeableProxy.address)
        expect(await proxyAsErc20.name()).to.equal('')
    })

    it('Should reject direct admin calls routed through the proxy', async function () {
        // The TransparentProxy shields admin functions from the proxy itself:
        // calling `upgrade` on the proxy address must revert because the
        // caller is not the proxy admin.
        const proxyAsAdmin = await ethers.getContractAt('MockProxyAdmin', mockTransparentUpgradeableProxy.address)
        const [, user1] = await ethers.getSigners()

        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
        const newLogic = await MockERC20Upgradeable.deploy()
        await newLogic.deployed()

        let reverted = false
        try {
            await proxyAsAdmin.connect(user1).upgrade(mockTransparentUpgradeableProxy.address, newLogic.address)
        } catch (e) {
            reverted = true
        }
        expect(reverted).to.equal(true)
    })

    it('Should delegate upgradeAndCall and re-initialize the logic through the proxy', async function () {
        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
        const newLogic = await MockERC20Upgradeable.deploy()
        await newLogic.deployed()

        const factory = await ethers.getContractFactory('MockERC20Upgradeable')
        const fragment = factory.interface.getFunction('initialize', 'string,string')
        const callData = factory.interface.encodeFunctionData(fragment, ['V2Token', 'V2'])

        await mockProxyAdmin.upgradeAndCall(mockTransparentUpgradeableProxy.address, newLogic.address, callData)

        const proxyAsErc20 = await ethers.getContractAt('MockERC20Upgradeable', mockTransparentUpgradeableProxy.address)
        expect(await proxyAsErc20.name()).to.equal('V2Token')
        expect(await proxyAsErc20.symbol()).to.equal('V2')
    })
})
