import fs from 'fs'

import { getAddressBookConfig } from './config.ts'
import { runCommand } from './utils.ts'
import type { IChain } from './types.ts'

/**
 * Inputs accepted by {@link runVerifyContract}.
 *
 * `contractNameOrAddress` is opaque: it can be either an Ethereum address
 * (`0x…` — validated with {@link isEthereumAddress}) or a contract name from
 * the address book (resolved by {@link resolveContractAddress}). All
 * validation lives in the helpers so the menu and the CLI flag dispatcher
 * share the same code path.
 *
 * `constructorArgs` is forwarded to `npx hardhat verify <address> --network
 * <network> <arg1> <arg2> …`. Both `@nomicfoundation/hardhat-verify` and
 * the Hardhat 3 built-in verify task accept positional arguments after the
 * address, so the same shell invocation works for both.
 */
export interface IVerifyContractOptions {
    network: string
    contractNameOrAddress: string
    constructorArgs?: string[]
}

/**
 * Minimal subset of the address book entry we need to resolve a contract.
 * Mirrors the field set on `AwesomeAddressBook` / `IContractAddressDeployed`
 * but kept local so the verify module does not depend on the address-book
 * class.
 */
interface IDeployedContractEntry {
    name: string
    address: string
    network: string
}

/**
 * Load the address book — the JSON file the project writes from
 * `addressBook.saveContract` after every deployment.
 *
 * Returns an empty list when the file is missing, unreadable, or unparseable
 * so the caller can fall through to the manual-address branch without
 * throwing from a loader. The same defensive pattern is used in
 * `buildCustomCommands` / `buildExcludedFile`.
 */
export const loadDeployedContracts = (userConfig?: { addressBook?: any }): IDeployedContractEntry[] => {
    const addressBookConfig = getAddressBookConfig(userConfig)
    const filePath = addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed
    if (!fs.existsSync(filePath)) return []
    try {
        const rawdata: any = fs.readFileSync(filePath)
        const parsed = JSON.parse(rawdata)
        if (!Array.isArray(parsed)) return []
        return parsed
            .filter((entry: any) => entry && typeof entry.name === 'string' && typeof entry.address === 'string')
            .map((entry: any) => ({
                name: entry.name,
                address: entry.address,
                network: entry.network
            }))
    } catch {
        return []
    }
}

/**
 * Resolve an address-book entry name to its on-chain address for the given
 * network.
 *
 * Returns `undefined` when no entry matches (the caller prints a friendly
 * warning and falls back to the manual-address branch). The address book
 * stores one entry per `(name, network)` pair, so a single match is the
 * expected happy path; multiple matches are reduced to the first one to
 * match the historical `retrieveContract` behaviour.
 */
export const resolveContractAddress = (
    contractName: string,
    network: string,
    userConfig?: { addressBook?: any }
): string | undefined => {
    const entries = loadDeployedContracts(userConfig).filter(
        (entry: IDeployedContractEntry) => entry.name === contractName && entry.network === network
    )
    if (entries.length === 0) return undefined
    return entries[0].address
}

/**
 * Cheap Ethereum-address validation. We only need to catch the obvious
 * mistakes (typos, paste garbage) here — Hardhat itself will reject the
 * command at runtime if the address is on the wrong chain or has no code.
 *
 * Accepts both lower- and upper-case hex, an optional `0x` prefix, and the
 * canonical 40-hex-character length.
 */
export const isEthereumAddress = (value: string): boolean => {
    if (typeof value !== 'string') return false
    const trimmed = value.trim()
    if (trimmed.length !== 40 && trimmed.length !== 42) return false
    const hex = trimmed.startsWith('0x') || trimmed.startsWith('0X') ? trimmed.slice(2) : trimmed
    return /^[0-9a-fA-F]{40}$/.test(hex)
}

/**
 * Build the `npx hardhat verify` command for the given contract.
 *
 * The `--network <network>` flag is appended first so subsequent positional
 * arguments land where both `@nomicfoundation/hardhat-verify` and the
 * Hardhat 3 built-in verify task expect them. Constructor arguments are
 * shell-quoted with single quotes — they typically contain commas and full
 * stops (`0x...`, `42`) but never apostrophes per the Hardhat 2-era
 * conventions this code follows.
 */
export const buildVerifyCommand = (network: string, address: string, constructorArgs: string[] = []): string => {
    const quotedArgs = constructorArgs.map((arg: string) => `'${arg.replace(/'/g, "'\\''")}'`)
    return [`npx hardhat verify`, address, '--network', network, ...quotedArgs].join(' ')
}

