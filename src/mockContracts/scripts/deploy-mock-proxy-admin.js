/*
const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const MockProxyAdmin = await hre.ethers.getContractFactory('MockProxyAdmin');
    const mockProxyAdmin = await MockProxyAdmin.deploy();

    await mockProxyAdmin.deployed();
    await addressBook.saveContract('MockProxyAdmin', mockProxyAdmin.address, hre.network.name, deployer.address);

    console.log('MockProxyAdmin deployed to:', mockProxyAdmin.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
*/
