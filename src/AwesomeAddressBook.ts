import fs from 'fs'

import { getAddressBookConfig } from './config.ts'
import type { IAddressBookConfig, TAddressBookFields } from './types.ts'

interface IAddressDetails {
    name: string
    address: string
    network: string
    deployer: string
    deploymentDate: string
    chainId: number
    blockHash?: string
    blockNumber?: number
    tag?: string
    extra?: Record<string, unknown>
}

/**
 * The shape passed to the `AwesomeAddressBook` constructor: either the live
 * `HardhatRuntimeEnvironment.userConfig` (which exposes `addressBook` under
 * the user's keys) or a trimmed-down object that only carries the address
 * book. Keeping this in `types.ts` lets the address-book class stay
 * decoupled from the full `hardhat.config` type.
 */
export type AddressBookUserConfig = { addressBook?: Partial<IAddressBookConfig> }

/**
 * Tracks deployed contract addresses per network.
 *
 * Hardhat 3 no longer supports extending the HardhatRuntimeEnvironment with
 * new fields, so this class is constructed with the bits of HRE it actually
 * needs (the user's raw config and the current network name) instead of the
 * whole HRE. See {@link createAddressBookFromHre} for the convenience that
 * pulls those out of the live HRE, and the plugin entry point for the
 * factory pattern used at task-action time.
 */
export class AwesomeAddressBook {
    private readonly _userConfig: AddressBookUserConfig | undefined
    private readonly _networkName: string

    constructor(userConfig: AddressBookUserConfig | undefined, networkName: string = 'hardhat') {
        this._userConfig = userConfig
        this._networkName = networkName
    }

    public get networkName(): string {
        return this._networkName
    }

    public get userConfig(): AddressBookUserConfig | undefined {
        return this._userConfig
    }

    public formatSaveContract(
        contractName: string,
        contractAddress: string,
        deployedNetwork: string,
        deployedBy: string,
        chainId: number,
        blockHash?: string,
        blockNumber?: number,
        tag?: string,
        extra?: Record<string, unknown>
    ) {
        const contractToAdd: IAddressDetails = {
            name: contractName,
            address: contractAddress,
            network: deployedNetwork,
            deployer: deployedBy,
            deploymentDate: new Date().toString(),
            chainId,
            blockHash: blockHash || '',
            blockNumber: blockNumber || 0,
            tag: tag ? tag : '',
            extra: extra || {}
        }
        return contractToAdd
    }

