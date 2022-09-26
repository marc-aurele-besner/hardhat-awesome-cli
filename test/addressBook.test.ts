// tslint:disable-next-line no-implicit-dependencies
import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'

import { useEnvironment } from './helpers'

interface IAddressDetails {
    name: string
    address: string
    network: string
    deployer: string
    deploymentDate: string
    blockHash?: string
    blockNumber?: number
    tag?: string
    extra?: any
}

describe('Integration tests', function () {
    describe('AwesomeAddressBook', function () {
        useEnvironment('hardhat-cli')

        it('saveContract()', function () {
            expect(
                this.hre.addressBook.saveContract(
                    'MockERC20',
                    '0x0000000000000000000000000000000000000000',
                    'hardhat',
                    '0x0000000000000000000000000000000000000000'
                )
            ).to.be.equal(undefined)
        })

        it('saveContract() wit extra arguments', function () {
            expect(
                this.hre.addressBook.saveContract(
                    'MockERC20',
                    '0x0000000000000000000000000000000000000000',
                    'hardhat',
                    '0x0000000000000000000000000000000000000000',
                    0,
                    '0x0000000000000000000000000000000000000001',
                    1
                )
            ).to.be.equal(undefined)
        })

        it('2x saveContract() wit extra arguments', function () {
            this.hre.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.hre.addressBook.saveContract(
                'MockERC20-B',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000001',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            expect(this.hre.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000000'
            )
            expect(this.hre.addressBook.retrieveContract('MockERC20-B', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000001'
            )
        })

        it('saveContract() wit extra arguments, then clean then from log', function () {
            expect(
                this.hre.addressBook.saveContract(
                    'MockERC20',
                    '0x0000000000000000000000000000000000000000',
                    'hardhat',
                    '0x0000000000000000000000000000000000000000',
                    0,
                    '0x0000000000000000000000000000000000000001',
                    1
                )
            ).to.be.equal(undefined)
            this.hre.addressBook.cleanContractDeployed('name', 'MockERC20', true, true)
            expect(this.hre.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal('')
        })

        it('saveContract() wit extra arguments, and extra record, then clean then from log', function () {
            expect(
                this.hre.addressBook.saveContract(
                    'MockERC20',
                    '0x0000000000000000000000000000000000000000',
                    'hardhat',
                    '0x0000000000000000000000000000000000000000',
                    0,
                    '0x0000000000000000000000000000000000000001',
                    1
                )
            ).to.be.equal(undefined)
            this.hre.addressBook.saveContract(
                'MockERC20-test',
                '0x0000000000000000000000000000000000000001',
                'testnet',
                '0x0000000000000000000000000000000000000000',
                1,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.hre.addressBook.cleanContractDeployed('network', 'hardhat', true, true)
            expect(this.hre.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal('')
        })

        it('3x saveContract() wit extra arguments, then clean then from log', function () {
            this.hre.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'testnet',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.hre.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.hre.addressBook.saveContract(
                'MockERC20-B',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000001',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            this.hre.addressBook.cleanContractDeployed('network', 'hardhat', true, true)
            expect(this.hre.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal('')
            expect(this.hre.addressBook.retrieveContract('MockERC20-B', 'hardhat')).to.be.equal('')
        })

        it('3x saveContract() wit extra arguments, then clean then from lo only one', function () {
            this.hre.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'testnet',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.hre.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.hre.addressBook.saveContract(
                'MockERC20-B',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000001',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            this.hre.addressBook.cleanContractDeployed('network', 'testnet', true, true)
            expect(this.hre.addressBook.retrieveContract('MockERC20', 'testnet')).to.be.equal('')
            expect(this.hre.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000000'
            )
            expect(this.hre.addressBook.retrieveContract('MockERC20-B', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000001'
            )
        })

        it('retrieveContract()', async function () {
            this.hre.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            expect(await this.hre.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000001'
            )
        })

        it('retrieveContractObject()', async function () {
            this.hre.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.hre.addressBook.saveContract(
                'MockERC20-retrieveContractObject2',
                '0x0000000000000000000000000000000000000002',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            // Wait 1 second to ensure the timestamp is different
            await new Promise((resolve) => setTimeout(resolve, 1000))
            const retrieveContractObject: IAddressDetails | null = await this.hre.addressBook.retrieveContractObject(
                'MockERC20',
                'hardhat'
            )

            expect(retrieveContractObject).to.not.be.equal(null)
            if (retrieveContractObject) {
                expect(retrieveContractObject.name).to.be.equal('MockERC20')
                expect(retrieveContractObject.address).to.be.equal('0x0000000000000000000000000000000000000001')
                expect(retrieveContractObject.network).to.be.equal('hardhat')
                expect(retrieveContractObject.blockHash).to.be.equal('0x0000000000000000000000000000000000000001')
                expect(retrieveContractObject.blockNumber).to.be.equal(1)
            }
        })

        it('contractsAddressDeployed.json exist', function () {
            expect(fs.existsSync('contractsAddressDeployed.json')).to.be.equal(true)
        })

        it('contractsAddressDeployedHistory.json exist', function () {
            expect(fs.existsSync('contractsAddressDeployedHistory.json')).to.be.equal(true)
        })

        it('Delete contractsAddressDeployed.json from previous tests', function () {
            expect(fs.unlinkSync('contractsAddressDeployed.json')).to.be.equal(undefined)
            expect(fs.existsSync('contractsAddressDeployed.json')).to.be.equal(false)
        })

        it('Delete contractsAddressDeployedHistory.json from previous tests', function () {
            expect(fs.unlinkSync('contractsAddressDeployedHistory.json')).to.be.equal(undefined)
            expect(fs.existsSync('contractsAddressDeployedHistory.json')).to.be.equal(false)
        })
    })
})
