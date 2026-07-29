import fs from 'fs'
import inquirer from 'inquirer'

import writeToEnv, { getEnvValue } from './buildEnv.ts'
import { addExcludedFiles, buildExcludedFile, removeExcludedFiles } from './buildExcludedFile.ts'
import {
    buildActivatedChainList,
    buildAllForgeTestsList,
    buildContractsList,
    buildDirectoryFilesList,
    buildScriptsList,
    buildTestsList
} from './buildFilesList.ts'
import buildFoundrySetting, { installFoundryTestUtility } from './buildFoundrySetting.ts'
import buildMockContract, { buildMockDeploymentScriptOrTest } from './buildMockContracts.ts'
import {
    addActivatedChain,
    addCustomChain,
    buildActivatedChainNetworkConfig,
    buildNetworkSelectorChoices,
    removeActivatedChain
} from './buildNetworks.ts'
import buildWorkflows, { buildWorkflowsFromCommand } from './buildWorkflows.ts'
import {
    DefaultChainList,
    DefaultGithubWorkflowsGroup,
    DefaultGithubWorkflowsList,
    DefaultHardhatPluginsList,
    LegacyHardhatPluginsList,
    getAddressBookConfig
} from './config.ts'
import MockContractsList from './mockContracts/index.ts'
import detectPackage from './packageInstaller.ts'
import { validateRename } from './renameMockContract.ts'
import {
    IChain,
    IDefaultGithubWorkflowsList,
    IExcludedFiles,
    IFileList,
    IHardhatPluginAvailableList,
    IHreContext,
    IInquirerListField,
    IMockContractsList
} from './types.ts'
import {
    displayFinalCliCommand,
    inquirerFileContractsAddressDeployed,
    inquirerFileContractsAddressDeployedHistory,
    inquirerFlattenContracts,
    inquirerRunFoundryTest,
    inquirerRunMockContractCreator,
    inquirerRunScripts,
    inquirerRunTests,
    listAllFunctionSelectors,
    runCommand,
    waitForReadability
} from './utils.ts'

// Entry added on top of the mock contract selection to create every mock contract
// (and their deployment/test scripts) in a single pass.
const ALL_MOCK_CONTRACTS = 'All mock contracts'

/**
 * Concrete answer shapes for every `inquirer.prompt` call in this file. They
 * keep the `.then(...)` callbacks honest under `strict: true` (the
 * unparameterised `inquirer.prompt` defaults to `Record<string, any>`, which
 * makes property-access on the answer silently `any`).
 *
 * Adding new prompts means adding the matching interface here so the
 * `Answers extends Record<string, any>` constraint matches `inquirer`'s.
 */
interface NetworkChoiceAnswer {
    network: string
}
interface SettingChoiceAnswer {
    settings: string
}
interface ChainListAnswer {
    chainList: string[]
}
interface CustomChainAnswer {
    name: string
    chainId: number
    gas: string
    defaultRpcUrl?: string
}
interface RenameLicenseAnswer {
    renameLicenseIdentifier: boolean
}
interface ExcludedFilesAnswer {
    allFiles: string[]
}
interface WorkflowChoiceAnswer {
    workflowType: string
}
interface MoreSettingsAnswer {
    moreSettings: string
}
interface PluginChoiceAnswer {
    plugins: string
}
interface MockContractChoiceAnswer {
    mockContract: string
}
interface FileSelectionAnswer {
    file: string
}
interface MockContractDetailsAnswer {
    mockDeploymentScript: string
    mockTestScript: string
    mockTestContractFoundry: string
}
interface MockContractRenameAnswer {
    customName: string
    constructorName: string
    constructorSymbol: string
}
interface MainMenuAnswer {
    action: string
}
interface EnvBuilderAnswer {
    rpcUrl: string
    privateKeyOrMnemonic: string
}

/**
 * Narrow type for the optional callbacks `serveNetworkSelector` accepts.
 *
 * Both run after a chain is picked: `GetAccountBalance` prints the deployer
 * balance for the chosen network; `ServeEnvBuilder` opens the RPC/key editor.
 * They are loosely typed because the menu composes them at runtime and an
 * absence of one or the other is a valid configuration.
 */
type NetworkFollowup = ((env: IHreContext, networkName: string) => Promise<void>) | null | undefined

const serveNetworkSelector = async (
    env: IHreContext,
    command: string,
    firstCommand: string,
    GetAccountBalance: ((env: IHreContext) => Promise<void>) | null | undefined,
    ServeEnvBuilder: NetworkFollowup,
    noLocalNetwork: boolean
) => {
    const activatedChainListFromFile: IChain[] = await buildActivatedChainList()
    const { chains: ActivatedChainList, names: activatedChainList } = buildNetworkSelectorChoices(
        activatedChainListFromFile,
        noLocalNetwork
    )
    let commandFlags = ''
    const networkSelected: NetworkChoiceAnswer = await inquirer.prompt<NetworkChoiceAnswer>([
        {
            type: 'list',
            name: 'network',
            message: 'Select a network',
            choices: activatedChainList
        }
    ])
    ActivatedChainList.map((chain: IChain) => {
        if (chain.name === networkSelected.network) commandFlags = ' --network ' + chain.chainName
    })
    if (GetAccountBalance) await GetAccountBalance(env)
    else if (ServeEnvBuilder) await ServeEnvBuilder(env, networkSelected.network)
    // Brief pause so the env/account summary stays visible before the
    // next prompt renders. Honours AWESOME_CLI_NO_PAUSE / _PAUSE_MS.
    await waitForReadability()
    if (command) await runCommand(command, firstCommand, commandFlags, true)
}

