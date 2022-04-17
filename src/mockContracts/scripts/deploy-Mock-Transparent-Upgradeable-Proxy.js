/*
const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    let logicContract = '';
    if(hre.network.name !== 'hardhat' && hre.network.name !== 'local') {
        logicContract = await hre.addressBook.retrieveContract('MockERC20Upgradeable', hre.network.name);
        if (!logicContract) logicContract = await hre.addressBook.retrieveContract('MockERC721Upgradeable', hre.network.name);
        if (!logicContract) logicContract = await hre.addressBook.retrieveContract('MockERC1155Upgradeable', hre.network.name);
    }
    if (!logicContract) {
        const MockERC20Upgradeable = await hre.ethers.getContractFactory('MockERC20Upgradeable');
        const mockERC20Upgradeable = await MockERC20Upgradeable.deploy();

        await mockERC20Upgradeable.deployed();
        await hre.addressBook.saveContract('MockERC20Upgradeable', mockERC20Upgradeable.address, hre.network.name, deployer.address);
        await mockERC20Upgradeable.initialize('MockERC20Upgradeable', 'MOCK');

        console.log('MockERC20Upgradeable deployed to:', mockERC20Upgradeable.address);
        logicContract = mockERC20Upgradeable.address;
    }
    let proxyAdminContract = '';
    if(hre.network.name !== 'hardhat' && hre.network.name !== 'local') {
        proxyAdminContract = await addressBook.retrieveContract('MockERC20Upgradeable', hre.network.name);
    }
    if (!proxyAdminContract) {
        const MockProxyAdmin = await hre.ethers.getContractFactory('MockProxyAdmin');
        const mockProxyAdmin = await MockProxyAdmin.deploy();

        await mockProxyAdmin.deployed();
        await hre.addressBook.saveContract('MockProxyAdmin', mockProxyAdmin.address, hre.network.name, deployer.address);

        console.log('MockProxyAdmin deployed to:', mockProxyAdmin.address);
        proxyAdminContract = mockProxyAdmin.address;
    }

    const MockTransparentUpgradeableProxy = await hre.ethers.getContractFactory('MockTransparentUpgradeableProxy');
    const mockTransparentUpgradeableProxy = await MockTransparentUpgradeableProxy.deploy(logicContract, proxyAdminContract, "0x");

    await mockTransparentUpgradeableProxy.deployed();
    await hre.addressBook.saveContract('MockTransparentUpgradeableProxy', mockTransparentUpgradeableProxy.address, hre.network.name, deployer.address);

    console.log('MockTransparentUpgradeableProxy deployed to:', mockTransparentUpgradeableProxy.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
*/
