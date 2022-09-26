import fs from 'fs'

import { fileContractsAddressDeployed, fileContractsAddressDeployedHistory } from './config'
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
        extra?: any
    ) {
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

        // Add or edit contract address if deploy on same network
        if (fs.existsSync(fileContractsAddressDeployed)) {
            const rawdata: any = fs.readFileSync(fileContractsAddressDeployed)
            contractsAddressDeployed = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                const recordModify = false
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
                        // recordModify = true
                    }
                    return c
                })
                if (!recordModify) {
                    contractsAddressDeployed.push(contractToAdd)
                }
            }
            fs.unlinkSync(fileContractsAddressDeployed)
        } else {
            contractsAddressDeployed.push(contractToAdd)
        }
        try {
            fs.writeFileSync(fileContractsAddressDeployed, JSON.stringify(contractsAddressDeployed, null, 2))
        } catch (err) {
            console.log('Error writing address to file: ', err)
        }

        // Log all contracts deployed
        if (fs.existsSync(fileContractsAddressDeployedHistory)) {
            const rawdata: any = fs.readFileSync(fileContractsAddressDeployedHistory)
            contractsAddressDeployedHistory = JSON.parse(rawdata)
            contractsAddressDeployedHistory.push(contractToAdd)
            fs.unlinkSync(fileContractsAddressDeployedHistory)
        } else {
            contractsAddressDeployedHistory.push(contractToAdd)
        }
        try {
            fs.writeFileSync(
                fileContractsAddressDeployedHistory,
                JSON.stringify(contractsAddressDeployedHistory, null, 2)
            )
        } catch (err) {
            console.log('Error writing address to file: ', err)
        }
    }

    public retrieveContract(contractName: string, deployedNetwork: string) {
        let returnContractAddress = ''
        if (fs.existsSync(fileContractsAddressDeployed)) {
            const rawdata: any = fs.readFileSync(fileContractsAddressDeployed)
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
        if (fs.existsSync(fileContractsAddressDeployed)) {
            const rawdata: any = fs.readFileSync(fileContractsAddressDeployed)
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
        if (fs.existsSync(`.openzeppelin/${ozFileName}.json`)) {
            const ozFileRawdata: any = fs.readFileSync(`.openzeppelin/${ozFileName}.json`)
            returnContractAddress = JSON.parse(ozFileRawdata).admin.address
        }
        return returnContractAddress
    }

    public retrieveContractHistory(deployedNetwork: string) {
        const returnContractAddress: IAddressDetails[] = []
        if (fs.existsSync(fileContractsAddressDeployedHistory)) {
            const rawdata: any = fs.readFileSync(fileContractsAddressDeployedHistory)
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
        if (applyToPrimary)
            if (fs.existsSync(fileContractsAddressDeployed)) {
                const rawdata: any = fs.readFileSync(fileContractsAddressDeployed)
                const contractsAddressDeployed: IAddressDetails[] = JSON.parse(rawdata)
                if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                    if (contractsAddressDeployed.find((c: IAddressDetails) => c[field] === value)) {
                        const contractsAddressDeployedFiltered = contractsAddressDeployed.filter(
                            (c: IAddressDetails) => c[field] !== value
                        )
                        fs.unlinkSync(fileContractsAddressDeployed)
                        const contractsAddressDeployedFilteredString =
                            contractsAddressDeployedFiltered.length > 0
                                ? JSON.stringify(contractsAddressDeployedFiltered, null, 2)
                                : ''
                        try {
                            fs.writeFileSync(fileContractsAddressDeployed, contractsAddressDeployedFilteredString)
                        } catch (err) {
                            console.log('Error writing address to file: ', err)
                        }
                    }
                }
            }
        if (applyToHistory)
            if (fs.existsSync(fileContractsAddressDeployedHistory)) {
                const rawdata: any = fs.readFileSync(fileContractsAddressDeployedHistory)
                const contractsAddressHistoryDeployed: IAddressDetails[] = JSON.parse(rawdata)
                if (contractsAddressHistoryDeployed !== undefined && contractsAddressHistoryDeployed.length > 0) {
                    if (contractsAddressHistoryDeployed.find((c: IAddressDetails) => c[field] === value)) {
                        const contractsAddressDeployedHistoryFiltered = contractsAddressHistoryDeployed.filter(
                            (c: IAddressDetails) => c[field] !== value
                        )
                        fs.unlinkSync(fileContractsAddressDeployedHistory)
                        const contractsAddressDeployedHistoryFilteredString =
                            contractsAddressDeployedHistoryFiltered.length > 0
                                ? JSON.stringify(contractsAddressDeployedHistoryFiltered, null, 2)
                                : ''
                        try {
                            fs.writeFileSync(
                                fileContractsAddressDeployedHistory,
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