const goBackChoice = '.. (go back)'

type TFileSelection = IFileList | 'back' | undefined

/**
 * Prompt for a file, opening a new selection every time a directory is selected.
 *
 * Directories are listed with a trailing `/` and are browsed recursively until a
 * file (or an entry like `All tests`) is picked. Nested selections offer a
 * `.. (go back)` choice to return to the parent directory.
 *
 * Resolves to the selected file, its `filePath` being relative to the root
 * directory of the list (eg. `subDirectory/myTest.test.ts`), or `undefined`
 * when there is nothing to select.
 */
const serveFileListSelector = async (
    message: string,
    buildList: (subPath: string) => Promise<IFileList[]>,
    subPath: string = ''
): Promise<TFileSelection> => {
    for (;;) {
        const filesObject = await buildList(subPath)
        const filesList: string[] = filesObject ? filesObject.map((file: IFileList) => file.name) : []
        if (filesList.length === 0) {
            if (!subPath) return undefined
            console.log('\x1b[33m%s\x1b[0m', 'No file found in ' + subPath + ', going back')
            return 'back'
        }
        if (subPath) filesList.push(goBackChoice)
        const fileSelected: FileSelectionAnswer = await inquirer.prompt<FileSelectionAnswer>([
            {
                type: 'list',
                name: 'file',
                message: subPath ? message + ' (' + subPath + ')' : message,
                choices: filesList
            }
        ])
        if (fileSelected.file === goBackChoice) return 'back'
        const selected = filesObject.find((file: IFileList) => file.name === fileSelected.file)
        if (!selected) return undefined
        if (selected.type !== 'directory') return selected
        const selectedInDirectory = await serveFileListSelector(message, buildList, selected.filePath.slice(0, -1))
        if (selectedInDirectory !== 'back') return selectedInDirectory
    }
}

const serveTestSelector = async (env: IHreContext, command: string, firstCommand: string) => {
    const testSelected = await serveFileListSelector('Select a test', buildTestsList)
    if (!testSelected || testSelected === 'back') return
    if (testSelected.type === 'file') command = command + ' test/' + testSelected.filePath
    if (firstCommand) command = 'npx hardhat test ' + command
    await serveNetworkSelector(env, command, firstCommand, undefined, undefined, false)
    // `runCommand` above used `thenExit=true`, so the Node process already exited
    // when the suite finishes — no need for a sleep.
}

const serveScriptSelector = async (env: IHreContext, ServeTestSelector: typeof serveTestSelector | null) => {
    const scriptSelected = await serveFileListSelector('Select a script', buildScriptsList)
    if (!scriptSelected || scriptSelected === 'back') return
    let command = 'npx hardhat run'
    if (scriptSelected.type === 'file') command = command + ' scripts/' + scriptSelected.filePath
    if (ServeTestSelector) await ServeTestSelector(env, '', command)
    else {
        await serveNetworkSelector(env, command, '', undefined, undefined, false)
    }
}

const serveFlattenContractsSelector = async (env: IHreContext, command: string) => {
    const addressBookConfig = getAddressBookConfig(env.userConfig)
    let renameLicenseIdentifier = false
    const contractSelected = await serveFileListSelector('Select a contract to flatten', async (subPath: string) => {
        const contractsFilesObject = await buildContractsList(subPath)
        if (subPath) return contractsFilesObject
        return [{ name: 'Flatten all contracts', type: 'all', filePath: '' }, ...contractsFilesObject]
    })
    if (!contractSelected || contractSelected === 'back') return
    let contractFlattenName: string = addressBookConfig.contractsFlattenPrefix + 'All.sol'
    if (contractSelected.type === 'file') {
        command = command + ' contracts/' + contractSelected.filePath
        contractFlattenName = addressBookConfig.contractsFlattenPrefix + contractSelected.filePath.replace(/\//g, '-')
    }
    const contractsSelected: RenameLicenseAnswer = await inquirer.prompt<RenameLicenseAnswer>([
        {
            type: 'confirm',
            name: 'renameLicenseIdentifier',
            message: 'Rename SPDX-License-Identifier'
        }
    ])
    renameLicenseIdentifier = contractsSelected.renameLicenseIdentifier
    if (!fs.existsSync(addressBookConfig.contractsFlattenPath)) fs.mkdirSync(addressBookConfig.contractsFlattenPath)
    if (command) {
        await runCommand(
            command,
            '',
            ' > ' + addressBookConfig.contractsFlattenPath + '/' + contractFlattenName,
            renameLicenseIdentifier ? false : true
        )
        if (renameLicenseIdentifier) {
            // `runCommand` now resolves once `npx hardhat flatten` has exited,
            // but the redirected file may still be flushing. Poll for content
            // with a bounded number of short attempts; bail out (and warn) if
            // the file stays empty, instead of looping indefinitely.
            const flattenFilePath = addressBookConfig.contractsFlattenPath + '/' + contractFlattenName
            const maxAttempts = 10
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (fs.existsSync(flattenFilePath) && fs.readFileSync(flattenFilePath, 'utf8').length > 0) break
                await waitForReadability(250)
            }
            if (fs.existsSync(flattenFilePath) && fs.readFileSync(flattenFilePath, 'utf8').length > 0) {
                let fileContent = fs.readFileSync(flattenFilePath, 'utf8')
                if (fileContent.includes('SPDX-License-Identifier')) {
                    fileContent = fileContent.replace('SPDX-License-Identifier', 'SPDX-License-DISABLED-Identifier')
                    fs.writeFileSync(flattenFilePath, fileContent)
                } else
                    console.log(
                        'SPDX-License-Identifier not found in ' + contractFlattenName + ' file, skipping rename'
                    )
                if (fileContent.includes('pragma solidity')) {
                    fileContent = fileContent.replace('pragma solidity', '// pragma solidity')
                    fs.writeFileSync(flattenFilePath, fileContent)
                } else console.log('pragma solidity not found in ' + contractFlattenName + ' file, skipping rename')
            } else
                console.log(
                    'Flatten output file ' + contractFlattenName + ' is still empty after waiting, skipping rename'
                )
        }
    }
}

