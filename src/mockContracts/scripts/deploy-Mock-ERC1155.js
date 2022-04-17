/*
const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const MockERC1155 = await hre.ethers.getContractFactory('MockERC1155');
    const mockERC1155 = await MockERC1155.deploy();

    await mockERC1155.deployed();
    await hre.addressBook.saveContract('MockERC1155', mockERC1155.address, hre.network.name, deployer.address);

    console.log('MockERC1155 deployed to:', mockERC1155.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
*/
