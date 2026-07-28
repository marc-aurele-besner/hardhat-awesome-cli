export interface IChain {
    name: string
    chainName: string
    chainId: number
    gas: string
    currency?: string
    defaultRpcUrl?: string
    defaultBlockExplorer?: string
}

export interface IHardhatPluginAvailableList {
    title: string
    name: string
    addInHardhatConfig: boolean
    /**
     * Hardhat 2 era package that does not load under Hardhat 3. These are not
     * offered for installation, only for removal (see `LegacyHardhatPluginsList`).
     */
    hardhat2Only?: boolean
}

export interface IFileList {
    name: string
    type: string
    filePath: string
}

export interface IMockContractsList {
    name: string
    desc: string
    dependencies: string[]
    // The single TS template path. When the consumer project uses a JS
    // `hardhat.config`, the JS output is generated from this template on
    // the fly (see `transformTsToJs` in utils.ts).
    deploymentScript: string
    testScript?: string
    testContractFoundry?: string
    upgradeable?: boolean
}

export interface IExcludedFiles {
    directory: string
    name: string
    filePath: string
}

export interface IFileSetting {
    activatedChain?: IChain[]
    excludedFiles?: IExcludedFiles[]
}

export interface IInquirerListField {
    name: string
    disabled?: string
}

export interface IContractAddressDeployed {
    name: string
    address: string
    network: string
    deployer: string
    deploymentDate: Date
}

export interface IDefaultGithubWorkflowsList {
    title: string
    file: string
    group: string
    requirement?: string[]
}

export type TAddressBookFields =
    | 'name'
    | 'address'
    | 'network'
    | 'deployer'
    | 'deploymentDate'
    | 'chainId'
    | 'blockHash'
    | 'blockNumber'
    | 'tag'
    | 'extra'

export type FunctionSelector = {
    name: string
    selector: string
}