const serveFunctionListSelector = async (env: IHreContext) => {
    const contractSelected = await serveFileListSelector('Select a contract to list all functions', buildContractsList)
    if (!contractSelected || contractSelected === 'back') return
    const functions = await listAllFunctionSelectors(env, contractSelected.name)
    console.log(
        'Contract: ',
        '\x1b[32m',
        contractSelected.name,
        '\x1b[0m',
        'has ',
        '\x1b[32m',
        functions.length,
        '\x1b[0m',
        'public and external functions, ordered by selector'
    )
    console.table(functions)
    // Give the user a moment to read the table before the menu redraws.
    await waitForReadability()
}

const serveFoundryTestSelector = async (env: IHreContext, command: string) => {
    const testSelected = await serveFileListSelector('Select a forge test', buildAllForgeTestsList)
    if (!testSelected || testSelected === 'back') return
    if (testSelected.type === 'file') command = command + ' --match-path contracts/test/' + testSelected.filePath
    // `thenExit=true`, so the Node process already exits once `forge test`
    // finishes — no sleep needed.
    await runCommand(command, '', '', true)
}

const serveEnvBuilder = async (env: IHreContext, chainSelected: string) => {
    const ActivatedChainList = await buildActivatedChainList()
    if (ActivatedChainList.find((chain: IChain) => chain.name === chainSelected)) {
        const selectedChain = ActivatedChainList.find((chain: IChain) => chain.name === chainSelected) as IChain
        const defaultRpcUrl = await getEnvValue('rpcUrl'.toUpperCase() + '_' + selectedChain.chainName.toUpperCase())
        const defaultPrivateKey = await getEnvValue(
            'privateKey'.toUpperCase() + '_' + selectedChain.chainName.toUpperCase()
        )
        const defaultMnemonic = await getEnvValue(
            'mnemonic'.toUpperCase() + '_' + selectedChain.chainName.toUpperCase()
        )
        const envToBuild: EnvBuilderAnswer = await inquirer.prompt<EnvBuilderAnswer>([
            {
                type: 'input',
                name: 'rpcUrl',
                message: selectedChain.name + ' RPC Url',
                default: defaultRpcUrl
            },
            {
                type: 'input',
                name: 'privateKeyOrMnemonic',
                message: selectedChain.name + ' private key or mnemonic',
                default: defaultPrivateKey || defaultMnemonic
            }
        ])
        await writeToEnv(env, selectedChain.chainName, envToBuild)
        await waitForReadability()
    }
}

const serveSettingSelector = async (env: IHreContext) => {
    const settingSelected: SettingChoiceAnswer = await inquirer.prompt<SettingChoiceAnswer>([
        {
            type: 'list',
            name: 'settings',
            message: 'Select a setting',
            choices: [
                'Add/Remove chains from the chain selection',
                'Set RPC Url, private key or mnemonic for all or one chain',
                'Add a custom chain to the current chain selection',
                new inquirer.Separator(),
                'See all config for activated chain'
            ]
        }
    ])
    const ActivatedChainList = await buildActivatedChainList()
    const activatedChainList: string[] = []
    ActivatedChainList.map((chain: IChain) => {
        activatedChainList.push(chain.name)
    })
    const FullChainList = DefaultChainList
    const fullChainList: string[] = []
    FullChainList.map((chain: IChain) => {
        fullChainList.push(chain.name)
    })
    if (settingSelected.settings === 'Add/Remove chains from the chain selection') {
        const chainListSelected: ChainListAnswer = await inquirer.prompt<ChainListAnswer>([
            {
                type: 'checkbox',
                name: 'chainList',
                message: 'Select a setting',
                choices: fullChainList,
                default: activatedChainList
            }
        ])
        fullChainList.map(async (chain: string) => {
            if (chainListSelected.chainList.includes(chain)) {
                await addActivatedChain(chain)
                displayFinalCliCommand('addActivatedChain', chain)
            } else {
                await removeActivatedChain(chain)
                displayFinalCliCommand('removeActivatedChain', chain)
            }
        })
        console.log('\x1b[32m%s\x1b[0m', 'Settings updated!')
        await waitForReadability()
    }
    if (settingSelected.settings === 'Set RPC Url, private key or mnemonic for all or one chain')
        await serveNetworkSelector(env, '', '', undefined, serveEnvBuilder, true)
    if (settingSelected.settings === 'Add a custom chain to the current chain selection') {
        const chainSelected: CustomChainAnswer = await inquirer.prompt<CustomChainAnswer>([
            {
                type: 'input',
                name: 'name',
                message: 'Chain Name'
            },
            {
                type: 'input',
                name: 'chainId',
                message: 'Chain Id'
            },
            {
                type: 'input',
                name: 'gas',
                message: 'Chain gas setting',
                default: 'auto'
            },
            {
                type: 'input',
                name: 'defaultRpcUrl',
                message: 'Chain default RPC Url'
            }
        ])
        const getNetworkConfig = buildActivatedChainNetworkConfig()
        let buildNetworkConfig: { networks: Record<string, unknown>[] } = { networks: [{}] }
        if (getNetworkConfig) {
            buildNetworkConfig = JSON.parse(
                `{
                    "networks": [
                        {${getNetworkConfig}}
                    ]
                }`
            )
        }
        let chainName: string = ''
        const firstNetwork = buildNetworkConfig.networks[0]
        for (let i = 1; i <= 8; i++) {
            const key = `customChain${i}`
            if (firstNetwork[key] !== undefined && !chainName) {
                chainName = key
                break
            }
        }
        if (chainName) {
            const chainToAdd: IChain = {
                name: chainSelected.name,
                chainName,
                chainId: chainSelected.chainId,
                gas: chainSelected.gas,
                defaultRpcUrl: chainSelected.defaultRpcUrl
            }
            await addCustomChain(chainToAdd)
        }
    }
    if (settingSelected.settings === 'See all config for activated chain') {
        const getNetworkConfig = buildActivatedChainNetworkConfig()
        let buildNetworkConfig: { networks: Record<string, unknown>[] } = { networks: [{}] }
        if (getNetworkConfig) {
            buildNetworkConfig = JSON.parse(
                `{
                        "networks": [
                            {${getNetworkConfig}}
                        ]
                    }`
            )
        }
        // Always print this notice up front so users who expected to
        // see their private key know why only a `****abcd` placeholder
        // is rendered. Issue #176.
        if (process.env.AWESOME_CLI_SHOW_SECRETS !== '1') {
            console.log(
                '\x1b[33m%s\x1b[0m',
                'Secrets (private keys, mnemonics) are masked with `****abcd`. Set ' +
                    'AWESOME_CLI_SHOW_SECRETS=1 in your environment to see them in full.'
            )
        }
        console.table(buildNetworkConfig.networks[0])
    }
}

