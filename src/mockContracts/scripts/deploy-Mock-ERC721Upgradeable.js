/*
const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const MockERC721Upgradeable = await hre.ethers.getContractFactory('MockERC721Upgradeable');
    const mockERC721Upgradeable = await MockERC721Upgradeable.deploy();

    await mockERC721Upgradeable.deployed();
    await hre.addressBook.saveContract(
        'MockERC721Upgradeable',
        mockERC721Upgradeable.address,
        hre.network.name,
        deployer.address
    );
    await mockERC721Upgradeable.initialize('MockERC721Upgradeable', 'MOCK');

    console.log('MockERC721Upgradeable deployed to:', mockERC721Upgradeable.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
*/
