import fs from 'fs'
import inquirer from 'inquirer'

import writeToEnv, { getEnvValue } from './buildEnv'
import { addExcludedFiles, buildExcludedFile, removeExcludedFiles } from './buildExcludedFile'
import {
    buildActivatedChainList,
    buildAllContractsList,
    buildAllForgeTestsList,
    buildAllScriptsList,
    buildAllTestsList,
    buildContractsList,
    buildScriptsList,
    buildTestsList
} from './buildFilesList'
import buildFoundrySetting from './buildFoundrySetting'
import buildMockContract, { buildMockDeploymentScriptOrTest } from './buildMockContracts'
import {
    addActivatedChain,
    addCustomChain,
    buildActivatedChainNetworkConfig,
    removeActivatedChain
} from './buildNetworks'
import buildWorkflows, { buildWorkflowsFromCommand } from './buildWorkflows'
import {
    DefaultChainList,
    DefaultGithubWorkflowsGroup,
    DefaultGithubWorkflowsList,
    DefaultHardhatPluginsList,
    getAddressBookConfig
} from './config'
import MockContractsList from './mockContracts'
import detectPackage from './packageInstaller'
import {
    IChain,
    IDefaultGithubWorkflowsList,
    IExcludedFiles,
    IFileList,
    IHardhatPluginAvailableList,
    IMockContractsList
} from './types'
import {
    inquirerFileContractsAddressDeployed,
    inquirerFileContractsAddressDeployedHistory,
    inquirerFlattenContracts,
    inquirerRunFoundryTest,
    inquirerRunMockContractCreator,
    inquirerRunScripts,
    inquirerRunTests,
    listAllFunctionSelectors,
    runCommand,
    sleep
} from './utils'

const serveNetworkSelector = async (
    env: any,
    command: string,
    firstCommand: string,
    GetAccountBalance: any,
    ServeEnvBuilder: any,
    noLocalNetwork: boolean
) => {
    const ActivatedChainList: IChain[] = await buildActivatedChainList()
    const BuildFullChainList: IChain[] = DefaultChainList
    const activatedChainList: string[] = []
    ActivatedChainList.map((chain: IChain) => {
        if (noLocalNetwork && chain.chainName !== 'hardhat') activatedChainList.push(chain.name)
        else if (!noLocalNetwork) activatedChainList.push(chain.name)
    })
    if (activatedChainList.length === 0) {
        const addHardhat = BuildFullChainList.find((basicChain: IChain) => basicChain.chainName === 'hardhat')
        const addHardhatLocalhost = BuildFullChainList.find(
            (basicChain: IChain) => basicChain.chainName === 'localhost'
        )
        if (addHardhat) {
            ActivatedChainList.push(addHardhat)
            activatedChainList.push(addHardhat.name)
        }
        if (addHardhatLocalhost) {
            ActivatedChainList.push(addHardhatLocalhost)
            activatedChainList.push(addHardhatLocalhost.name)
        }
    }
    let commandFlags = ''
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'network',
                message: 'Select a network',
                choices: activatedChainList
            }
        ])
        .then(async (networkSelected: { network: string }) => {
            ActivatedChainList.map((chain: IChain) => {
                if (chain.name === networkSelected.network) commandFlags = ' --network ' + chain.chainName
            })
            if (GetAccountBalance) await GetAccountBalance(env)
            else if (ServeEnvBuilder) await ServeEnvBuilder(env, networkSelected.network)
            await sleep(5000)
        })
    if (command) await runCommand(command, firstCommand, commandFlags, true)
}

const serveTestSelector = async (env: any, command: string, firstCommand: string) => {
    const testFilesObject = await buildTestsList()
    let testFilesList: string[] = []
    if (testFilesObject !== undefined && testFilesObject.length > 0) {
        testFilesList = testFilesObject.map((file: IFileList) => {
            return file.name
        })
        if (testFilesList.length > 0) {
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'test',
                        message: 'Select a test',
                        choices: testFilesList
                    }
                ])
                .then(async (testSelected: { test: string }) => {
                    testFilesObject.forEach((file: IFileList) => {
                        if (file.name === testSelected.test) {
                            if (file.type === 'file') command = command + ' test/' + file.filePath
                        }
                    })
                    if (firstCommand) command = 'npx hardhat test ' + command
                    await serveNetworkSelector(env, command, firstCommand, '', '', false)
                    await sleep(5000)
                })
        }
    }
}

