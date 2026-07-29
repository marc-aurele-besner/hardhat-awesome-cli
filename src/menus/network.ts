import inquirer from 'inquirer'

import writeToEnv, { getEnvValue } from '../buildEnv.ts'
import { buildActivatedChainList } from '../buildFilesList.ts'
import { buildNetworkSelectorChoices } from '../buildNetworks.ts'
import type { IChain, IHreContext } from '../types.ts'
import { runCommand, waitForReadability } from '../utils.ts'
import type { EnvBuilderAnswer, NetworkChoiceAnswer } from './types.ts'

/**
 * Narrow type for the optional callbacks `serveNetworkSelector` accepts.
 *
 * Both run after a chain is picked: `GetAccountBalance` prints the deployer
 * balance for the chosen network; `ServeEnvBuilder` opens the RPC/key editor.
 * They are loosely typed because the menu composes them at runtime and an
 * absence of one or the other is a valid configuration.
 */
export type NetworkFollowup = ((env: IHreContext, networkName: string) => Promise<void>) | null | undefined

export const serveNetworkSelector = async (
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

export const serveEnvBuilder = async (env: IHreContext, chainSelected: string) => {
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

export const serveAccountBalance = async (env: IHreContext) => {
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
