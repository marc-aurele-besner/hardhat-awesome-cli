import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
    buildVerifyCommand,
    formatVerifyContractFlag,
    isEthereumAddress,
    listDeployedContractsForNetwork,
    loadDeployedContracts,
    parseVerifyContractFlag,
    resolveContractAddress,
    resolveChainShortName
} from '../src/buildVerifyContract.ts'
import { DefaultChainList } from '../src/config.ts'
import type { IChain } from '../src/types.ts'

const SAMPLE_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const OTHER_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

const findChain = (chainName: string): IChain => {
    const chain = DefaultChainList.find((entry: IChain) => entry.chainName === chainName)
    if (!chain) throw new Error(`Test fixture missing default chain "${chainName}"`)
    return chain
}

describe('buildVerifyContract (issue #170)', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-verify-'))
        process.chdir(fixtureDirectory)
    })

    afterEach(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
    })

    describe('isEthereumAddress', function () {
        it('Accepts a checksummed 0x-prefixed address', function () {
            expect(isEthereumAddress(SAMPLE_ADDRESS)).to.equal(true)
        })

        it('Accepts an upper-case 0x-prefixed address', function () {
            expect(isEthereumAddress(SAMPLE_ADDRESS.toUpperCase())).to.equal(true)
        })

        it('Accepts an address without the 0x prefix', function () {
            expect(isEthereumAddress(SAMPLE_ADDRESS.slice(2))).to.equal(true)
        })

        it('Rejects too-short values', function () {
            expect(isEthereumAddress('0x1234')).to.equal(false)
        })

        it('Rejects non-hex characters', function () {
            expect(isEthereumAddress('0xZZZZ567890abcdef1234567890abcdef12345678')).to.equal(false)
        })

        it('Rejects empty string', function () {
            expect(isEthereumAddress('')).to.equal(false)
        })

        it('Rejects non-string values', function () {
            expect(isEthereumAddress(undefined as any)).to.equal(false)
            expect(isEthereumAddress(42 as any)).to.equal(false)
        })
    })

    describe('buildVerifyCommand', function () {
        it('Builds the no-arg command with --network before the address', function () {
            const command = buildVerifyCommand('ethereumSepolia', SAMPLE_ADDRESS)
            expect(command).to.equal(`npx hardhat verify ${SAMPLE_ADDRESS} --network ethereumSepolia`)
        })

        it('Quoted constructor arguments are appended after --network', function () {
            const command = buildVerifyCommand('ethereumSepolia', SAMPLE_ADDRESS, [
                '0xToken',
                '42'
            ])
            expect(command).to.equal(
                `npx hardhat verify ${SAMPLE_ADDRESS} --network ethereumSepolia '0xToken' '42'`
            )
        })

        it('Empty constructor args drop the trailing whitespace', function () {
            const command = buildVerifyCommand('ethereumSepolia', SAMPLE_ADDRESS, [])
            expect(command.endsWith('--network ethereumSepolia')).to.equal(true)
        })
    })

    describe('formatVerifyContractFlag / parseVerifyContractFlag', function () {
        it('Round-trips a network + name without constructor args', function () {
            const formatted = formatVerifyContractFlag('ethereumSepolia', 'MockERC20')
            expect(formatted).to.equal('ethereumSepolia:MockERC20')
            const parsed = parseVerifyContractFlag(formatted)
            expect(parsed).to.deep.equal({
                network: 'ethereumSepolia',
                contractNameOrAddress: 'MockERC20',
                constructorArgs: []
            })
        })

        it('Round-trips a network + address + constructor args', function () {
            const formatted = formatVerifyContractFlag('ethereumSepolia', SAMPLE_ADDRESS, [
                '0xToken',
                '42'
            ])
            expect(formatted).to.equal(`ethereumSepolia:${SAMPLE_ADDRESS}:0xToken:42`)
            const parsed = parseVerifyContractFlag(formatted)
            expect(parsed).to.deep.equal({
                network: 'ethereumSepolia',
                contractNameOrAddress: SAMPLE_ADDRESS,
                constructorArgs: ['0xToken', '42']
            })
        })

        it('Returns undefined for empty / malformed input', function () {
            expect(parseVerifyContractFlag(undefined)).to.equal(undefined)
            expect(parseVerifyContractFlag('')).to.equal(undefined)
            expect(parseVerifyContractFlag('only-one-segment')).to.equal(undefined)
        })
    })

    describe('loadDeployedContracts / resolveContractAddress', function () {
        it('Returns an empty list when the address book file is missing', function () {
            expect(loadDeployedContracts()).to.deep.equal([])
        })

        it('Returns an empty list when the file is unparseable JSON', function () {
            fs.writeFileSync('contractsAddressDeployed.json', '{ not json')
            expect(loadDeployedContracts()).to.deep.equal([])
        })

        it('Loads entries from the address book', function () {
            fs.writeFileSync(
                'contractsAddressDeployed.json',
                JSON.stringify([
                    {
                        name: 'MockERC20',
                        address: SAMPLE_ADDRESS,
                        network: 'ethereumSepolia',
                        deployer: OTHER_ADDRESS,
                        deploymentDate: '2026-01-01T00:00:00.000Z',
                        chainId: 11155111,
                        blockHash: '',
                        blockNumber: 0,
                        tag: '',
                        extra: {}
                    }
                ])
            )
            const entries = loadDeployedContracts()
            expect(entries).to.deep.equal([
                { name: 'MockERC20', address: SAMPLE_ADDRESS, network: 'ethereumSepolia' }
            ])
        })

        it('resolveContractAddress returns the address for the matching network', function () {
            fs.writeFileSync(
                'contractsAddressDeployed.json',
                JSON.stringify([
                    {
                        name: 'MockERC20',
                        address: SAMPLE_ADDRESS,
                        network: 'ethereumSepolia',
                        deployer: OTHER_ADDRESS,
                        deploymentDate: '2026-01-01T00:00:00.000Z',
                        chainId: 11155111,
                        blockHash: '',
                        blockNumber: 0,
                        tag: '',
                        extra: {}
                    }
                ])
            )
            expect(resolveContractAddress('MockERC20', 'ethereumSepolia')).to.equal(SAMPLE_ADDRESS)
        })

        it('resolveContractAddress returns undefined when the network does not match', function () {
            fs.writeFileSync(
                'contractsAddressDeployed.json',
                JSON.stringify([
                    {
                        name: 'MockERC20',
                        address: SAMPLE_ADDRESS,
                        network: 'ethereumSepolia',
                        deployer: OTHER_ADDRESS,
                        deploymentDate: '2026-01-01T00:00:00.000Z',
                        chainId: 11155111,
                        blockHash: '',
                        blockNumber: 0,
                        tag: '',
                        extra: {}
                    }
                ])
            )
            expect(resolveContractAddress('MockERC20', 'ethereum')).to.equal(undefined)
        })

        it('resolveContractAddress returns undefined when the contract name is unknown', function () {
            expect(resolveContractAddress('Unknown', 'ethereumSepolia')).to.equal(undefined)
        })

        it('listDeployedContractsForNetwork filters entries by network', function () {
            fs.writeFileSync(
                'contractsAddressDeployed.json',
                JSON.stringify([
                    {
                        name: 'MockERC20',
                        address: SAMPLE_ADDRESS,
                        network: 'ethereumSepolia',
                        deployer: OTHER_ADDRESS,
                        deploymentDate: '2026-01-01T00:00:00.000Z',
                        chainId: 11155111,
                        blockHash: '',
                        blockNumber: 0,
                        tag: '',
                        extra: {}
                    },
                    {
                        name: 'MockERC721',
                        address: OTHER_ADDRESS,
                        network: 'ethereum',
                        deployer: OTHER_ADDRESS,
                        deploymentDate: '2026-01-01T00:00:00.000Z',
                        chainId: 1,
                        blockHash: '',
                        blockNumber: 0,
                        tag: '',
                        extra: {}
                    }
                ])
            )
            const sepoliaOnly = listDeployedContractsForNetwork('ethereumSepolia')
            expect(sepoliaOnly).to.have.length(1)
            expect(sepoliaOnly[0].name).to.equal('MockERC20')
        })
    })

    describe('resolveChainShortName', function () {
        it('Returns the chain short-name from the activated chain list when found', function () {
            const chain = findChain('ethereumSepolia')
            const shortName = resolveChainShortName(chain, [chain])
            expect(shortName).to.equal('ethereumSepolia')
        })

        it('Falls back to the chain entry chainName when the activated list is empty', function () {
            const chain = findChain('ethereumSepolia')
            const shortName = resolveChainShortName(chain, [])
            expect(shortName).to.equal('ethereumSepolia')
        })
    })
})
