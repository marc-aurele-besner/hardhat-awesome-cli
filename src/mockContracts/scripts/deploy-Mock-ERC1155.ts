/*
import { ethers, addressBook, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    const MockERC1155 = await ethers.getContractFactory('MockERC1155')
    const mockERC1155 = await MockERC1155.deploy()

    await mockERC1155.deployed()
    await addressBook.saveContract('MockERC1155', mockERC1155.address, network.name, deployer.address)

    console.log('MockERC1155 deployed to:', mockERC1155.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
*/
