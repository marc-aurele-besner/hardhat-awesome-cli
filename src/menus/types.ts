/**
 * Concrete answer shapes for every `inquirer.prompt` call in the menu
 * modules. They keep the `.then(...)` callbacks honest under `strict: true`
 * (the unparameterised `inquirer.prompt` defaults to `Record<string, any>`,
 * which makes property-access on the answer silently `any`).
 *
 * Adding new prompts means adding the matching interface here so the
 * `Answers extends Record<string, any>` constraint matches `inquirer`'s.
 */
export interface NetworkChoiceAnswer {
    network: string
}
export interface SettingChoiceAnswer {
    settings: string
}
export interface ChainListAnswer {
    chainList: string[]
}
export interface CustomChainAnswer {
    name: string
    chainId: number
    gas: string
    defaultRpcUrl?: string
}
export interface RenameLicenseAnswer {
    renameLicenseIdentifier: boolean
}
export interface ExcludedFilesAnswer {
    allFiles: string[]
}
export interface WorkflowChoiceAnswer {
    workflowType: string
}
export interface MoreSettingsAnswer {
    moreSettings: string
}
export interface PluginChoiceAnswer {
    plugins: string
}
export interface MockContractChoiceAnswer {
    mockContract: string
}
export interface FileSelectionAnswer {
    file: string
}
export interface MockContractDetailsAnswer {
    mockDeploymentScript: string
    mockTestScript: string
    mockTestContractFoundry: string
}
export interface MockContractRenameAnswer {
    customName: string
    constructorName: string
    constructorSymbol: string
}
export interface MainMenuAnswer {
    action: string
}
export interface EnvBuilderAnswer {
    rpcUrl: string
    privateKeyOrMnemonic: string
}
export interface CustomCommandChoiceAnswer {
    customCommand: string
}
export interface CustomCommandFormAnswer {
    name: string
    description: string
    kind: 'shell' | 'hardhat'
    command: string
}
export interface VerifyContractSourceAnswer {
    source: string
}
export interface VerifyContractDeployedAnswer {
    contractName: string
}
export interface VerifyContractAddressAnswer {
    address: string
}
export interface VerifyContractArgsAnswer {
    provideArgs: string
    constructorArgs: string
}
