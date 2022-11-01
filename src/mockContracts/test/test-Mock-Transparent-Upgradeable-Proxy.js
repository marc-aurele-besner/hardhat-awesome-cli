/*
const { expect } = require('chai');
const { ethers } = require('hardhat');

let mockTransparentUpgradeableProxy;
let mockProxyAdmin;
let logicContract = '';
let proxyAdminContract = '';
let deployer;

describe('MockTransparentUpgradeableProxy', function () {
    before(async function () {
        if (!logicContract) {
            const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable');
            const mockERC20Upgradeable = await MockERC20Upgradeable.deploy();
    
            await mockERC20Upgradeable.deployed();
            logicContract = mockERC20Upgradeable.address;
        }
        if (!proxyAdminContract) {
            const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin');
            mockProxyAdmin = await MockProxyAdmin.deploy();
    
            await mockProxyAdmin.deployed();
            proxyAdminContract = mockProxyAdmin.address;
        }
    })
    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        const MockTransparentUpgradeableProxy = await ethers.getContractFactory('MockTransparentUpgradeableProxy');
        mockTransparentUpgradeableProxy = await MockTransparentUpgradeableProxy.deploy(logicContract,
            proxyAdminContract,
            '0x');
        await mockTransparentUpgradeableProxy.deployed();
    })

    it('Should return the admin of the proxy', async function () {
        expect(await mockProxyAdmin.getProxyAdmin(mockTransparentUpgradeableProxy.address)).to.equal(proxyAdminContract);
    })

    it('Should return the implementation of the proxy', async function () {
        expect(await mockProxyAdmin.getProxyImplementation(mockTransparentUpgradeableProxy.address)).to.equal(logicContract);
    })

    it('Should deploy a new Admin Proxy contract and change the admin of the proxy', async function () {
        const MockProxyAdmin = await ethers.getContractFactory('MockProxyAdmin');
        const new_mockProxyAdmin = await MockProxyAdmin.deploy();

        await new_mockProxyAdmin.deployed();
        await mockProxyAdmin.changeProxyAdmin(mockTransparentUpgradeableProxy.address, new_mockProxyAdmin.address);
        expect(await new_mockProxyAdmin.getProxyAdmin(mockTransparentUpgradeableProxy.address)).to.equal(new_mockProxyAdmin.address);
    })

    it('Should deploy a new contract logic and upgrade the implementation of the proxy', async function () {
        const MockERC20Upgradeable = await ethers.getContractFactory('MockERC20Upgradeable');
        const new_mockERC20Upgradeable = await MockERC20Upgradeable.deploy();

        await new_mockERC20Upgradeable.deployed();
        await mockProxyAdmin.upgrade(mockTransparentUpgradeableProxy.address, new_mockERC20Upgradeable.address);
        expect(await mockProxyAdmin.getProxyImplementation(mockTransparentUpgradeableProxy.address)).to.equal(new_mockERC20Upgradeable.address);
    })
})
*/
