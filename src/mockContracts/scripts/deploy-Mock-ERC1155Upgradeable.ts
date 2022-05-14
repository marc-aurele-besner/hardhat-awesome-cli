/*
import { ethers, addressBook, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    const MockERC1155Upgradeable = await ethers.getContractFactory('MockERC1155')
    const mockERC1155Upgradeable = await MockERC1155Upgradeable.deploy()

    await mockERC1155Upgradeable.deployed()
    await addressBook.saveContract('MockERC1155Upgradeable', mockERC1155Upgradeable.address, network.name, deployer.address)
    await mockERC1155Upgradeable.initialize('MockERC1155', 'MOCK', 'https://google.com')

    console.log('MockERC1155Upgradeable deployed to:', mockERC1155Upgradeable.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
*/
