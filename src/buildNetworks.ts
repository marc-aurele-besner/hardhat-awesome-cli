import fs from 'fs'

import { getEnvValue } from './buildEnv.ts'
import { buildActivatedChainList } from './buildFilesList.ts'
import { DefaultChainList, getAddressBookConfig } from './config.ts'
import type { IChain } from './types.ts'
import { redactSecret } from './utils.ts'

/**
 * Build the rendered network configuration string.
 *
 * Private keys and mnemonics are masked by default (`****abcd`) so they are
 * safe to print on the terminal or paste into bug reports. Set the
 * `AWESOME_CLI_SHOW_SECRETS` environment variable to a truthy value to
 * reproduce the previous behaviour of echoing secrets in full.
 */
export const buildActivatedChainNetworkConfig = () => {
    let chainConfig: string = ''
    let fileSetting: any = []
    const addressBookConfig = getAddressBookConfig()
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
    }
    if (fileSetting && fileSetting.activatedChain) {
        if (fileSetting.activatedChain.length > 0) {
            fileSetting.activatedChain.forEach((chain: IChain) => {
                const defaultRpcUrl = getEnvValue('rpcUrl'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                const defaultPrivateKey = redactSecret(
                    getEnvValue('privateKey'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                )
                const defaultMnemonic = redactSecret(
                    getEnvValue('mnemonic'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                )
                let buildAccounts = ''
                if (defaultPrivateKey) {
                    buildAccounts = `"accounts": ["${defaultPrivateKey}"]`
                } else if (defaultMnemonic) {
                    buildAccounts = `"accounts": {
                        "mnemonic": "${defaultMnemonic}"
                    }`
                }
                if (buildAccounts) {
                    if (defaultRpcUrl || chain.defaultRpcUrl) {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas || 'auto'}",
                                "gasPrice": "auto",
                                "gasMultiplier": 1,
                                "url": "${defaultRpcUrl || chain.defaultRpcUrl || 'http://localhost:8545'}",
                                "timeout": 40000,
                                "httpHeaders": {},
                                ${buildAccounts || '"accounts": "remote"'}
                            },`
                    } else {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas || 'auto'}",
                                "gasPrice": "auto",
                                "gasMultiplier": 1,
                                "url": "http://localhost:8545",
                                "timeout": 40000,
                                "httpHeaders": {},
                                ${buildAccounts || '"accounts": "remote"'}
                            },`
                    }
                } else {
                    if (defaultRpcUrl || chain.defaultRpcUrl) {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas || 'auto'}",
                                "gasPrice": "auto",
                                "gasMultiplier": 1,
                                "url": "${defaultRpcUrl || chain.defaultRpcUrl || ''}",
                                "timeout": 40000,
                                "httpHeaders": {},
                                ${buildAccounts || '"accounts": "remote"'}
                            },`
                    } else {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas || 'auto'}",
                                "gasPrice": "auto",
                                "gasMultiplier": 1,
                                "url": "http://localhost:8545",
                                "timeout": 40000,
                                "httpHeaders": {},
                                "accounts": "remote"
                            },`
                    }
                }
                return chainConfig
            })
            const fihainConfig = `${chainConfig.slice(0, -1)}`
            return fihainConfig
        }
    }
    return []
}

const addChain = async (chainName: string, chainToAdd: IChain) => {
    let fileSetting: any = []
    const addressBookConfig = getAddressBookConfig()
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting) {
            if (!fileSetting.activatedChain) {
                fileSetting = {
                    ...fileSetting,
                    activatedChain: []
                }
            } else {
                fileSetting = {
                    ...fileSetting,
                    activatedChain: [...fileSetting.activatedChain]
                }
            }
        }
    } else {
        fileSetting = {
            activatedChain: []
        }
    }
    if (fileSetting && fileSetting.activatedChain) {
        if (fileSetting.activatedChain.length > 0) {
            if (!fileSetting.activatedChain.find((chain: IChain) => chain.name === chainName)) {
                fileSetting.activatedChain.push(chainToAdd)
            }
        } else fileSetting.activatedChain.push(chainToAdd)
    } else {
        fileSetting.push({
            activatedChain: [chainToAdd]
        })
    }
    try {
        fs.writeFileSync(addressBookConfig.fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
    } catch {
        console.log('\x1b[31m%s\x1b[0m', 'Error adding chain: ' + chainName + ' to your settings!')
    }
}

