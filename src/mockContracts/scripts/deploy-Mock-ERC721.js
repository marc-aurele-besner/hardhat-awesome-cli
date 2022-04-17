/*
const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const MockERC721 = await hre.ethers.getContractFactory('MockERC721');
    const mockERC721 = await MockERC721.deploy();

    await mockERC721.deployed();
    await hre.addressBook.saveContract('MockERC721', mockERC721.address, hre.network.name, deployer.address);

    console.log('MockERC721 deployed to:', mockERC721.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
*/
