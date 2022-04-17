/*
const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const MockERC1155Upgradeable = await hre.ethers.getContractFactory('MockERC1155Upgradeable');
    const mockERC1155Upgradeable = await MockERC1155Upgradeable.deploy();

    await mockERC1155Upgradeable.deployed();
    await hre.addressBook.saveContract('MockERC1155Upgradeable', mockERC1155Upgradeable.address, hre.network.name, deployer.address);
    await mockERC1155Upgradeable.initialize('MockERC1155Upgradeable', 'MOCK', 'https://google.com');

    console.log('MockERC1155Upgradeable deployed to:', mockERC1155Upgradeable.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
*/
