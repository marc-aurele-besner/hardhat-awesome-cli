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
    deploymentScriptJs?: string
    deploymentScriptTs?: string
    testScriptJs?: string
    testScriptTs?: string
    upgradeable?: boolean
}

export interface IExcludedFiles {
    directory: string
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
