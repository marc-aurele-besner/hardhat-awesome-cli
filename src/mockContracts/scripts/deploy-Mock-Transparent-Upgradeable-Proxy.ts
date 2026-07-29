// @ts-ignore-next-line
import { addressBook, ethers, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    const networkName = (network as any).name as string

    let logicContract = ''
    if (networkName !== 'hardhat' && networkName !== 'local') {
        logicContract = await addressBook.retrieveContract('MockERC20Upgradeable', networkName)
        if (!logicContract) logicContract = await addressBook.retrieveContract('MockERC721Upgradeable', networkName)
        if (!logicContract) logicContract = await addressBook.retrieveContract('MockERC1155Upgradeable', networkName)
    }
    if (!logicContract) {
        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
        const mockERC20Upgradeable = await MockERC20Upgradeable.deploy()

        await mockERC20Upgradeable.deployed()
        await addressBook.saveContract(
            'MockERC20Upgradeable',
            mockERC20Upgradeable.address,
            networkName,
            deployer.address
        )
        await mockERC20Upgradeable.initialize('MockERC20Upgradeable', 'MOCK')

        console.log('MockERC20Upgradeable deployed to:', mockERC20Upgradeable.address)
        logicContract = mockERC20Upgradeable.address
    }
    let proxyAdminContract = ''
    if (networkName !== 'hardhat' && networkName !== 'local') {
        proxyAdminContract = await addressBook.retrieveContract('MockERC20Upgradeable', networkName)
    }
    if (!proxyAdminContract) {
        const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin')
        const mockProxyAdmin = await MockProxyAdmin.deploy()

        await mockProxyAdmin.deployed()
        await addressBook.saveContract('MockProxyAdmin', mockProxyAdmin.address, networkName, deployer.address)

        console.log('MockProxyAdmin deployed to:', mockProxyAdmin.address)
        proxyAdminContract = mockProxyAdmin.address
    }

    const MockTransparentUpgradeableProxy = await ethers.getContractFactory('MockTransparentUpgradeableProxy')
    const mockTransparentUpgradeableProxy = await MockTransparentUpgradeableProxy.deploy(
        logicContract,
        proxyAdminContract,
        '0x'
    )

    await mockTransparentUpgradeableProxy.deployed()
    await addressBook.saveContract(
        'MockTransparentUpgradeableProxy',
        mockTransparentUpgradeableProxy.address,
        networkName,
        deployer.address
    )

    console.log('MockTransparentUpgradeableProxy deployed to:', mockTransparentUpgradeableProxy.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