    public saveContract(
        contractName: string,
        contractAddress: string,
        deployedNetwork: string,
        deployedBy: string,
        chainId: number = 0,
        blockHash?: string,
        blockNumber?: number,
        tag?: string,
        extra?: Record<string, unknown>,
        forceAdd = false as boolean
    ) {
        if (
            !forceAdd &&
            this._networkName !== 'hardhat' &&
            this._networkName !== 'localhost' &&
            this._networkName !== 'anvil'
        )
            return
        const contractToAdd: IAddressDetails = this.formatSaveContract(
            contractName,
            contractAddress,
            deployedNetwork,
            deployedBy,
            chainId,
            blockHash,
            blockNumber,
            tag,
            extra
        )
        let contractsAddressDeployed = []
        let contractsAddressDeployedHistory = []
        const addressBookConfig = getAddressBookConfig(this._userConfig)
        // Add folder if not exist
        if (!fs.existsSync(addressBookConfig.savePath)) fs.mkdirSync(addressBookConfig.savePath)
        // Add or edit contract address if deploy on same network
        if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)) {
            const rawdata: any = fs.readFileSync(
                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed
            )
            contractsAddressDeployed = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                let recordModify = false
                contractsAddressDeployed = contractsAddressDeployed.map((c: IAddressDetails) => {
                    if (c.name === contractName && c.network === deployedNetwork) {
                        c.address = contractAddress
                        c.deployer = deployedBy
                        c.deploymentDate = new Date().toString()
                        c.chainId = chainId
                        c.blockHash = blockHash || ''
                        c.blockNumber = blockNumber || 0
                        c.tag = tag || ''
                        c.extra = extra || {}
                        recordModify = true
                    }
                    return c
                })
                if (!recordModify) {
                    contractsAddressDeployed.push(contractToAdd)
                }
            }
            fs.unlinkSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)
        } else {
            contractsAddressDeployed.push(contractToAdd)
        }
        try {
            fs.writeFileSync(
                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed,
                JSON.stringify(contractsAddressDeployed, null, 2)
            )
        } catch (err) {
            console.log('Error writing address to file: ', err)
        }

        // Log all contracts deployed
        if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory)) {
            const rawdata: any = fs.readFileSync(
                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory
            )
            contractsAddressDeployedHistory = JSON.parse(rawdata)
            contractsAddressDeployedHistory.push(contractToAdd)
            fs.unlinkSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory)
        } else {
            contractsAddressDeployedHistory.push(contractToAdd)
        }
        try {
            fs.writeFileSync(
                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory,
                JSON.stringify(contractsAddressDeployedHistory, null, 2)
            )
        } catch (err) {
            console.log('Error writing address to file: ', err)
        }
    }

    public retrieveContract(contractName: string, deployedNetwork: string) {
        let returnContractAddress = ''
        const addressBookConfig = getAddressBookConfig(this._userConfig)
        if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)) {
            const rawdata: any = fs.readFileSync(
                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed
            )
            const contractsAddressDeployed: IAddressDetails[] = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                if (
                    contractsAddressDeployed.find(
                        (c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork
                    )
                )
                    returnContractAddress = contractsAddressDeployed.filter(
                        (c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork
                    )[0].address
            }
        }
        return returnContractAddress
    }

    public retrieveContractObject(contractName: string, deployedNetwork: string) {
        const addressBookConfig = getAddressBookConfig(this._userConfig)
        if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)) {
            const rawdata: any = fs.readFileSync(
                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed
            )
            const contractsAddressDeployed: IAddressDetails[] = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                if (
                    contractsAddressDeployed.find(
                        (c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork
                    )
                )
                    return contractsAddressDeployed.filter(
                        (c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork
                    )[0]
                else return null
            } else return null
        } else return null
    }

    public retrieveOZAdminProxyContract(chainId: number) {
        let returnContractAddress = ''
        const addressBookConfig = getAddressBookConfig(this._userConfig)
        let ozFileName = ''
        switch (chainId) {
            case 1:
                ozFileName = 'mainnet'
                break
            case 11155111:
                ozFileName = 'sepolia'
                break
            case 17000:
                ozFileName = 'holesky'
                break
            case 137:
                ozFileName = 'polygon'
                break
            case 80002:
                ozFileName = 'polygonAmoy'
                break
            case 56:
                ozFileName = 'bsc'
                break
            case 97:
                ozFileName = 'bscTestnet'
                break
            case 10:
                ozFileName = 'optimism'
                break
            case 11155420:
                ozFileName = 'optimismSepolia'
                break
            case 42161:
                ozFileName = 'arbitrum'
                break
            case 421614:
                ozFileName = 'arbitrumSepolia'
                break
            case 8453:
                ozFileName = 'base'
                break
            case 84532:
                ozFileName = 'baseSepolia'
                break
            case 43114:
                ozFileName = 'avalanche'
                break
            case 43113:
                ozFileName = 'avalancheFuji'
                break
            default:
                ozFileName = `unknown-${chainId}`
        }
        if (fs.existsSync(`${addressBookConfig.openzeppelinPath}/${ozFileName}.json`)) {
            const ozFileRawdata: any = fs.readFileSync(`${addressBookConfig.openzeppelinPath}/${ozFileName}.json`)
            returnContractAddress = JSON.parse(ozFileRawdata).admin.address
        }
        return returnContractAddress
    }

    public retrieveContractHistory(deployedNetwork: string) {
        const addressBookConfig = getAddressBookConfig(this._userConfig)
        const returnContractAddress: IAddressDetails[] = []
        if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory)) {
            const rawdata: any = fs.readFileSync(
                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory
            )
            const contractsAddressDeployedHistory: IAddressDetails[] = JSON.parse(rawdata)
            if (contractsAddressDeployedHistory !== undefined && contractsAddressDeployedHistory.length > 0) {
                contractsAddressDeployedHistory
                    .filter((c: IAddressDetails) => c.network === deployedNetwork)
                    .forEach((c: IAddressDetails) => {
                        returnContractAddress.push(c)
                    })
            }
        }
        return returnContractAddress
    }

    public cleanContractDeployed(
        field: TAddressBookFields,
        value: any,
        applyToPrimary: boolean = true,
        applyToHistory: boolean = true
    ) {
        const addressBookConfig = getAddressBookConfig(this._userConfig)
        if (applyToPrimary)
            if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)) {
                const rawdata: any = fs.readFileSync(
                    addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed
                )
                const contractsAddressDeployed: IAddressDetails[] = JSON.parse(rawdata)
                if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                    if (contractsAddressDeployed.find((c: IAddressDetails) => c[field] === value)) {
                        const contractsAddressDeployedFiltered = contractsAddressDeployed.filter(
                            (c: IAddressDetails) => c[field] !== value
                        )
                        fs.unlinkSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)
                        const contractsAddressDeployedFilteredString =
                            contractsAddressDeployedFiltered.length > 0
                                ? JSON.stringify(contractsAddressDeployedFiltered, null, 2)
                                : ''
                        try {
                            fs.writeFileSync(
                                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed,
                                contractsAddressDeployedFilteredString
                            )
                        } catch (err) {
                            console.log('Error writing address to file: ', err)
                        }
                    }
                }
            }
        if (applyToHistory)
            if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory)) {
                const rawdata: any = fs.readFileSync(
                    addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory
                )
                const contractsAddressHistoryDeployed: IAddressDetails[] = JSON.parse(rawdata)
                if (contractsAddressHistoryDeployed !== undefined && contractsAddressHistoryDeployed.length > 0) {
                    if (contractsAddressHistoryDeployed.find((c: IAddressDetails) => c[field] === value)) {
                        const contractsAddressDeployedHistoryFiltered = contractsAddressHistoryDeployed.filter(
                            (c: IAddressDetails) => c[field] !== value
                        )
                        fs.unlinkSync(
                            addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory
                        )
                        const contractsAddressDeployedHistoryFilteredString =
                            contractsAddressDeployedHistoryFiltered.length > 0
                                ? JSON.stringify(contractsAddressDeployedHistoryFiltered, null, 2)
                                : ''
                        try {
                            fs.writeFileSync(
                                addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory,
                                contractsAddressDeployedHistoryFilteredString
                            )
                        } catch (err) {
                            console.log('Error writing address to file: ', err)
                        }
                    }
                }
            }
    }
}