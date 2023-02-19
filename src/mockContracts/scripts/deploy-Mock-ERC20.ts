// @ts-ignore-next-line
import { addressBook, ethers, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    const MockERC20 = await ethers.getContractFactory('MockERC20')
    const mockERC20 = await MockERC20.deploy()

    await mockERC20.deployed()
    await addressBook.saveContract('MockERC20', mockERC20.address, network.name, deployer.address)

    console.log('MockERC20 deployed to:', mockERC20.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