const serveScriptSelector = async (env: any, ServeTestSelector: any) => {
    const scriptFilesObject = await buildScriptsList()
    const scriptFilesList: string[] = []
    if (scriptFilesObject) {
        scriptFilesObject.map((file: IFileList) => {
            scriptFilesList.push(file.name)
        })
        if (scriptFilesObject.length > 0) {
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'script',
                        message: 'Select a script',
                        choices: scriptFilesList
                    }
                ])
                .then(async (scriptSelected: { script: string }) => {
                    let command = 'npx hardhat run'
                    scriptFilesObject.forEach((file: IFileList) => {
                        if (file.name === scriptSelected.script) {
                            if (file.type === 'file') command = command + ' scripts/' + file.filePath
                        }
                    })
                    if (ServeTestSelector) await ServeTestSelector(env, '', command)
                    else {
                        await serveNetworkSelector(env, command, '', '', '', false)
                        await sleep(5000)
                    }
                })
        }
    }
}

const serveFlattenContractsSelector = async (env: any, command: string) => {
    const contractsFilesObject = await buildContractsList()
    const contractsFilesList: string[] = ['Flatten all contracts']
    const addressBookConfig = getAddressBookConfig(env.userConfig)
    let renameLicenseIdentifier = false
    if (contractsFilesObject) {
        contractsFilesObject.map((file: IFileList) => {
            contractsFilesList.push(file.name)
        })
        if (contractsFilesList.length > 0) {
            let contractFlattenName: string = ''
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'flatten',
                        message: 'Select a contract to flatten',
                        choices: contractsFilesList
                    },
                    {
                        type: 'confirm',
                        name: 'renameLicenseIdentifier',
                        message: 'Rename SPDX-License-Identifier'
                    }
                ])
                .then(async (contractsSelected: { flatten: string; renameLicenseIdentifier: boolean }) => {
                    renameLicenseIdentifier = contractsSelected.renameLicenseIdentifier
                    if (!fs.existsSync(addressBookConfig.contractsFlattenPath))
                        fs.mkdirSync(addressBookConfig.contractsFlattenPath)
                    if (contractsSelected.flatten !== 'Flatten all contracts') {
                        contractsFilesObject.forEach((file: IFileList) => {
                            if (file.name === contractsSelected.flatten) {
                                if (file.type === 'file') {
                                    command = command + ' contracts/' + file.filePath
                                    contractFlattenName = addressBookConfig.contractsFlattenPrefix + file.filePath
                                }
                            }
                        })
                    } else contractFlattenName = addressBookConfig.contractsFlattenPrefix + 'All.sol'
                })
            if (command) {
                await runCommand(
                    command,
                    '',
                    ' > ' + addressBookConfig.contractsFlattenPath + '/' + contractFlattenName,
                    renameLicenseIdentifier ? false : true
                )
                await sleep(3000)
                if (renameLicenseIdentifier) {
                    while (
                        fs.readFileSync(addressBookConfig.contractsFlattenPath + '/' + contractFlattenName, 'utf8')
                            .length === 0
                    ) {
                        await sleep(1000)
                    }
                    if (
                        fs.readFileSync(addressBookConfig.contractsFlattenPath + '/' + contractFlattenName, 'utf8')
                            .length > 0
                    ) {
                        let fileContent = fs.readFileSync(
                            addressBookConfig.contractsFlattenPath + '/' + contractFlattenName,
                            'utf8'
                        )
                        if (fileContent.includes('SPDX-License-Identifier')) {
                            fileContent = fileContent.replace(
                                'SPDX-License-Identifier',
                                'SPDX-License-DISABLED-Identifier'
                            )
                            fs.writeFileSync(
                                addressBookConfig.contractsFlattenPath + '/' + contractFlattenName,
                                fileContent
                            )
                        } else
                            console.log(
                                'SPDX-License-Identifier not found in ' + contractFlattenName + ' file, skipping rename'
                            )
                        if (fileContent.includes('pragma solidity')) {
                            fileContent = fileContent.replace('pragma solidity', '// pragma solidity')
                            fs.writeFileSync(
                                addressBookConfig.contractsFlattenPath + '/' + contractFlattenName,
                                fileContent
                            )
                        } else
                            console.log(
                                'pragma solidity not found in ' + contractFlattenName + ' file, skipping rename'
                            )
                    }
                }
            }
        }
    }
}