const serveExcludeFileSelector = async (option: string) => {
    let allFiles: IFileList[] = []
    let excludedFiles: IExcludedFiles[] = await buildExcludedFile()
    const allFilesSelection: string[] = []
    let allExcludedSelection: string[] = []
    // Use the non-recursive listing so directories appear as options too.
    // Selecting a directory excludes every nested file from the runnable
    // selector list (see `filterExcludedFiles` in buildFilesList.ts).
    if (option === 'test') allFiles = buildDirectoryFilesList('test', '', true)
    else if (option === 'scripts') allFiles = buildDirectoryFilesList('scripts')
    else if (option === 'contracts') allFiles = buildDirectoryFilesList('contracts')
    if (allFiles && allFiles.length > 0) {
        allFiles.map((file: IFileList) => {
            if (file.type === 'file' || file.type === 'directory') allFilesSelection.push(file.filePath)
        })
    }
    if (excludedFiles && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: IExcludedFiles) => test.directory === option)
        if (excludedFiles && excludedFiles.length > 0) {
            allExcludedSelection = excludedFiles.map((file: IExcludedFiles) => {
                return file.filePath
            })
        }
    }
    await inquirer
        .prompt<ExcludedFilesAnswer>([
            {
                type: 'checkbox',
                name: 'allFiles',
                message: 'Select the files or directories you want to exclude',
                choices: allFilesSelection,
                default: allExcludedSelection
            }
        ])
        .then(async (activateFilesSelected: ExcludedFilesAnswer) => {
            allFiles.map(async (file: IFileList) => {
                const entryType = file.type === 'directory' ? 'directory' : 'file'
                if (activateFilesSelected.allFiles.includes(file.filePath))
                    await addExcludedFiles(option, file.name, file.filePath, entryType)
                else await removeExcludedFiles(option, file.filePath)
            })
            console.log('\x1b[32m%s\x1b[0m', 'Settings updated!')
        })
}

const serveWorkflowBuilder = async () => {
    const workflowsList: string[] = []
    let workflowToAdd: IDefaultGithubWorkflowsList | undefined
    DefaultGithubWorkflowsGroup.map((workflowGroup: string) => {
        DefaultGithubWorkflowsList.filter(
            (workflow: IDefaultGithubWorkflowsList) => workflow.group === workflowGroup
        ).map((workflow: IDefaultGithubWorkflowsList) => {
            workflowsList.push(workflow.title)
        })
    })
    const workflowSelected: WorkflowChoiceAnswer = await inquirer.prompt<WorkflowChoiceAnswer>([
        {
            type: 'list',
            name: 'workflowType',
            message: 'Select a workflow to create',
            choices: workflowsList
        }
    ])
    DefaultGithubWorkflowsList.map((workflow: IDefaultGithubWorkflowsList) => {
        if (workflow.title === workflowSelected.workflowType) workflowToAdd = workflow
    })
    if (workflowToAdd !== undefined) {
        await buildWorkflows(workflowToAdd)
        displayFinalCliCommand('addGithubTestWorkflow', workflowToAdd.file)
        await waitForReadability()
    }
}

