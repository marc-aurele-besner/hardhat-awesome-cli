/*
import { ethers, addressBook, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin')
    const mockProxyAdmin = await MockProxyAdmin.deploy()

    await mockProxyAdmin.deployed()
    await addressBook.saveContract('MockProxyAdmin', mockProxyAdmin.address, network.name, deployer.address)

    console.log('MockERC20 deployed to:', mockProxyAdmin.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
*/
