import fs from 'fs'
import inquirer from 'inquirer'

import buildMockContract, { buildMockDeploymentScriptOrTest } from '../buildMockContracts.ts'
import MockContractsList from '../mockContracts/index.ts'
import { validateRename } from '../renameMockContract.ts'
import type { IMockContractsList } from '../types.ts'
import { displayFinalCliCommand } from '../utils.ts'
import type { MockContractChoiceAnswer, MockContractDetailsAnswer, MockContractRenameAnswer } from './types.ts'

// Entry added on top of the mock contract selection to create every mock contract
// (and their deployment/test scripts) in a single pass.
const ALL_MOCK_CONTRACTS = 'All mock contracts'

interface MockContractsToAdd {
    mockContracts: string[]
    mockDeploymentScript: string
    mockTestScript: string
    mockTestContractFoundry: string
}

export const serveMockContractCreatorSelector = async () => {
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
        const detail: MockContractDetailsAnswer =
            await inquirer.prompt<MockContractDetailsAnswer>(mockContractDetailSelector)
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
export const runAddCustomMockContract = async (
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
