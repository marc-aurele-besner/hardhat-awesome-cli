/*
import { ethers } from 'hardhat'
import { addressBook } from 'hardhat'

async function main() {
    const [deployer] = await hre.ethers.getSigners()

    const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable')
    const mockERC20Upgradeable = await MockERC20Upgradeable.deploy()

    await mockERC20Upgradeable.deployed()
    await addressBook.saveContract('MockERC20Upgradeable', mockERC20Upgradeable.address, hre.network.name, deployer.address)
    await mockERC20Upgradeable.initialize('MockERC20Upgradeable', 'MOCK')

    console.log('MockERC20Upgradeable deployed to:', mockERC20Upgradeable.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
*/
