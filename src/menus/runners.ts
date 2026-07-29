import inquirer from 'inquirer'

import { buildAllForgeTestsList, buildContractsList, buildScriptsList, buildTestsList } from '../buildFilesList.ts'
import { formatFlattenContractFlag, runFlattenContract } from '../buildFlattenContracts.ts'
import type { IHreContext } from '../types.ts'
import { displayFinalCliCommand, listAllFunctionSelectors, runCommand, waitForReadability } from '../utils.ts'
import { serveFileListSelector } from './fileSelector.ts'
import { serveNetworkSelector } from './network.ts'
import type { RenameLicenseAnswer } from './types.ts'

export const serveTestSelector = async (env: IHreContext, command: string, firstCommand: string) => {
    const testSelected = await serveFileListSelector('Select a test', buildTestsList)
    if (!testSelected || testSelected === 'back') return
    if (testSelected.type === 'file') command = command + ' test/' + testSelected.filePath
    if (firstCommand) command = 'npx hardhat test ' + command
    await serveNetworkSelector(env, command, firstCommand, undefined, undefined, false)
    // `runCommand` above used `thenExit=true`, so the Node process already exited
    // when the suite finishes — no need for a sleep.
}

export const serveScriptSelector = async (env: IHreContext, ServeTestSelector: typeof serveTestSelector | null) => {
    const scriptSelected = await serveFileListSelector('Select a script', buildScriptsList)
    if (!scriptSelected || scriptSelected === 'back') return
    let command = 'npx hardhat run'
    if (scriptSelected.type === 'file') command = command + ' scripts/' + scriptSelected.filePath
    if (ServeTestSelector) await ServeTestSelector(env, '', command)
    else {
        await serveNetworkSelector(env, command, '', undefined, undefined, false)
    }
}

export const serveFoundryTestSelector = async (env: IHreContext, command: string) => {
    const testSelected = await serveFileListSelector('Select a forge test', buildAllForgeTestsList)
    if (!testSelected || testSelected === 'back') return
    if (testSelected.type === 'file') command = command + ' --match-path contracts/test/' + testSelected.filePath
    // `thenExit=true`, so the Node process already exits once `forge test`
    // finishes — no sleep needed.
    await runCommand(command, '', '', true)
}

export const serveFlattenContractsSelector = async (env: IHreContext) => {
    const contractSelected = await serveFileListSelector('Select a contract to flatten', async (subPath: string) => {
        const contractsFilesObject = await buildContractsList(subPath)
        if (subPath) return contractsFilesObject
        return [{ name: 'Flatten all contracts', type: 'all', filePath: '' }, ...contractsFilesObject]
    })
    if (!contractSelected || contractSelected === 'back') return
    const contractsSelected: RenameLicenseAnswer = await inquirer.prompt<RenameLicenseAnswer>([
        {
            type: 'confirm',
            name: 'renameLicenseIdentifier',
            message: 'Rename SPDX-License-Identifier'
        }
    ])
    // The menu lets the user pick "Flatten all contracts" (display name) or
    // a specific file. The CLI flag value mirrors the same shape (`all` or
    // a contract name) so we can hand either straight to `runFlattenContract`.
    const contractName = contractSelected.type === 'file' ? contractSelected.filePath.replace(/\.sol$/, '') : 'all'
    await runFlattenContract(
        {
            contractName,
            renameLicenseIdentifier: contractsSelected.renameLicenseIdentifier
        },
        env.userConfig
    )
    displayFinalCliCommand(
        'flattenContract',
        formatFlattenContractFlag(contractName, contractsSelected.renameLicenseIdentifier)
    )
    await waitForReadability()
}

export const serveFunctionListSelector = async (env: IHreContext) => {
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
