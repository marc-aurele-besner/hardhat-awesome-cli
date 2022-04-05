export interface IChain {
    name: string
    chainName: string
    chainId: number
    gas: string
    defaultRpcUrl?: string
}

export interface IHardhatPluginAvailableList {
    title: string
    name: string
}

export interface ITestAndScript {
    name: string
    type: string
    filePath: string
}

export interface IMockContractsList {
    name: string
    desc: string
    dependencies: string[]
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
