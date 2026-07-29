import inquirer from 'inquirer'

import { buildActivatedChainList } from '../buildFilesList.ts'
import { buildNetworkSelectorChoices } from '../buildNetworks.ts'
import {
    formatVerifyContractFlag,
    isEthereumAddress,
    listDeployedContractsForNetwork,
    resolveChainShortName,
    runVerifyContract
} from '../buildVerifyContract.ts'
import type { IChain, IHreContext } from '../types.ts'
import { displayFinalCliCommand } from '../utils.ts'
import type {
    NetworkChoiceAnswer,
    VerifyContractAddressAnswer,
    VerifyContractArgsAnswer,
    VerifyContractDeployedAnswer,
    VerifyContractSourceAnswer
} from './types.ts'

const VERIFY_SOURCE_ADDRESS_BOOK = 'Pick a contract from the address book'
const VERIFY_SOURCE_MANUAL = 'Enter a contract address manually'
const VERIFY_PROVIDE_ARGS_YES = 'yes'
const VERIFY_PROVIDE_ARGS_NO = 'no'

/**
 * Interactive "Verify a contract" flow.
 *
 * Steps:
 *   1. Pick a network from the activated chain list (matches the selector
 *      used by `serveAccountBalance` so the user already knows the layout).
 *   2. Pick the source: address-book entry or manual address.
 *   3. Resolve the address.
 *   4. Optionally provide constructor arguments (comma-separated).
 *   5. Run `npx hardhat verify <address> --network <network> [<args>...]`.
 *
 * The function delegates parsing, validation, and command construction to
 * `buildVerifyContract.ts` so the CLI flag dispatcher and the menu share
 * the same code path.
 */
export const serveVerifyContractSelector = async (env: IHreContext) => {
    const activatedChainListFromFile: IChain[] = await buildActivatedChainList()
    const { chains: ActivatedChainList, names: activatedChainList } = buildNetworkSelectorChoices(
        activatedChainListFromFile,
        // Local hardhat networks don't have a block explorer — skipping
        // them keeps the menu from offering a verify command that would
        // fail at the explorer API.
        true
    )
    if (ActivatedChainList.length === 0) {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'No network activated. Activate a chain with --addActivatedChain first or via the "Setup chains, RPC and accounts" menu before verifying a contract.'
        )
        return
    }
    const networkSelected: NetworkChoiceAnswer = await inquirer.prompt<NetworkChoiceAnswer>([
        {
            type: 'list',
            name: 'network',
            message: 'Select the network the contract was deployed to',
            choices: activatedChainList
        }
    ])
    const selectedChain = ActivatedChainList.find((chain: IChain) => chain.name === networkSelected.network)
    if (!selectedChain) return
    const chainShortName = resolveChainShortName(selectedChain, ActivatedChainList)

    const deployedEntries = listDeployedContractsForNetwork(chainShortName, env.userConfig)
    const sourceChoices = [VERIFY_SOURCE_MANUAL]
    if (deployedEntries.length > 0) sourceChoices.unshift(VERIFY_SOURCE_ADDRESS_BOOK)
    const sourceAnswer: VerifyContractSourceAnswer = await inquirer.prompt<VerifyContractSourceAnswer>([
        {
            type: 'list',
            name: 'source',
            message: 'How do you want to identify the contract?',
            choices: sourceChoices
        }
    ])

    let contractNameOrAddress = ''
    let resolvedAddress = ''
    if (sourceAnswer.source === VERIFY_SOURCE_ADDRESS_BOOK) {
        const contractChoices = deployedEntries.map((entry) => entry.name)
        const picked: VerifyContractDeployedAnswer = await inquirer.prompt<VerifyContractDeployedAnswer>([
            {
                type: 'list',
                name: 'contractName',
                message: 'Select a contract from the address book',
                choices: contractChoices
            }
        ])
        contractNameOrAddress = picked.contractName
        const resolved = deployedEntries.find((entry) => entry.name === picked.contractName)
        resolvedAddress = resolved?.address ?? ''
    } else {
        const addressAnswer: VerifyContractAddressAnswer = await inquirer.prompt<VerifyContractAddressAnswer>([
            {
                type: 'input',
                name: 'address',
                message: 'Enter the deployed contract address (0x…)',
                validate: (input: string) =>
                    isEthereumAddress(input) || 'Please enter a valid 0x-prefixed 40-hex-character address'
            }
        ])
        contractNameOrAddress = addressAnswer.address.trim()
        resolvedAddress = contractNameOrAddress
    }

    const argsAnswer: VerifyContractArgsAnswer = await inquirer.prompt<VerifyContractArgsAnswer>([
        {
            type: 'list',
            name: 'provideArgs',
            message: 'Do you need to pass constructor arguments?',
            choices: [VERIFY_PROVIDE_ARGS_NO, VERIFY_PROVIDE_ARGS_YES]
        }
    ])
    let constructorArgs: string[] = []
    if (argsAnswer.provideArgs === VERIFY_PROVIDE_ARGS_YES) {
        const argsInput: VerifyContractArgsAnswer = await inquirer.prompt<VerifyContractArgsAnswer>([
            {
                type: 'input',
                name: 'constructorArgs',
                message: 'Comma-separated constructor arguments (e.g. 0xToken,42)'
            }
        ])
        constructorArgs = argsInput.constructorArgs
            .split(',')
            .map((arg: string) => arg.trim())
            .filter((arg: string) => arg.length > 0)
    }

    displayFinalCliCommand(
        'verifyContract',
        formatVerifyContractFlag(chainShortName, contractNameOrAddress, constructorArgs)
    )
    await runVerifyContract({
        network: chainShortName,
        contractNameOrAddress,
        constructorArgs
    })
}
