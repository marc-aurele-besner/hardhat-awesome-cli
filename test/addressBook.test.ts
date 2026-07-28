import { expect } from 'chai'
import fs from 'fs'

import { AwesomeAddressBook } from '../src/AwesomeAddressBook'
import { useAddressBookEnvironment } from './helpers'

describe('Integration tests', function () {
    describe('AwesomeAddressBook', function () {
        const userConfig = {
            addressBook: {
                savePath: './',
                openzeppelinPath: '.openzeppelin',
                contractsFlattenPath: 'contractsFlatten',
                contractsFlattenPrefix: 'flat_',
                fileHardhatAwesomeCLI: 'hardhat-awesome-cli.json',
                fileEnvHardhatAwesomeCLI: '.env.hardhat-awesome-cli',
                fileContractsAddressDeployed: 'contractsAddressDeployed.json',
                fileContractsAddressDeployedHistory: 'contractsAddressDeployedHistory.json'
            }
        }

        useAddressBookEnvironment('hardhat-cli', userConfig)

        beforeEach(function () {
            this.addressBook = new AwesomeAddressBook(this.env.userConfig, 'hardhat')
        })

        it('saveContract()', function () {
            expect(
                this.addressBook.saveContract(
                    'MockERC20',
                    '0x0000000000000000000000000000000000000000',
                    'hardhat',
                    '0x0000000000000000000000000000000000000000'
                )
            ).to.be.equal(undefined)
        })

        it('saveContract() wit extra arguments', function () {
            expect(
                this.addressBook.saveContract(
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
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.addressBook.saveContract(
                'MockERC20-B',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000001',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            expect(this.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000000'
            )
            expect(this.addressBook.retrieveContract('MockERC20-B', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000001'
            )
        })

        it('4x saveContract() (2 different contracts twice, replacing 1st entry)', function () {
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.addressBook.saveContract(
                'MockERC20-B',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000001',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            this.addressBook.saveContract(
                'MockERC20-B',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000001',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            expect(this.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000001'
            )
            const data = fs.readFileSync('./contractsAddressDeployed.json')
            expect(JSON.parse(data.toString()).length).to.be.equal(2)
        })

        it('saveContract() wit extra arguments, then clean then from log', function () {
            expect(
                this.addressBook.saveContract(
                    'MockERC20',
                    '0x0000000000000000000000000000000000000000',
                    'hardhat',
                    '0x0000000000000000000000000000000000000000',
                    0,
                    '0x0000000000000000000000000000000000000001',
                    1
                )
            ).to.be.equal(undefined)
            this.addressBook.cleanContractDeployed('name', 'MockERC20', true, true)
            expect(this.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal('')
        })

        it('saveContract() wit extra arguments, and extra record, then clean then from log', function () {
            expect(
                this.addressBook.saveContract(
                    'MockERC20',
                    '0x0000000000000000000000000000000000000000',
                    'hardhat',
                    '0x0000000000000000000000000000000000000000',
                    0,
                    '0x0000000000000000000000000000000000000001',
                    1
                )
            ).to.be.equal(undefined)
            this.addressBook.saveContract(
                'MockERC20-test',
                '0x0000000000000000000000000000000000000001',
                'testnet',
                '0x0000000000000000000000000000000000000000',
                1,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.addressBook.cleanContractDeployed('network', 'hardhat', true, true)
            expect(this.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal('')
        })

        it('3x saveContract() wit extra arguments, then clean then from log', function () {
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'testnet',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.addressBook.saveContract(
                'MockERC20-B',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000001',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            this.addressBook.cleanContractDeployed('network', 'hardhat', true, true)
            expect(this.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal('')
            expect(this.addressBook.retrieveContract('MockERC20-B', 'hardhat')).to.be.equal('')
        })

        it('3x saveContract() wit extra arguments, then clean then from lo only one', function () {
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'testnet',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000000',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.addressBook.saveContract(
                'MockERC20-B',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000001',
                0,
                '0x0000000000000000000000000000000000000002',
                2
            )
            this.addressBook.cleanContractDeployed('network', 'testnet', true, true)
            expect(this.addressBook.retrieveContract('MockERC20', 'testnet')).to.be.equal('')
            expect(this.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000000'
            )
            expect(this.addressBook.retrieveContract('MockERC20-B', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000001'
            )
        })

        it('retrieveContract()', function () {
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            expect(this.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal(
                '0x0000000000000000000000000000000000000001'
            )
        })

        it('retrieveContractObject()', function () {
            this.addressBook.saveContract(
                'MockERC20',
                '0x0000000000000000000000000000000000000001',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            this.addressBook.saveContract(
                'MockERC20-retrieveContractObject2',
                '0x0000000000000000000000000000000000000002',
                'hardhat',
                '0x0000000000000000000000000000000000000000',
                0,
                '0x0000000000000000000000000000000000000001',
                1
            )
            // Wait 1 second to ensure the timestamp is different
            // (kept for parity with the original Hardhat 2 test)
            const retrieveContractObject: any = this.addressBook.retrieveContractObject(
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

        describe('retrieveOZAdminProxyContract', function () {
            const ozDir = '.openzeppelin'
            const mainnetAdmin = '0x0000000000000000000000000000000000000abc'
            const sepoliaAdmin = '0x0000000000000000000000000000000000000def'

            beforeEach(function () {
                if (!fs.existsSync(ozDir)) fs.mkdirSync(ozDir)
                fs.writeFileSync(
                    `${ozDir}/mainnet.json`,
                    JSON.stringify({ admin: { address: mainnetAdmin } })
                )
                fs.writeFileSync(
                    `${ozDir}/sepolia.json`,
                    JSON.stringify({ admin: { address: sepoliaAdmin } })
                )
            })

            afterEach(function () {
                if (fs.existsSync(`${ozDir}/mainnet.json`)) fs.unlinkSync(`${ozDir}/mainnet.json`)
                if (fs.existsSync(`${ozDir}/sepolia.json`)) fs.unlinkSync(`${ozDir}/sepolia.json`)
                if (fs.existsSync(ozDir)) fs.rmdirSync(ozDir)
            })

            it('returns the mainnet admin address for chainId 1', function () {
                expect(this.addressBook.retrieveOZAdminProxyContract(1)).to.be.equal(mainnetAdmin)
            })

            it('returns the sepolia admin address for chainId 11155111', function () {
                expect(this.addressBook.retrieveOZAdminProxyContract(11155111)).to.be.equal(sepoliaAdmin)
            })

            it('returns an empty string for an unknown chainId', function () {
                expect(this.addressBook.retrieveOZAdminProxyContract(999999)).to.be.equal('')
            })
        })
    })
})