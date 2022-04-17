/*
import { ethers, addressBook, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()
    
    const MockERC721 = await ethers.getContractFactory('MockERC721')
    const mockERC721 = await MockERC721.deploy()

    await mockERC721.deployed()
    await addressBook.saveContract('MockERC721', mockERC721.address, network.name, deployer.address)

    console.log('MockERC721 deployed to:', mockERC721.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
*/