const serveMoreSettingSelector = async (env: IHreContext) => {
    const moreSettingsSelected: MoreSettingsAnswer = await inquirer.prompt<MoreSettingsAnswer>([
        {
            type: 'list',
            name: 'moreSettings',
            message: 'Select a mock contract',
            choices: [
                'Exclude test file from the tests selection list',
                'Exclude script file from the scripts selection list',
                'Exclude contract file from the contract selection list',
                new inquirer.Separator(),
                'List function from a contract by function selector',
                new inquirer.Separator(),
                'Add other Hardhat plugins',
                'Remove other Hardhat plugins',
                new inquirer.Separator(),
                'Create Github test workflows',
                'Create Foundry settings, remapping and test utilities',
                'Add foundry-test-utility (npm package for shared Forge mocks & utilities)',
                new inquirer.Separator()
            ]
        }
    ])
    if (moreSettingsSelected.moreSettings === 'Exclude test file from the tests selection list')
        await serveExcludeFileSelector('test')
    if (moreSettingsSelected.moreSettings === 'Exclude script file from the scripts selection list')
        await serveExcludeFileSelector('scripts')
    if (moreSettingsSelected.moreSettings === 'Exclude contract file from the contract selection list')
        await serveExcludeFileSelector('contracts')
    if (moreSettingsSelected.moreSettings === 'List function from a contract by function selector')
        await serveFunctionListSelector(env)
    if (moreSettingsSelected.moreSettings === 'Add other Hardhat plugins') await servePackageInstaller()
    if (moreSettingsSelected.moreSettings === 'Remove other Hardhat plugins') await servePackageUninstaller()
    if (moreSettingsSelected.moreSettings === 'Create Github test workflows') await serveWorkflowBuilder()
    if (moreSettingsSelected.moreSettings === 'Create Foundry settings, remapping and test utilities') {
        await buildFoundrySetting()
        displayFinalCliCommand('addFoundry')
    }
    if (
        moreSettingsSelected.moreSettings ===
        'Add foundry-test-utility (npm package for shared Forge mocks & utilities)'
    ) {
        await installFoundryTestUtility()
        displayFinalCliCommand('addFoundryTestUtility')
    }
}

const servePackageInstaller = async () => {
    const hardhatPluginAvailableList: string[] = DefaultHardhatPluginsList.map(
        (plugin: IHardhatPluginAvailableList) => {
            return plugin.title
        }
    )
    // Probe every plugin in parallel and wait for each detection to finish
    // before reading the result, so the menu sees a consistent snapshot of
    // what is installed. Previously this used `Array.map(async)` and a
    // `sleep(500)` to mask the race between the spawned probes and the
    // subsequent read, which was both slow and flaky.
    const hardhatPluginInstalled: string[] = (
        await Promise.all(
            DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
                if (await detectPackage(plugin.name, false, false, false)) return plugin.title
                return null
            })
        )
    ).filter((title): title is string => title !== null)
    const hardhatPluginToNotInclude = new Set(hardhatPluginInstalled)
    const hardhatPluginToInstall: string[] = hardhatPluginAvailableList.filter(
        (plugin: string) => !hardhatPluginToNotInclude.has(plugin)
    )
    if (hardhatPluginToInstall.length === 0) {
        console.log('\x1b[32m%s\x1b[0m', 'All available plugins are already installed.')
        await waitForReadability()
        return
    }
    const pluginssSelected: PluginChoiceAnswer = await inquirer.prompt<PluginChoiceAnswer>([
        {
            type: 'list',
            name: 'plugins',
            message: 'Select a plugin to install',
            choices: hardhatPluginToInstall
        }
    ])
    const packageToInstall: IHardhatPluginAvailableList | undefined = DefaultHardhatPluginsList.find(
        (plugin: IHardhatPluginAvailableList) => plugin.title === pluginssSelected.plugins
    )
    if (packageToInstall !== undefined) {
        await detectPackage(packageToInstall.name, true, false, packageToInstall.addInHardhatConfig)
        displayFinalCliCommand('addHardhatPlugin', packageToInstall.name)
        await waitForReadability()
    }
}

const servePackageUninstaller = async () => {
    // Projects migrating from Hardhat 2 still have `@nomiclabs/*` packages
    // installed, so the uninstall menu covers the legacy list too even though
    // those plugins are no longer offered for installation.
    const uninstallableList: IHardhatPluginAvailableList[] = [...DefaultHardhatPluginsList, ...LegacyHardhatPluginsList]
    const hardhatPluginInstalled: string[] = (
        await Promise.all(
            uninstallableList.map(async (plugin: IHardhatPluginAvailableList) => {
                if (await detectPackage(plugin.name, false, false, false))
                    return plugin.hardhat2Only ? `${plugin.title} (Hardhat 2 only)` : plugin.title
                return null
            })
        )
    ).filter((title): title is string => title !== null)
    if (hardhatPluginInstalled.length === 0) {
        console.log('\x1b[32m%s\x1b[0m', 'No installed plugins to remove.')
        await waitForReadability()
        return
    }
    const pluginssSelected: PluginChoiceAnswer = await inquirer.prompt<PluginChoiceAnswer>([
        {
            type: 'list',
            name: 'plugins',
            message: 'Select a plugin to uninstall',
            choices: hardhatPluginInstalled
        }
    ])
    const packageToUninstall: IHardhatPluginAvailableList | undefined = uninstallableList.find(
        (plugin: IHardhatPluginAvailableList) =>
            (plugin.hardhat2Only ? `${plugin.title} (Hardhat 2 only)` : plugin.title) === pluginssSelected.plugins
    )
    if (packageToUninstall !== undefined) {
        await detectPackage(packageToUninstall.name, false, true, packageToUninstall.addInHardhatConfig)
        displayFinalCliCommand('removeHardhatPlugin', packageToUninstall.name)
    }
    await waitForReadability()
}

interface MockContractsToAdd {
    mockContracts: string[]
    mockDeploymentScript: string
    mockTestScript: string
    mockTestContractFoundry: string
}

