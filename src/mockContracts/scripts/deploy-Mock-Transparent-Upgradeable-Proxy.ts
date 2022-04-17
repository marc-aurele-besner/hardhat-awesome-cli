/*
import { ethers, addressBook, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    let logicContract = ''
    if(hre.network.name !== 'hardhat' && hre.network.name !== 'local') {
        logicContract = await addressBook.retrieveContract('MockERC20Upgradeable', network.name)
        if (!logicContract) logicContract = await addressBook.retrieveContract('MockERC721Upgradeable', network.name)
        if (!logicContract) logicContract = await addressBook.retrieveContract('MockERC1155Upgradeable', network.name)
    }
    if (!logicContract) {
        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
        const mockERC20Upgradeable = await MockERC20Upgradeable.deploy()

        await mockERC20Upgradeable.deployed()
        await addressBook.saveContract('MockERC20Upgradeable', mockERC20Upgradeable.address, network.name, deployer.address)
        await mockERC20Upgradeable.initialize('MockERC20Upgradeable', 'MOCK')

        console.log('MockERC20Upgradeable deployed to:', mockERC20Upgradeable.address)
        logicContract = mockERC20Upgradeable.address
    }
    let proxyAdminContract = ''
    if(hre.network.name !== 'hardhat' && hre.network.name !== 'local') {
        proxyAdminContract = await addressBook.retrieveContract('MockERC20Upgradeable', network.name)
    }
    if (!proxyAdminContract) {
        const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin')
        const mockProxyAdmin = await MockProxyAdmin.deploy()

        await mockProxyAdmin.deployed()
        await addressBook.saveContract('MockProxyAdmin', mockProxyAdmin.address, network.name, deployer.address)

        console.log('MockProxyAdmin deployed to:', mockProxyAdmin.address)
        proxyAdminContract = mockProxyAdmin.address
    }

    const MockTransparentUpgradeableProxy = await ethers.getContractFactory('MockTransparentUpgradeableProxy')
    const mockTransparentUpgradeableProxy = await MockTransparentUpgradeableProxy.deploy(logicContract, proxyAdminContract, "0x")

    await mockTransparentUpgradeableProxy.deployed()
    await addressBook.saveContract('MockTransparentUpgradeableProxy', mockTransparentUpgradeableProxy.address, network.name, deployer.address)

    console.log('MockERC20 deployed to:', mockTransparentUpgradeableProxy.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
*/
