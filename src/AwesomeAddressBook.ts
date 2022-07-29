import fs from 'fs'

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

export class AwesomeAddressBook {
    public formatSaveContract(
        contractName: string,
        contractAddress: string,
        deployedNetwork: string,
        deployedBy: string,
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
        blockHash?: string,
        blockNumber?: number,
        tag?: string,
        extra?: any
    ) {
        const contractsAddressDeployedFile = 'contractsAddressDeployed.json'
        const contractsAddressDeployedHistoryFile = 'contractsAddressDeployedHistory.json'
        const contractToAdd: IAddressDetails = this.formatSaveContract(
            contractName,
            contractAddress,
            deployedNetwork,
            deployedBy,
            blockHash,
            blockNumber,
            tag,
            extra
        )
        let contractsAddressDeployed = []
        let contractsAddressDeployedHistory = []

        // Add or edit contract address if deploy on same network
        if (fs.existsSync(contractsAddressDeployedFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedFile)
            contractsAddressDeployed = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                const recordModify = false
                contractsAddressDeployed = contractsAddressDeployed.map((c: IAddressDetails) => {
                    if (c.name === contractName && c.network === deployedNetwork) {
                        c.address = contractAddress
                        c.deployer = deployedBy
                        c.deploymentDate = new Date().toString()
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
            fs.unlinkSync(contractsAddressDeployedFile)
        } else {
            contractsAddressDeployed.push(contractToAdd)
        }
        try {
            fs.writeFileSync(contractsAddressDeployedFile, JSON.stringify(contractsAddressDeployed, null, 2))
        } catch (err) {
            console.log('Error writing address to file: ', err)
        }

        // Log all contracts deployed
        if (fs.existsSync(contractsAddressDeployedHistoryFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedHistoryFile)
            contractsAddressDeployedHistory = JSON.parse(rawdata)
            contractsAddressDeployedHistory.push(contractToAdd)
            fs.unlinkSync(contractsAddressDeployedHistoryFile)
        } else {
            contractsAddressDeployedHistory.push(contractToAdd)
        }
        try {
            fs.writeFileSync(
                contractsAddressDeployedHistoryFile,
                JSON.stringify(contractsAddressDeployedHistory, null, 2)
            )
        } catch (err) {
            console.log('Error writing address to file: ', err)
        }
    }

    public retrieveContract(contractName: string, deployedNetwork: string) {
        const contractsAddressDeployedFile = 'contractsAddressDeployed.json'
        let returnContractAddress = ''
        if (fs.existsSync(contractsAddressDeployedFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedFile)
            const contractsAddressDeployed: IAddressDetails[] = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                returnContractAddress = contractsAddressDeployed.filter(
                    (c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork
                )[0].address
            }
        }
        return returnContractAddress
    }

    public retrieveContractObject(contractName: string, deployedNetwork: string) {
        const contractsAddressDeployedFile = 'contractsAddressDeployed.json'
        if (fs.existsSync(contractsAddressDeployedFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedFile)
            const contractsAddressDeployed: IAddressDetails[] = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                return contractsAddressDeployed.filter(
                    (c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork
                )[0]
            }
        }
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
        const contractsAddressDeployedFile = 'contractsAddressDeployedHistory.json'
        const returnContractAddress: IAddressDetails[] = []
        if (fs.existsSync(contractsAddressDeployedFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedFile)
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
}