/**
 * Resolve the address-book reference, run the build, and then invoke the
 * `npx hardhat verify` command. Surfaces a clear error when the verify
 * plugin is missing so the user knows what to install next.
 *
 * Returns `true` when the command was invoked successfully, `false` when
 * validation failed (so the CLI flag dispatcher can warn without throwing).
 */
export const runVerifyContract = async (options: IVerifyContractOptions): Promise<boolean> => {
    const network = options.network?.trim()
    const contractNameOrAddress = options.contractNameOrAddress?.trim()
    if (!network || !contractNameOrAddress) {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'Both --network and a contract name or address are required to verify a contract.'
        )
        return false
    }

    let address = contractNameOrAddress
    if (!isEthereumAddress(contractNameOrAddress)) {
        const resolved = resolveContractAddress(contractNameOrAddress, network)
        if (!resolved) {
            console.log(
                '\x1b[33m%s\x1b[0m',
                `Contract "${contractNameOrAddress}" was not found in the address book for network "${network}". ` +
                    'Pass a 0x… address directly to verify without an address-book entry.'
            )
            return false
        }
        address = resolved
    }

    const command = buildVerifyCommand(network, address, options.constructorArgs ?? [])
    if (!isVerifyPluginInstalled()) {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'No contract-verification plugin was detected. Install @nomicfoundation/hardhat-verify ' +
                'and add it to your hardhat.config.ts plugins list before running this command.'
        )
        console.log('\x1b[33m%s\x1b[0m', 'Equivalent CLI command: ', '\x1b[97m\x1b[0m', command)
        return true
    }
    await runCommand(command, '', '', true)
    return true
}

/**
 * Heuristic check for the verify plugin. We look at the project's
 * `package.json` (the same source the Hardhat plugin loader uses) so a
 * user running `npx hardhat verify` outside of this CLI gets the same
 * "install the plugin" message. We do not parse the resolved config here
 * because that requires a live Hardhat runtime environment.
 */
export const isVerifyPluginInstalled = (): boolean => {
    if (!fs.existsSync('package.json')) return false
    try {
        const rawdata: any = fs.readFileSync('package.json')
        const pkg = JSON.parse(rawdata)
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
        return Boolean(deps['@nomicfoundation/hardhat-verify'] || deps['hardhat-verify'])
    } catch {
        return false
    }
}

/**
 * Render the value consumed by `--verifyContract` so the printed CLI
 * command round-trips through {@link parseVerifyContractFlag}.
 *
 * Shape: `<network>:<contractNameOrAddress>[:<arg1>:<arg2>:...]`. The
 * network is the first segment so the CLI dispatcher can pull it out
 * without traversing the rest of the value (matches the
 * `--addDeploymentScript` pattern).
 */
export const formatVerifyContractFlag = (
    network: string,
    contractNameOrAddress: string,
    constructorArgs: string[] = []
): string => {
    const parts = [network, contractNameOrAddress, ...constructorArgs]
    return parts.join(':')
}

/**
 * Parse the `--verifyContract` CLI flag value.
 *
 * Returns `undefined` when the value is missing or empty so `serveCli`
 * can fall through to the next flag instead of invoking the verify flow
 * with garbage. The first segment is the network, the second is the
 * contract name or address, and any remaining segments are constructor
 * arguments — matches the format rendered by {@link formatVerifyContractFlag}.
 */
export const parseVerifyContractFlag = (
    value: string | undefined
): { network: string; contractNameOrAddress: string; constructorArgs: string[] } | undefined => {
    if (typeof value !== 'string' || value.trim() === '') return undefined
    const parts = value.split(':')
    if (parts.length < 2) return undefined
    const [network, contractNameOrAddress, ...constructorArgs] = parts
    if (!network || !contractNameOrAddress) return undefined
    return { network, contractNameOrAddress, constructorArgs }
}

/**
 * Helper used by the menu to list the address-book entries that match a
 * given network. Returns `[]` when the address book is empty so the menu
 * can short-circuit to the manual-address branch.
 */
export const listDeployedContractsForNetwork = (
    network: string,
    userConfig?: { addressBook?: any }
): IDeployedContractEntry[] => {
    return loadDeployedContracts(userConfig).filter((entry: IDeployedContractEntry) => entry.network === network)
}

/**
 * Compute the chain short-name from a human-readable chain entry, matching
 * the selector used by `serveNetworkSelector`. Centralised here so the
 * flag dispatcher and the menu agree on the network value to feed into
 * `npx hardhat verify --network <shortName>`.
 */
export const resolveChainShortName = (chain: IChain, activatedChainList: IChain[]): string => {
    const match = activatedChainList.find((entry: IChain) => entry.name === chain.name)
    return match?.chainName ?? chain.chainName
}