const serveMockContractCreatorSelector = async () => {
    if (!MockContractsList) return
    const mockContractsList: string[] = MockContractsList.map((file: IMockContractsList) => file.name)
    const mockContractSelected: MockContractChoiceAnswer = await inquirer.prompt<MockContractChoiceAnswer>([
        {
            type: 'list',
            name: 'mockContract',
            message: 'Select a mock contract',
            choices: [ALL_MOCK_CONTRACTS, ...mockContractsList]
        }
    ])
    if (!mockContractSelected.mockContract) return
    // Selecting `ALL_MOCK_CONTRACTS` applies the answers below to every mock contract at once
    const mockContractsSelectedDetail: IMockContractsList[] =
        mockContractSelected.mockContract === ALL_MOCK_CONTRACTS
            ? MockContractsList
            : MockContractsList.filter((file: IMockContractsList) => file.name === mockContractSelected.mockContract)
    const subject = mockContractsSelectedDetail.length > 1 ? 'these mock contracts' : 'this mock contract'
    const mockContractDetailSelector = []
    if (mockContractsSelectedDetail.some((file: IMockContractsList) => file.deploymentScript !== undefined))
        mockContractDetailSelector.push({
            type: 'list',
            name: 'mockDeploymentScript',
            message: 'Create a deployment script for ' + subject,
            choices: ['yes', 'no']
        })
    if (mockContractsSelectedDetail.some((file: IMockContractsList) => file.testScript !== undefined))
        mockContractDetailSelector.push({
            type: 'list',
            name: 'mockTestScript',
            message: 'Create a test script for ' + subject,
            choices: ['yes', 'no']
        })
    if (
        mockContractsSelectedDetail.some((file: IMockContractsList) => file.testContractFoundry !== undefined) &&
        fs.existsSync('contracts/test') &&
        fs.existsSync('foundry.toml')
    )
        mockContractDetailSelector.push({
            type: 'list',
            name: 'mockTestContractFoundry',
            message: 'Create a Foundry test contract for ' + subject,
            choices: ['yes', 'no']
        })
    const mockContractsToAdd: MockContractsToAdd | undefined = await (async () => {
        if (mockContractDetailSelector.length === 0) return undefined
        const detail: MockContractDetailsAnswer = await inquirer.prompt<MockContractDetailsAnswer>(
            mockContractDetailSelector
        )
        return {
            mockContracts: mockContractsSelectedDetail.map((file: IMockContractsList) => file.name),
            mockDeploymentScript: detail.mockDeploymentScript || 'no',
            mockTestScript: detail.mockTestScript || 'no',
            mockTestContractFoundry: detail.mockTestContractFoundry || 'no'
        }
    })()
    if (!mockContractsToAdd) return
    for (const mockContractEntry of mockContractsSelectedDetail) {
        // Issue #167: ask for a custom name and constructor arguments before
        // writing the artifacts. Hitting Enter keeps the registry defaults so
        // the menu stays backward-compatible with users who just want a stock
        // `MockERC20` mock.
        const renameAnswers = await collectRenameAnswers(mockContractEntry)
        if (!renameAnswers) continue
        await buildMockContract(mockContractEntry.name, renameAnswers)
        if (mockContractsToAdd.mockDeploymentScript === 'yes')
            await buildMockDeploymentScriptOrTest(mockContractEntry.name, 'deployment', renameAnswers)
        if (mockContractsToAdd.mockTestScript === 'yes')
            await buildMockDeploymentScriptOrTest(mockContractEntry.name, 'test', renameAnswers)
        if (mockContractsToAdd.mockTestContractFoundry === 'yes')
            await buildMockDeploymentScriptOrTest(mockContractEntry.name, 'testForge', renameAnswers)
        displayFinalCliCommand(
            'addCustomMockContract',
            formatAddCustomMockContractFlag(
                mockContractEntry.name,
                renameAnswers.customName,
                renameAnswers.constructorName,
                renameAnswers.constructorSymbol
            )
        )
    }
}

/**
 * Prompt the user for a custom contract name and constructor arguments, then
 * validate the result. Returns `undefined` when the user did not supply
 * anything (we bail out instead of forcing a name) so callers can skip the
 * entry on Ctrl-C.
 *
 * Hitting Enter at every prompt keeps the registry defaults
 * (`<registryName>`, `<registryName>`, `MOCK`).
 */
const collectRenameAnswers = async (
    contract: IMockContractsList
): Promise<{ customName: string; constructorName: string; constructorSymbol: string } | undefined> => {
    const renameQuestions = [
        {
            type: 'input',
            name: 'customName',
            message: `Contract name (default: ${contract.name})`,
            default: contract.name,
            validate: (input: string) => validateRename(input, contract)
        },
        {
            type: 'input',
            name: 'constructorName',
            message: `Constructor name (default: ${contract.name})`,
            default: contract.name,
            validate: (input: string) => (input.trim().length > 0 ? true : 'Constructor name cannot be empty')
        },
        {
            type: 'input',
            name: 'constructorSymbol',
            message: `Constructor symbol (default: MOCK)`,
            default: 'MOCK',
            validate: (input: string) => (input.trim().length > 0 ? true : 'Constructor symbol cannot be empty')
        }
    ]
    try {
        const answer = await inquirer.prompt<MockContractRenameAnswer>(renameQuestions)
        return answer
    } catch {
        // The user aborted the prompt (Ctrl-C) — leave the entry untouched
        // rather than writing a partial artifact set.
        return undefined
    }
}

/**
 * Render the value consumed by `--addCustomMockContract` so the printed
 * CLI command round-trips through `parseAddCustomMockContractFlag`.
 *
 * Shape: `<registryName>:<customName>:<constructorName>:<constructorSymbol>`.
 * `:` is used as the delimiter because contract names, constructor strings
 * and symbols cannot contain it without becoming hard to escape.
 */