const serveFunctionListSelector = async (env: any) => {
    const contractsFilesObject = await buildContractsList()
    const contractsFilesList: string[] = []
    if (contractsFilesObject) {
        contractsFilesObject.map((file: IFileList) => contractsFilesList.push(file.name))
        if (contractsFilesList.length > 0)
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'contractName',
                        message: 'Select a contract to list all functions',
                        choices: contractsFilesList
                    }
                ])
                .then(async (contractsSelected: { contractName: string }) => {
                    const functions = await listAllFunctionSelectors(env, contractsSelected.contractName)
                    console.log(
                        'Contract: ',
                        '\x1b[32m',
                        contractsSelected.contractName,
                        '\x1b[0m',
                        'has ',
                        '\x1b[32m',
                        functions.length,
                        '\x1b[0m',
                        'public and external functions, ordered by selector'
                    )
                    console.table(functions)
                    await sleep(5000)
                })
    }
}

const serveFoundryTestSelector = async (env: any, command: string) => {
    const testFilesObject = await buildAllForgeTestsList()
    let testFilesList: string[] = []
    if (testFilesObject) {
        testFilesList = testFilesObject.map((file: IFileList) => {
            return file.name
        })
        if (testFilesList.length > 0) {
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'test',
                        message: 'Select a forge test',
                        choices: testFilesList
                    }
                ])
                .then(async (testSelected: { test: string }) => {
                    testFilesObject.forEach((file: IFileList) => {
                        if (file.name === testSelected.test) {
                            if (file.type === 'file') {
                                command = command + ' --match-path contracts/test/' + file.filePath
                            }
                        }
                    })
                    await runCommand(command, '', '', true)
                    await sleep(5000)
                })
        }
    }
}

