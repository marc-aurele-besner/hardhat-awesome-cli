/*
import { ethers, addressBook, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    const MockERC1155 = await ethers.getContractFactory('MockERC1155')
    const mockERC1155 = await MockERC1155.deploy()

    await mockERC1155.deployed()
    await addressBook.saveContract('MockERC1155Upgradeable', mockERC1155.address, network.name, deployer.address)
    await mockERC1155.initialize('MockERC1155', 'MOCK', 'https://google.com')

    console.log('MockERC1155Upgradeable deployed to:', mockERC1155.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
*/