export const formatAddCustomMockContractFlag = (
    registryName: string,
    customName: string,
    constructorName: string,
    constructorSymbol: string
): string => `${registryName}:${customName}:${constructorName}:${constructorSymbol}`

/**
 * Parse the `--addCustomMockContract` CLI flag value.
 *
 * Returns `undefined` when the value is malformed (wrong number of
 * segments) so `serveCli` can fall through to the next flag instead of
 * silently invoking the rename with garbage.
 */
export const parseAddCustomMockContractFlag = (
    value: string | undefined
): { registryName: string; customName: string; constructorName: string; constructorSymbol: string } | undefined => {
    if (typeof value !== 'string') return undefined
    const parts = value.split(':')
    if (parts.length !== 4) return undefined
    const [registryName, customName, constructorName, constructorSymbol] = parts
    if (!registryName || !customName || !constructorName || !constructorSymbol) return undefined
    return { registryName, customName, constructorName, constructorSymbol }
}

/**
 * Generate a customized mock contract from a CLI flag (issue #167).
 *
 * Reuses the same rename renderer as the interactive flow but skips the
 * inquirer prompts so the flag stays scriptable. The flag value is parsed
 * via `parseAddCustomMockContractFlag`; a malformed value aborts the
 * operation with a yellow warning rather than throwing.
 */
const runAddCustomMockContract = async (
    registryName: string,
    customName: string,
    constructorName: string,
    constructorSymbol: string
): Promise<void> => {
    const entry = MockContractsList?.find((contract) => contract.name === registryName)
    if (!entry) {
        console.log(
            '\x1b[33m%s\x1b[0m',
            `Unknown mock contract "${registryName}". Available: ${(MockContractsList ?? [])
                .map((contract) => contract.name)
                .join(', ')}`
        )
        return
    }
    const validation = validateRename(customName, entry)
    if (validation !== true) {
        console.log('\x1b[33m%s\x1b[0m', validation)
        return
    }
    const options = {
        customName,
        constructorArgs: [constructorName, constructorSymbol]
    }
    await buildMockContract(registryName, options)
    if (entry.deploymentScript) await buildMockDeploymentScriptOrTest(registryName, 'deployment', options)
    if (entry.testScript) await buildMockDeploymentScriptOrTest(registryName, 'test', options)
    if (entry.testContractFoundry && fs.existsSync('contracts/test') && fs.existsSync('foundry.toml'))
        await buildMockDeploymentScriptOrTest(registryName, 'testForge', options)
}

const serveDeploymentContractCreatorSelector = async () => {}

/**
 * Ethers-shaped object surface that the account-balance flow relies on.
 *
 * Kept loose (`any` on `ethers`) because Hardhat 3 ships both an ethers and a
 * viem flavour; only the account-balance flow needs the ethers bag.
 */
interface IAccountBalanceEnv {
    ethers?: any
    network?: { name: string }
}