const serveEnvBuilder = async (env: any, chainSelected: string) => {
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
        await inquirer
            .prompt([
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
            .then(async (envToBuild: { rpcUrl: string; privateKeyOrMnemonic: string }) => {
                await writeToEnv(env, selectedChain.chainName, envToBuild)
            })
        await sleep(2000)
    }
}

const serveSettingSelector = async (env: any) => {
    await inquirer
        .prompt([
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
        .then(async (settingSelected: { settings: string }) => {
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
                await inquirer
                    .prompt([
                        {
                            type: 'checkbox',
                            name: 'chainList',
                            message: 'Select a setting',
                            choices: fullChainList,
                            default: activatedChainList
                        }
                    ])
                    .then(async (chainListSelected: { chainList: string[] }) => {
                        fullChainList.map(async (chain: string) => {
                            if (chainListSelected.chainList.includes(chain)) {
                                await addActivatedChain(chain)
                            } else {
                                await removeActivatedChain(chain)
                            }
                        })
                        console.log('\x1b[32m%s\x1b[0m', 'Settings updated!')
                        await sleep(1000)
                    })
            }
            if (settingSelected.settings === 'Set RPC Url, private key or mnemonic for all or one chain')
                await serveNetworkSelector(env, '', '', '', serveEnvBuilder, true)
            if (settingSelected.settings === 'Add a custom chain to the current chain selection') {
                await inquirer
                    .prompt([
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
                    .then(
                        async (chainSelected: {
                            name: string
                            chainId: number
                            gas: string
                            defaultRpcUrl?: string
                        }) => {
                            const getNetworkConfig = buildActivatedChainNetworkConfig()
                            let buildNetworkConfig: any = {}
                            if (getNetworkConfig) {
                                buildNetworkConfig = `{
                                    "networks": [
                                        {${getNetworkConfig}}
                                    ]
                                }`
                                buildNetworkConfig = JSON.parse(buildNetworkConfig)
                            }
                            let chainName: string = ''
                            if (buildNetworkConfig.networks[0].customChain1 !== undefined && !chainName)
                                chainName = 'customChain1'
                            if (buildNetworkConfig.networks[0].customChain2 !== undefined && !chainName)
                                chainName = 'customChain2'
                            if (buildNetworkConfig.networks[0].customChain3 !== undefined && !chainName)
                                chainName = 'customChain3'
                            if (buildNetworkConfig.networks[0].customChain4 !== undefined && !chainName)
                                chainName = 'customChain4'
                            if (buildNetworkConfig.networks[0].customChain5 !== undefined && !chainName)
                                chainName = 'customChain5'
                            if (buildNetworkConfig.networks[0].customChain6 !== undefined && !chainName)
                                chainName = 'customChain6'
                            if (buildNetworkConfig.networks[0].customChain7 !== undefined && !chainName)
                                chainName = 'customChain7'
                            if (buildNetworkConfig.networks[0].customChain8 !== undefined && !chainName)
                                chainName = 'customChain8'
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
                    )
            }
            if (settingSelected.settings === 'See all config for activated chain') {
                const getNetworkConfig = buildActivatedChainNetworkConfig()
                let buildNetworkConfig: any = {}
                if (getNetworkConfig) {
                    buildNetworkConfig = `{
                            "networks": [
                                {${getNetworkConfig}}
                            ]
                        }`
                    buildNetworkConfig = JSON.parse(buildNetworkConfig)
                }
                console.table(buildNetworkConfig.networks[0])
            }
        })
}

const serveExcludeFileSelector = async (option: string) => {
    let allFiles: IFileList[] = []
    let excludedFiles: IExcludedFiles[] = await buildExcludedFile()
    const allFilesSelection: string[] = []
    let allExcludedSelection: string[] = []
    if (option === 'test') allFiles = await buildAllTestsList()
    else if (option === 'scripts') allFiles = await buildAllScriptsList()
    else if (option === 'contracts') allFiles = await buildAllContractsList()
    if (allFiles && allFiles.length > 0) {
        if (allFiles.filter((test: IFileList) => test.type === 'file').length > 0) {
            allFiles
                .filter((test: IFileList) => test.type === 'file')
                .map((file: IFileList) => {
                    allFilesSelection.push(file.filePath)
                })
        }
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
        .prompt([
            {
                type: 'checkbox',
                name: 'allFiles',
                message: 'Select the files you want to exclude',
                choices: allFilesSelection,
                default: allExcludedSelection
            }
        ])
        .then(async (activateFilesSelected: { allFiles: string[] }) => {
            allFiles.map(async (file: IFileList) => {
                if (activateFilesSelected.allFiles.includes(file.filePath))
                    await addExcludedFiles(option, file.name, file.filePath)
                else await removeExcludedFiles(option, file.name)
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
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'workflowType',
                message: 'Select a workflow to create',
                choices: workflowsList
            }
        ])
        .then(async (workflowSelected: { workflowType: string }) => {
            DefaultGithubWorkflowsList.map(async (workflow: IDefaultGithubWorkflowsList) => {
                if (workflow.title === workflowSelected.workflowType) workflowToAdd = workflow
            })
        })
    if (workflowToAdd !== undefined) {
        await buildWorkflows(workflowToAdd)
        await sleep(2000)
    }
}

const serveMoreSettingSelector = async (env: any) => {
    await inquirer
        .prompt([
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
                    new inquirer.Separator()
                ]
            }
        ])
        .then(async (moreSettingsSelected: { moreSettings: string }) => {
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
            if (moreSettingsSelected.moreSettings === 'Create Foundry settings, remapping and test utilities')
                await buildFoundrySetting()
        })
}

const servePackageInstaller = async () => {
    const hardhatPluginAvailableList: string[] = DefaultHardhatPluginsList.map(
        (plugin: IHardhatPluginAvailableList) => {
            return plugin.title
        }
    )
    const hardhatPluginInstalled: string[] = []
    DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
        if (await detectPackage(plugin.name, false, false, false)) {
            hardhatPluginInstalled.push(plugin.title)
        }
    })
    await sleep(500)
    const hardhatPluginToNotInclude = new Set(hardhatPluginInstalled)
    const hardhatPluginToInstall: string[] = hardhatPluginAvailableList.filter(
        (plugin: string) => !hardhatPluginToNotInclude.has(plugin)
    )
    let packageToInstall: IHardhatPluginAvailableList | undefined
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'plugins',
                message: 'Select a plugin to install',
                choices: hardhatPluginToInstall
            }
        ])
        .then(async (pluginssSelected: { plugins: string }) => {
            DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
                if (plugin.title === pluginssSelected.plugins) packageToInstall = plugin
            })
            await sleep(1500)
        })
    if (packageToInstall !== undefined) {
        await detectPackage(packageToInstall.name, true, false, packageToInstall.addInHardhatConfig)
        await sleep(5000)
    }
}

