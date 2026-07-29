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

/**
 * Public input shape for the `--addCustomChain` CLI flag (and the helper that
 * backs it). Only carries the user-visible fields — the internal `chainName`
 * slot (`customChain1` … `customChain8`) is assigned automatically by
 * {@link buildCustomChainEntry} so the menu and the flag surface stay in
 * lock-step.
 */
export interface IAddCustomChainInput {
    name: string
    chainId: number
    gas?: string
    defaultRpcUrl?: string
}

/**
 * Find the first free `customChain{N}` slot (1..8) in the activated chain
 * list. Returns `undefined` when every slot is already taken, so the caller
 * can warn instead of silently overwriting an existing custom chain.
 *
 * Slots are picked in ascending order so re-running the menu / CLI flag
 * without a removal step produces deterministic slot assignments.
 */
export const findAvailableCustomChainSlot = async (): Promise<string | undefined> => {
    const activatedChainList = await buildActivatedChainList()
    for (let i = 1; i <= 8; i++) {
        const candidate = `customChain${i}`
        if (!activatedChainList.find((chain: IChain) => chain.chainName === candidate)) {
            return candidate
        }
    }
    return undefined
}

/**
 * Build the {@link IChain} entry to persist when adding a custom chain
 * through the menu or the `--addCustomChain` CLI flag.
 *
 * Picks the next free `customChain{N}` slot (1..8) automatically, so the
 * caller only supplies user-visible fields. Returns `undefined` when:
 *   - the input is missing or not an object
 *   - `name` is empty after trimming
 *   - `chainId` is missing or not a positive integer
 *   - every `customChain{N}` slot is already in use
 *
 * Defaults `gas` to `'auto'` (the menu's own default) and drops
 * `defaultRpcUrl` when blank so the persisted entry matches what a fresh
 * menu interaction would write.
 */
export const buildCustomChainEntry = async (details: IAddCustomChainInput): Promise<IChain | undefined> => {
    if (!details || typeof details !== 'object') return undefined
    const name = typeof details.name === 'string' ? details.name.trim() : ''
    const rawChainId = typeof details.chainId === 'number' ? details.chainId : Number(details.chainId)
    if (!name) return undefined
    if (!Number.isFinite(rawChainId) || !Number.isInteger(rawChainId) || rawChainId <= 0) return undefined
    const gas = typeof details.gas === 'string' && details.gas.trim() !== '' ? details.gas.trim() : 'auto'
    const defaultRpcUrl =
        typeof details.defaultRpcUrl === 'string' && details.defaultRpcUrl.trim() !== ''
            ? details.defaultRpcUrl.trim()
            : undefined

    const chainName = await findAvailableCustomChainSlot()
    if (!chainName) return undefined

    const entry: IChain = {
        name,
        chainName,
        chainId: rawChainId,
        gas
    }
    if (defaultRpcUrl) entry.defaultRpcUrl = defaultRpcUrl
    return entry
}

/**
 * Print the conflict warning that {@link runAddCustomChain} uses when the
 * supplied chain collides with an existing entry. Kept as a small helper so
 * the test suite can verify the exact message without re-implementing it.
 */
const CHAIN_CONFLICT_MESSAGES: Record<string, string> = {
    defaultShortName: 'Chain with same Short-Name already exists in regular chain selection',
    defaultChainId: 'Chain with same chainId already exists in regular chain selection',
    activatedShortName: 'Chain with same Short-Name already exists in your settings activated chain list',
    activatedChainId: 'Chain with same chainId already exists in your settings activated chain list'
}

export const addCustomChain = async (chainDetails: IChain) => {
    const FullChainList = DefaultChainList
    const ActivatedChainList = await buildActivatedChainList()
    // Verify if the chain already exists in regular full chain list
    if (FullChainList.find((chain: IChain) => chain.chainName === chainDetails.chainName))
        console.log('\x1b[33m%s\x1b[0m', CHAIN_CONFLICT_MESSAGES.defaultShortName)
    else if (FullChainList.find((chain: IChain) => chain.chainId === chainDetails.chainId))
        console.log('\x1b[33m%s\x1b[0m', CHAIN_CONFLICT_MESSAGES.defaultChainId)
    // Verify if the chain already exists in user setting activated chain list
    else if (ActivatedChainList.find((chain: IChain) => chain.chainName === chainDetails.chainName))
        console.log('\x1b[33m%s\x1b[0m', CHAIN_CONFLICT_MESSAGES.activatedShortName)
    else if (ActivatedChainList.find((chain: IChain) => chain.chainId === chainDetails.chainId))
        console.log('\x1b[33m%s\x1b[0m', CHAIN_CONFLICT_MESSAGES.activatedChainId)
    else await addChain(chainDetails.chainName, chainDetails)
}

