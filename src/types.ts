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

/**
 * One entry in the `excludedFiles` array of `hardhat-awesome-cli.json`.
 *
 * `type` is optional for backward compatibility — older settings files only
 * stored file entries, so we treat the missing field as `'file'`. Directory
 * entries use the same `filePath` shape as the `IFileList` produced by
 * `buildDirectoryFilesList`: a relative path that ends with `/` (e.g.
 * `helpers/`). Filtering then removes every nested file whose path starts
 * with that directory path.
 */
export interface IExcludedFiles {
    directory: string
    name: string
    filePath: string
    type?: 'file' | 'directory'
}

export interface IFileSetting {
    activatedChain?: IChain[]
    excludedFiles?: IExcludedFiles[]
}

/**
 * Shape of the per-project `hardhat-awesome-cli.json` file as written by
 * `getAddressBookConfig`. Each field falls back to a default from
 * `addressBookDefaultConfig` when omitted. Keeping this in `types.ts` (rather
 * than re-declaring it inline in `config.ts`) lets the address-book IO and
 * the HRE adapter both consume it without losing strictness.
 */
export interface IAddressBookConfig {
    savePath: string
    openzeppelinPath: string
    contractsFlattenPath: string
    contractsFlattenPrefix: string
    fileHardhatAwesomeCLI: string
    fileEnvHardhatAwesomeCLI: string
    fileContractsAddressDeployed: string
    fileContractsAddressDeployedHistory: string
}

/**
 * Minimal subset of the Hardhat Runtime Environment that the inquirer UI
 * actually touches. Hardhat 3 dropped HRE extension, so callers that used to
 * hand the full HRE to plugin tasks now build a tiny adapter that conforms
 * to this shape. See `src/plugin/cli-action.ts` for the production adapter
 * and `src/index.ts` for the standalone CLI shim.
 *
 * Marked optional so places that only need a subset (e.g. address-book IO
 * without an ethers provider) can pass `{ userConfig }` and ignore the rest.
 */
export interface IHreContext {
    userConfig?: { addressBook?: Partial<IAddressBookConfig> }
    network?: { name: string }
    config?: { paths?: { root?: string } }
    paths?: Record<string, string>
    /**
     * Optional ethers v6 provider bag. The address-book flows don't touch
     * it; only the env-builder and account-balance menus do. Typed loosely
     * to stay compatible with both `@nomicfoundation/hardhat-ethers` and
     * `@nomicfoundation/hardhat-toolbox-viem` style projects.
     */
    ethers?: any
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
