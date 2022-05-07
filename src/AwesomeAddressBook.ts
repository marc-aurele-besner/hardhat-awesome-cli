import fs from 'fs'

interface IAddressDetails {
    name: string
    address: string
    network: string
    deployer: string
    deploymentDate: Date
    blockHah?: string
    blockNumber?: number
}

export class AwesomeAddressBook {
    public saveContract(contractName: string, contractAddress: string, deployedNetwork: string, deployedBy: string, blockHah?: string, blockNumber?: number) {
        const contractsAddressDeployedFile = 'contractsAddressDeployed.json'
        const contractsAddressDeployedHistoryFile = 'contractsAddressDeployedHistory.json'
        const contractToAdd: IAddressDetails = {
            name: contractName,
            address: contractAddress,
            network: deployedNetwork,
            deployer: deployedBy,
            deploymentDate: new Date(),
            blockHah: blockHah || '',
            blockNumber: blockNumber || 0
        }
        let contractsAddressDeployed = []
        let contractsAddressDeployedHistory = []

        // Add or edit contract address if deploy on same network
        if (fs.existsSync(contractsAddressDeployedFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedFile)
            contractsAddressDeployed = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                contractsAddressDeployed = contractsAddressDeployed.filter((c: IAddressDetails) => c.name !== contractName && c.network !== deployedNetwork)
                contractsAddressDeployed.push(contractToAdd)
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
            fs.writeFileSync(contractsAddressDeployedHistoryFile, JSON.stringify(contractsAddressDeployedHistory, null, 2))
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
                returnContractAddress = contractsAddressDeployed.filter((c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork)[0]
                    .address
            }
        }
        return returnContractAddress
    }

    public retrieveContractObject(contractName: string, deployedNetwork: string) {
        const contractsAddressDeployedFile = 'contractsAddressDeployed.json'
        let returnContractAddress = {}
        if (fs.existsSync(contractsAddressDeployedFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedFile)
            const contractsAddressDeployed: IAddressDetails[] = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                returnContractAddress = contractsAddressDeployed.filter((c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork)[0]
            }
        }
        return returnContractAddress
    }

    public retrieveOZAdminProxyContract(chainId: number) {
        let returnContractAddress = ''
        let ozFileName = `unknown-${chainId}`
        if (chainId === 1) ozFileName = 'mainnet'
        else if (chainId === 3) ozFileName = 'ropsten'
        else if (chainId === 4) ozFileName = 'rinkeby'
        else if (chainId === 5) ozFileName = 'goerli'
        else if (chainId === 42) ozFileName = 'kovan'
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
