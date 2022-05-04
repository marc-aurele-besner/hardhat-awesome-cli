import fs from 'fs'

interface IAddressDetails {
    name: string
    address: string
    network: string
    deployer: string
    deploymentDate: Date
}

export class AwesomeAddressBook {
    public saveContract(contractName: string, contractAddress: string, deployedNetwork: string, deployedBy: string) {
        const contractsAddressDeployedFile = 'contractsAddressDeployed.json'
        const contractsAddressDeployedHistoryFile = 'contractsAddressDeployedHistory.json'
        let contractsAddressDeployed = []
        let contractsAddressDeployedHistory = []
        let addressModify = false

        // Add or edit contract address if deploy on same network
        if (fs.existsSync(contractsAddressDeployedFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedFile)
            contractsAddressDeployed = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                contractsAddressDeployed
                    .filter((c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork)
                    .map((c: IAddressDetails) => {
                        addressModify = true
                        return {
                            name: c.name,
                            address: contractAddress,
                            network: deployedNetwork,
                            deployer: deployedBy,
                            deploymentDate: new Date().toISOString()
                        }
                    })
            }
            if (!addressModify) {
                contractsAddressDeployed.push({
                    name: contractName,
                    address: contractAddress,
                    network: deployedNetwork,
                    deployer: deployedBy,
                    deploymentDate: new Date().toISOString()
                })
            }
            fs.unlinkSync(contractsAddressDeployedFile)
        } else {
            contractsAddressDeployed.push({
                name: contractName,
                address: contractAddress,
                network: deployedNetwork,
                deployer: deployedBy,
                deploymentDate: new Date().toISOString()
            })
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
            contractsAddressDeployedHistory.push({
                name: contractName,
                address: contractAddress,
                network: deployedNetwork,
                deployer: deployedBy,
                deploymentDate: new Date().toISOString()
            })
            fs.unlinkSync(contractsAddressDeployedHistoryFile)
        } else {
            contractsAddressDeployedHistory.push({
                name: contractName,
                address: contractAddress,
                network: deployedNetwork,
                deployer: deployedBy,
                deploymentDate: new Date().toISOString()
            })
        }
        try {
            fs.writeFileSync(contractsAddressDeployedHistoryFile, JSON.stringify(contractsAddressDeployedHistory, null, 2))
        } catch (err) {
            console.log('Error writing address to file: ', err)
        }
    }

    public retrieveContract(contractName: string, deployedNetwork: string) {
        const contractsAddressDeployedFile = 'contractsAddressDeployed.json'
        let contractsAddressDeployed = []
        let returnContractAddress = ''
        if (fs.existsSync(contractsAddressDeployedFile)) {
            const rawdata: any = fs.readFileSync(contractsAddressDeployedFile)
            contractsAddressDeployed = JSON.parse(rawdata)
            if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
                returnContractAddress = contractsAddressDeployed.filter((c: IAddressDetails) => c.name === contractName && c.network === deployedNetwork)[0]
                    .address
            }
        }
        return returnContractAddress
    }

    public retrieveOZAdminProxyContract(chainId: number) {
        let returnContractAddress = ''
        let ozFileName = `unknown-${chainId}`
        if (chainId === 1)
            ozFileName = 'mainnet'
        else if (chainId === 3)
            ozFileName = 'ropsten'
        else if (chainId === 4)
            ozFileName = 'rinkeby'
        else if (chainId === 5)
            ozFileName = 'goerli'
        else if (chainId === 42)
            ozFileName = 'kovan'
        if(fs.existsSync(`.openzeppelin/${ozFileName}.json`)) {
            const ozFileRawdata: any = fs.readFileSync(`.openzeppelin/${ozFileName}.json`)
            returnContractAddress = JSON.parse(ozFileRawdata).admin.address
        }
        return returnContractAddress
    }
}