const serveAccountBalance = async (env: IHreContext) => {
    const getAccountBalance = async (Env: IAccountBalanceEnv) => {
        if (!Env.ethers) {
            console.log('\x1b[33m%s\x1b[0m', 'Account balance requires the ethers provider.')
            return
        }
        const [deployer] = await Env.ethers.getSigners()
        const network = await Env.network
        // Get account balance
        const balance = await deployer.getBalance()
        console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', '\x1b[97m%s\x1b[0m', network?.name ?? 'unknown')
        console.log('\x1b[32m%s\x1b[0m', 'Account address: ', '\x1b[97m%s\x1b[0m', deployer.address)
        console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', '\x1b[97m%s\x1b[0m', balance.toString())
    }
    await serveNetworkSelector(env, '', '', getAccountBalance, undefined, false)
}

/**
 * Raw option strings accepted by the `cli` Hardhat task. All fields default
 * to the empty string at the task-definition site; boolean-shaped flags like
 * `--addFoundry` are compared against `'true'` / `'yes'`. Keeping the shape
 * deliberately narrow means we never need `any` to index into `args`.
 */
interface ICliArgs {
    excludeTestFile?: string
    excludeTestDirectory?: string
    excludeScriptFile?: string
    excludeScriptDirectory?: string
    excludeContractFile?: string
    excludeContractDirectory?: string
    addHardhatPlugin?: string
    removeHardhatPlugin?: string
    addGithubTestWorkflow?: string
    addFoundry?: string
    addFoundryTestUtility?: string
    addActivatedChain?: string
    removeActivatedChain?: string
    getAccountBalance?: string
    addCustomMockContract?: string
}

const serveInquirer = async (env: IHreContext) => {
    console.log(
        `
`,
        '\x1b[34m',
        'Welcome to',
        '\x1b[32m',
        `
 .d8b.  db   d8b   db d88888b .d8888.  .d88b.  .88b  d88. d88888b      .o88b. db      d888888b
d8' '8b 88   I8I   88 88'     88'  YP .8P  Y8. 88'YbdP'88 88'         d8P  Y8 88        '88'
88ooo88 88   I8I   88 88ooooo '8bo.   88    88 88  88  88 88ooooo     8P      88         88
88~~~88 Y8   I8I   88 88~~~~~   'Y8b. 88    88 88  88  88 88~~~~~     8b      88         88
88   88 '8b d8'8b d8' 88.     db   8D '8b  d8' 88  88  88 88.         Y8b  d8 88booo.   .88.
YP   YP  '8b8' '8d8'  Y88888P '8888Y'  'Y88P'  YP  YP  YP Y88888P      'Y88P' Y88888P Y888888P
`
    )
    const buildMainOptions: (string | IInquirerListField | InstanceType<typeof inquirer.Separator>)[] = [
        inquirerRunTests,
        inquirerRunScripts,
        inquirerFlattenContracts
    ]
    if (inquirerRunFoundryTest) buildMainOptions.push(inquirerRunFoundryTest)
    if (inquirerRunTests.name === 'Run tests' && inquirerRunScripts.name === 'Run scripts')
        buildMainOptions.push('Select scripts and tests to run')
    const solidityCoverageDetected = await detectPackage('solidity-coverage', false, false, false)
    if (solidityCoverageDetected) buildMainOptions.push('Run coverage tests')
    buildMainOptions.push(
        'Setup chains, RPC and accounts',
        'More settings',
        new inquirer.Separator(),
        // 'Deploy all contracts and run tests',
        inquirerRunMockContractCreator,
        // 'Create deployment scripts',
        'Get account balance',
        new inquirer.Separator(),
        inquirerFileContractsAddressDeployed,
        inquirerFileContractsAddressDeployedHistory,
        new inquirer.Separator()
    )
    const answers: MainMenuAnswer = await inquirer.prompt<MainMenuAnswer>([
        {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: buildMainOptions
        }
    ])
    if (answers.action === 'Run tests') await serveTestSelector(env, 'npx hardhat test', '')
    if (answers.action === 'Run scripts') await serveScriptSelector(env, null)
    if (answers.action === 'Flatten contracts') await serveFlattenContractsSelector(env, 'npx hardhat flatten')
    if (answers.action === 'Run Foundry Forge tests') await serveFoundryTestSelector(env, 'forge test')
    if (answers.action === 'Select scripts and tests to run') await serveScriptSelector(env, serveTestSelector)
    if (answers.action === 'Run coverage tests') await serveTestSelector(env, 'npx hardhat coverage', '')
    if (answers.action === 'Setup chains, RPC and accounts') await serveSettingSelector(env)
    if (answers.action === 'More settings') await serveMoreSettingSelector(env)
    if (answers.action === 'Create Mock contracts') await serveMockContractCreatorSelector()
    if (answers.action === 'Create deployment scripts') await serveDeploymentContractCreatorSelector()
    if (answers.action === 'Get account balance') await serveAccountBalance(env)
}

/**
 * Predicate that narrows an optional-string CLI flag to a non-empty string.
 * The plain `value !== ''` check returns `true` even for `undefined`, so we
 * need the explicit type guard to keep `noUncheckedIndexedAccess` happy.
 */
const isPresentString = (value: string | undefined): value is string =>
    typeof value === 'string' && value !== ''

/**
 * Boolean-shaped flags (`--addFoundry`, `--getAccountBalance`, ...) are
 * passed as strings by the task runner. Treat anything other than `''`,
 * `'false'`, or `'no'` as affirmative to mirror the old `=== true ||
 * === 'true' || === 'yes'` behaviour.
 */
const isAffirmativeString = (value: string | undefined): value is string => {
    if (!isPresentString(value)) return false
    return value !== 'false' && value !== 'no'
}

const serveCli = async (args: ICliArgs, env: IHreContext) => {
    switch (true) {
        case isPresentString(args.excludeTestFile):
            return removeExcludedFiles('test', args.excludeTestFile)
        case isPresentString(args.excludeTestDirectory):
            return addExcludedFiles('test', args.excludeTestDirectory, args.excludeTestDirectory, 'directory')
        case isPresentString(args.excludeScriptFile):
            return removeExcludedFiles('scripts', args.excludeScriptFile)
        case isPresentString(args.excludeScriptDirectory):
            return addExcludedFiles(
                'scripts',
                args.excludeScriptDirectory,
                args.excludeScriptDirectory,
                'directory'
            )
        case isPresentString(args.excludeContractFile):
            return removeExcludedFiles('contracts', args.excludeContractFile)
        case isPresentString(args.excludeContractDirectory):
            return addExcludedFiles(
                'contracts',
                args.excludeContractDirectory,
                args.excludeContractDirectory,
                'directory'
            )
        case isPresentString(args.addHardhatPlugin):
            return detectPackage(args.addHardhatPlugin, true, false, true)
        case isPresentString(args.removeHardhatPlugin):
            return detectPackage(args.removeHardhatPlugin, false, true, true)
        case isPresentString(args.addGithubTestWorkflow):
            return buildWorkflowsFromCommand(args.addGithubTestWorkflow)
        case isAffirmativeString(args.addFoundry):
            return buildFoundrySetting()
        case isAffirmativeString(args.addFoundryTestUtility):
            return installFoundryTestUtility()
        case isPresentString(args.addActivatedChain):
            return addActivatedChain(args.addActivatedChain)
        case isPresentString(args.removeActivatedChain):
            return removeActivatedChain(args.removeActivatedChain)
        case isAffirmativeString(args.getAccountBalance):
            return serveAccountBalance(env)
        case isPresentString(args.addCustomMockContract): {
            const parsed = parseAddCustomMockContractFlag(args.addCustomMockContract)
            if (!parsed) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Invalid --addCustomMockContract value. Expected "<registryName>:<customName>:<constructorName>:<constructorSymbol>".'
                )
                return
            }
            return runAddCustomMockContract(
                parsed.registryName,
                parsed.customName,
                parsed.constructorName,
                parsed.constructorSymbol
            )
        }
        default:
            return serveInquirer(env)
    }
}

export default serveCli
