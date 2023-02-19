// @ts-ignore-next-line
import { addressBook, ethers, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    const MockERC721Upgradeable = await ethers.getContractFactory('MockERC721Upgradeable')
    const mockERC721Upgradeable = await MockERC721Upgradeable.deploy()

    await mockERC721Upgradeable.deployed()
    await addressBook.saveContract(
        'MockERC721Upgradeable',
        mockERC721Upgradeable.address,
        network.name,
        deployer.address
    )
    await mockERC721Upgradeable.initialize('MockERC721Upgradeable', 'MOCK')

    console.log('MockERC721Upgradeable deployed to:', mockERC721Upgradeable.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
