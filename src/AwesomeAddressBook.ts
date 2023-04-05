import fs from 'fs'

import { getAddressBookConfig } from './config'
import { TAddressBookFields } from './types'

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
    extra?: any
}

export class AwesomeAddressBook {
    private readonly _env: any

    constructor(hre: any) {
        this._env = hre
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
        extra?: any
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
        extra?: any,
        forceAdd = false as boolean
    ) {
        if (
            !forceAdd ||
            this._env.network.name === 'hardhat' ||
            this._env.network.name === 'localhost' ||
            this._env.network.name === 'anvil'
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
        const addressBookConfig = getAddressBookConfig(this._env.userConfig)
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
        const addressBookConfig = getAddressBookConfig(this._env.userConfig)
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
        const addressBookConfig = getAddressBookConfig(this._env.userConfig)
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
        const addressBookConfig = getAddressBookConfig(this._env.userConfig)
        let ozFileName = ''
        switch (chainId) {
            case 1:
                ozFileName = 'mainnet'
            case 3:
                ozFileName = 'ropsten'
            case 4:
                ozFileName = 'rinkeby'
            case 5:
                ozFileName = 'goerli'
            case 42:
                ozFileName = 'kovan'
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
        const addressBookConfig = getAddressBookConfig(this._env.userConfig)
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
        const addressBookConfig = getAddressBookConfig(this._env.userConfig)
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