/**
 * Add a custom chain to the user's activated chain list, picking the
 * `customChain{N}` slot automatically. Returns `true` when the chain was
 * persisted, `false` when:
 *   - the input fails validation (missing name, non-positive chainId, …)
 *   - every `customChain{N}` slot is already in use
 *   - the chain collides with an existing default or activated chain
 *
 * The `false` return + yellow warning mirrors the existing menu behaviour so
 * the CLI dispatcher can flag the failure without throwing, matching how
 * `addCustomMockContract` and `addActivatedChain` already report failure to
 * the user. Closes the "Add a custom chain to the current chain selection"
 * menu sub-flow for non-interactive use.
 */
export const runAddCustomChain = async (details: IAddCustomChainInput): Promise<boolean> => {
    const entry = await buildCustomChainEntry(details)
    if (!entry) {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'Could not build a custom chain entry. Check name, chainId, and ensure a customChain{N} slot is free.'
        )
        return false
    }

    const FullChainList = DefaultChainList
    const ActivatedChainList = await buildActivatedChainList()
    if (FullChainList.find((chain: IChain) => chain.chainName === entry.chainName)) {
        console.log('\x1b[33m%s\x1b[0m', CHAIN_CONFLICT_MESSAGES.defaultShortName)
        return false
    }
    if (FullChainList.find((chain: IChain) => chain.chainId === entry.chainId)) {
        console.log('\x1b[33m%s\x1b[0m', CHAIN_CONFLICT_MESSAGES.defaultChainId)
        return false
    }
    if (ActivatedChainList.find((chain: IChain) => chain.chainName === entry.chainName)) {
        console.log('\x1b[33m%s\x1b[0m', CHAIN_CONFLICT_MESSAGES.activatedShortName)
        return false
    }
    if (ActivatedChainList.find((chain: IChain) => chain.chainId === entry.chainId)) {
        console.log('\x1b[33m%s\x1b[0m', CHAIN_CONFLICT_MESSAGES.activatedChainId)
        return false
    }

    await addChain(entry.chainName, entry)
    return true
}

/**
 * Render the value consumed by `--addCustomChain` so the printed CLI command
 * round-trips through {@link parseAddCustomChainFlag}.
 *
 * The flag value is a JSON object with the user-visible fields (`name`,
 * `chainId`, optional `gas`, optional `defaultRpcUrl`). JSON is the only
 * delimiter that survives every realistic payload (commas in names, colons
 * in RPC URLs, …) and matches the convention `--addCustomCommand` already
 * uses for structured settings entries.
 */
export const formatAddCustomChainFlag = (details: IAddCustomChainInput): string =>
    JSON.stringify({
        name: details.name,
        chainId: details.chainId,
        gas: details.gas,
        defaultRpcUrl: details.defaultRpcUrl
    })

/**
 * Parse the `--addCustomChain` CLI flag value.
 *
 * Returns `undefined` for anything that is not a valid JSON object with the
 * required `name` / `chainId` fields so `serveCli` can warn the user instead
 * of silently adding a malformed entry. The chainId coercion handles the
 * `1234` vs `"1234"` ambiguity (JSON numbers are parsed as numbers; JSON
 * strings of digits are coerced via `Number()`).
 */
export const parseAddCustomChainFlag = (value: string | undefined): IAddCustomChainInput | undefined => {
    if (typeof value !== 'string' || value.trim() === '') return undefined
    let parsed: any
    try {
        parsed = JSON.parse(value)
    } catch {
        return undefined
    }
    if (!parsed || typeof parsed !== 'object') return undefined
    const name = typeof parsed.name === 'string' ? parsed.name.trim() : ''
    if (!name) return undefined
    const rawChainId = typeof parsed.chainId === 'number' ? parsed.chainId : Number(parsed.chainId)
    if (!Number.isFinite(rawChainId) || !Number.isInteger(rawChainId) || rawChainId <= 0) return undefined
    const input: IAddCustomChainInput = { name, chainId: rawChainId }
    if (typeof parsed.gas === 'string' && parsed.gas.trim() !== '') input.gas = parsed.gas.trim()
    if (typeof parsed.defaultRpcUrl === 'string' && parsed.defaultRpcUrl.trim() !== '')
        input.defaultRpcUrl = parsed.defaultRpcUrl.trim()
    return input
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