const servePackageUninstaller = async () => {
    const hardhatPluginInstalled: string[] = []
    DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
        if (await detectPackage(plugin.name, false, false, false)) {
            hardhatPluginInstalled.push(plugin.title)
        }
    })
    await sleep(1000)
    let packageToUninstall: IHardhatPluginAvailableList | undefined
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'plugins',
                message: 'Select a plugin to install',
                choices: hardhatPluginInstalled
            }
        ])
        .then(async (pluginssSelected: { plugins: string }) => {
            DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
                if (plugin.title === pluginssSelected.plugins) packageToUninstall = plugin
            })
            await sleep(1500)
        })
    if (packageToUninstall !== undefined)
        await detectPackage(packageToUninstall.name, false, true, packageToUninstall.addInHardhatConfig)
    await sleep(5000)
}

const serveMockContractCreatorSelector = async () => {
    if (MockContractsList) {
        const mockContractsList: string[] = MockContractsList.map((file: IMockContractsList) => {
            return file.name
        })
        let mockContractFirstSelected: string = ''
        let mockContractToAdd:
            | {
                  mockContract: string
                  mockDeploymentScript: string
                  mockTestScript: string
                  mockTestContractFoundry: string
              }
            | undefined
        await inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'mockContract',
                    message: 'Select a mock contract',
                    choices: mockContractsList
                }
            ])
            .then(async (mockContractSelected: { mockContract: string }) => {
                mockContractFirstSelected = mockContractSelected.mockContract
            })
        if (mockContractFirstSelected) {
            const mockContractFirstSelectedDetail = MockContractsList.filter(
                (file: IMockContractsList) => file.name === mockContractFirstSelected
            )[0]
            const mockContractDetailSelector = []
            if (
                mockContractFirstSelectedDetail.deploymentScriptJs !== undefined ||
                mockContractFirstSelectedDetail.deploymentScriptTs !== undefined
            )
                mockContractDetailSelector.push({
                    type: 'list',
                    name: 'mockDeploymentScript',
                    message: 'Create a deployment script for this mock contract',
                    choices: ['yes', 'no']
                })
            if (
                mockContractFirstSelectedDetail.testScriptJs !== undefined ||
                mockContractFirstSelectedDetail.testScriptTs !== undefined
            )
                mockContractDetailSelector.push({
                    type: 'list',
                    name: 'mockTestScript',
                    message: 'Create a test script for this mock contract',
                    choices: ['yes', 'no']
                })
            if (
                mockContractFirstSelectedDetail.testContractFoundry !== undefined &&
                fs.existsSync('contracts/test') &&
                fs.existsSync('foundry.toml')
            )
                mockContractDetailSelector.push({
                    type: 'list',
                    name: 'mockTestContractFoundry',
                    message: 'Create a Foundry test contract for this mock contract',
                    choices: ['yes', 'no']
                })
            await inquirer
                .prompt(mockContractDetailSelector)
                .then(
                    async (mockContractSelected: {
                        mockDeploymentScript: string
                        mockTestScript: string
                        mockTestContractFoundry: string
                    }) => {
                        mockContractToAdd = {
                            mockContract: mockContractFirstSelected,
                            mockDeploymentScript: mockContractSelected.mockDeploymentScript || 'no',
                            mockTestScript: mockContractSelected.mockTestScript || 'no',
                            mockTestContractFoundry: mockContractSelected.mockTestContractFoundry || 'no'
                        }
                    }
                )
        }
        if (mockContractToAdd !== undefined) {
            await buildMockContract(mockContractToAdd.mockContract)
            if (mockContractToAdd.mockDeploymentScript === 'yes')
                await buildMockDeploymentScriptOrTest(mockContractToAdd.mockContract, 'deployment')
            if (mockContractToAdd.mockTestScript === 'yes')
                await buildMockDeploymentScriptOrTest(mockContractToAdd.mockContract, 'test')
            if (mockContractToAdd.mockTestContractFoundry === 'yes')
                await buildMockDeploymentScriptOrTest(mockContractToAdd.mockContract, 'testForge')
        }
    }
}