export const addActivatedChain = async (chainName: string) => {
    const FullChainList: IChain[] = DefaultChainList
    const chainToAdd: IChain | undefined = FullChainList.find((chain: IChain) => chain.name === chainName)
    if (chainToAdd !== undefined) await addChain(chainName, chainToAdd)
}

export const removeActivatedChain = async (chainName: string) => {
    const FullChainList: IChain[] = DefaultChainList
    const chainToRemove: IChain | undefined = FullChainList.find((chain: IChain) => chain.name === chainName)
    let fileSetting: any = []
    const addressBookConfig = getAddressBookConfig()
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI) && chainToRemove) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.activatedChain) {
            if (fileSetting.activatedChain.length > 0) {
                fileSetting.activatedChain
                    .filter((chain: IChain) => chain.chainName === chainToRemove.chainName)
                    .forEach((chain: IChain) => {
                        fileSetting.activatedChain.pop(chain)
                        fs.writeFileSync(addressBookConfig.fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
                    })
            }
        }
    }
}

export const addCustomChain = async (chainDetails: IChain) => {
    const FullChainList = DefaultChainList
    const ActivatedChainList = await buildActivatedChainList()
    // Verify if the chain already exists in regular full chain list
    if (FullChainList.find((chain: IChain) => chain.chainName === chainDetails.chainName))
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same Short-Name already exists in regular chain selection')
    else if (FullChainList.find((chain: IChain) => chain.chainId === chainDetails.chainId))
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same chainId already exists in regular chain selection')
    // Verify if the chain already exists in user setting activated chain list
    else if (ActivatedChainList.find((chain: IChain) => chain.chainName === chainDetails.chainName))
        console.log(
            '\x1b[33m%s\x1b[0m',
            'Chain with same Short-Name already exists in your settings activated chain list'
        )
    else if (ActivatedChainList.find((chain: IChain) => chain.chainId === chainDetails.chainId))
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same chainId already exists in your settings activated chain list')
    else await addChain(chainDetails.chainName, chainDetails)
}

/**
 * Build the list of chains offered in the network selector from the user's
 * activated chain list.
 *
 * - `noLocalNetwork` filters the `hardhat` entry out (used when editing the
 *   RPC / accounts for a chain, where the in-memory hardhat network doesn't
 *   apply).
 * - When local networks are allowed, `hardhat` is always re-injected as the
 *   default, even if the user removed it from their activated list. This
 *   keeps the local dev network visible in later actions (tests, scripts,
 *   deployments, account balance) even when only mainnet / testnet chains
 *   were ticked in the setup screen. The selection is returned alongside
 *   `activatedChainList` so the caller can resolve the chosen name back to
 *   the matching `IChain` without an extra lookup. See issue #32.
 * - If the user has no chains at all (fresh project), `hardhat` and
 *   `localhost` are added as defaults so the selector is never empty.
 */
export const buildNetworkSelectorChoices = (
    activatedChainList: IChain[],
    noLocalNetwork: boolean
): { chains: IChain[]; names: string[] } => {
    const chains: IChain[] = []
    activatedChainList.forEach((chain: IChain) => {
        if (noLocalNetwork && chain.chainName === 'hardhat') return
        chains.push(chain)
    })

    if (!noLocalNetwork && chains.length === 0) {
        // Fresh project — neither hardhat nor localhost are activated yet, so
        // expose both as sensible defaults.
        const defaultHardhat = DefaultChainList.find((chain: IChain) => chain.chainName === 'hardhat')
        const defaultLocalhost = DefaultChainList.find((chain: IChain) => chain.chainName === 'localhost')
        if (defaultHardhat) chains.push(defaultHardhat)
        if (defaultLocalhost) chains.push(defaultLocalhost)
    } else if (!noLocalNetwork) {
        // User already activated some chains but didn't pick the local hardhat
        // network — re-inject it so it stays available for later actions
        // (tests, scripts, deployments, account balance). See issue #32.
        const hasHardhat = chains.some((chain: IChain) => chain.chainName === 'hardhat')
        if (!hasHardhat) {
            const defaultHardhat = DefaultChainList.find((chain: IChain) => chain.chainName === 'hardhat')
            if (defaultHardhat) chains.unshift(defaultHardhat)
        }
    }

    const names = chains.map((chain: IChain) => chain.name)
    return { chains, names }
}
