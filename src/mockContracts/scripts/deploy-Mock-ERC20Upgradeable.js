// @ts-ignore-next-line
const hre = require('hardhat')

async function main() {
    const [deployer] = await hre.ethers.getSigners()

    const MockERC20Upgradeable = await hre.ethers.getContractFactory('MockERC20Upgradeable')
    const mockERC20Upgradeable = await MockERC20Upgradeable.deploy()

    await mockERC20Upgradeable.deployed()
    await hre.addressBook.saveContract(
        'MockERC20Upgradeable',
        mockERC20Upgradeable.address,
        hre.network.name,
        deployer.address
    )
    await mockERC20Upgradeable.initialize('MockERC20Upgradeable', 'MOCK')

    console.log('MockERC20Upgradeable deployed to:', mockERC20Upgradeable.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
