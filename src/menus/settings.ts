import inquirer from 'inquirer'

import { addExcludedFiles, buildExcludedFile, removeExcludedFiles } from '../buildExcludedFile.ts'
import { buildActivatedChainList, buildDirectoryFilesList } from '../buildFilesList.ts'
import {
    addActivatedChain,
    buildActivatedChainNetworkConfig,
    removeActivatedChain,
    runAddCustomChain
} from '../buildNetworks.ts'
import { DefaultChainList } from '../config.ts'
import type { IChain, IExcludedFiles, IFileList, IHreContext } from '../types.ts'
import { displayFinalCliCommand, waitForReadability } from '../utils.ts'
import { serveEnvBuilder, serveNetworkSelector } from './network.ts'
import type { ChainListAnswer, CustomChainAnswer, ExcludedFilesAnswer, SettingChoiceAnswer } from './types.ts'

export const serveSettingSelector = async (env: IHreContext) => {
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
        // inquirer `input` returns strings even for numeric fields, so coerce
        // chainId to a number before handing off to the shared runner that
        // backs the `--addCustomChain` CLI flag. The runner picks the next
        // free `customChain{N}` slot and prints the same conflict warnings as
        // the menu flow used to.
        const parsedChainId = Number(chainSelected.chainId)
        await runAddCustomChain({
            name: chainSelected.name,
            chainId: parsedChainId,
            gas: chainSelected.gas,
            defaultRpcUrl: chainSelected.defaultRpcUrl
        })
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

export const serveExcludeFileSelector = async (option: string) => {
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