const serveDeploymentContractCreatorSelector = async () => {}

const serveAccountBalance = async (env: any) => {
    const getAccountBalance = async (Env: any) => {
        const [deployer] = await Env.ethers.getSigners()
        const network = await Env.network
        // Get account balance
        const balance = await deployer.getBalance()
        console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', '\x1b[97m%s\x1b[0m', network.name)
        console.log('\x1b[32m%s\x1b[0m', 'Account address: ', '\x1b[97m%s\x1b[0m', deployer.address)
        console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', '\x1b[97m%s\x1b[0m', balance.toString())
    }
    await serveNetworkSelector(env, '', '', getAccountBalance, '', false)
}

const serveInquirer = async (env: any) => {
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
    const buildMainOptions: any = [inquirerRunTests, inquirerRunScripts, inquirerFlattenContracts]
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
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What do you want to do?',
                choices: buildMainOptions
            }
        ])
        .then(async (answers: { action: string }) => {
            if (answers.action === 'Run tests') await serveTestSelector(env, 'npx hardhat test', '')
            if (answers.action === 'Run scripts') await serveScriptSelector(env, '')
            if (answers.action === 'Flatten contracts') await serveFlattenContractsSelector(env, 'npx hardhat flatten')
            if (answers.action === 'Run Foundry Forge tests') await serveFoundryTestSelector(env, 'forge test')
            if (answers.action === 'Select scripts and tests to run') await serveScriptSelector(env, serveTestSelector)
            if (answers.action === 'Run coverage tests') await serveTestSelector(env, 'npx hardhat coverage', '')
            if (answers.action === 'Setup chains, RPC and accounts') await serveSettingSelector(env)
            if (answers.action === 'More settings') await serveMoreSettingSelector(env)
            if (answers.action === 'Create Mock contracts') await serveMockContractCreatorSelector()
            if (answers.action === 'Create deployment scripts') await serveDeploymentContractCreatorSelector()
            if (answers.action === 'Get account balance') await serveAccountBalance(env)
        })
}

const serveCli = async (args: any, env: any) => {
    switch (true) {
        case args.excludeTestFile !== '':
            return removeExcludedFiles('test', args.excludeTestFile)
        case args.excludeScriptFile !== '':
            return removeExcludedFiles('scripts', args.excludeScriptFile)
        case args.excludeContractFile !== '':
            return removeExcludedFiles('contracts', args.excludeContractFile)
        case args.addHardhatPlugin !== '':
            return detectPackage(args.addHardhatPlugin, true, false, true)
        case args.removeHardhatPlugin !== '':
            return detectPackage(args.removeHardhatPlugin, false, true, true)
        case args.addGithubTestWorkflow !== '':
            return buildWorkflowsFromCommand(args.addGithubTestWorkflow)
        case args.addFoundry === true || args.addFoundry === 'true' || args.addFoundry === 'yes':
            return buildFoundrySetting()
        case args.addActivatedChain !== '':
            return addActivatedChain(args.addActivatedChain)
        case args.removeActivatedChain !== '':
            return removeActivatedChain(args.removeActivatedChain)
        case args.getAccountBalance === true || args.getAccountBalance === 'true' || args.getAccountBalance === 'yes':
            return serveAccountBalance(env)
        default:
            return serveInquirer(env)
    }
}

export default serveCli
