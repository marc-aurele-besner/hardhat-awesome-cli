import { expect } from 'chai'
// @ts-ignore-next-line
import { ethers } from 'hardhat'

let mockERC1155Upgradeable: any
let deployer: any

describe('MockERC1155UpgradeableUpgradeable', function () {
    beforeEach(async function () {
        ;[deployer] = await ethers.getSigners()

        const MockERC1155Upgradeable = await ethers.getContractFactory('MockERC1155Upgradeable')
        mockERC1155Upgradeable = await MockERC1155Upgradeable.deploy()
        await mockERC1155Upgradeable.deployed()
        await mockERC1155Upgradeable.initialize('MockERC1155Upgradeable', 'MOCK', 'https://google.com')
    })

    it('Should return the name of the token', async function () {
        expect(await mockERC1155Upgradeable.name()).to.equal('MockERC1155Upgradeable')
    })

    it('Should return the symbol of the token', async function () {
        expect(await mockERC1155Upgradeable.symbol()).to.equal('MOCK')
    })
})
