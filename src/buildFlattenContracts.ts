import fs from 'fs'
import path from 'path'

import { getAddressBookConfig } from './config.ts'
import { runCommand, waitForReadability } from './utils.ts'

/**
 * Sentinel value that asks `runFlattenContract` to flatten every contract
 * under `contracts/` instead of a single one. Used both by the menu
 * (`Flatten all contracts`) and the `--flattenContract all` CLI flag so the
 * two surfaces stay in lock-step.
 */
export const FLATTEN_ALL_KEYWORD = 'all'

/**
 * Suffix accepted (and emitted) by `--flattenContract` to opt into the
 * SPDX/pragma rewrite described in {@link renameFlattenedLicenseAndPragma}.
 * Documented here so the format helpers do not have to share a magic
 * string across files.
 */
export const FLATTEN_RENAME_LICENSE_SUFFIX = 'renameLicense'

/**
 * Inputs accepted by {@link runFlattenContract}.
 *
 * `contractName` is either the literal {@link FLATTEN_ALL_KEYWORD} or the
 * relative path of a `.sol` file under `contracts/` (with or without the
 * `.sol` extension). Resolved to a real file path on disk via
 * {@link resolveContractFile} so the same value can be passed back from
 * the CLI flag dispatcher and the interactive menu.
 *
 * `renameLicenseIdentifier` mirrors the menu's "Rename SPDX-License-Identifier"
 * confirm: when true, the flatten output has its SPDX identifier commented
 * out and the `pragma solidity` line turned into a comment, so the result
 * passes the multi-file "duplicate license" sanity check.
 */
export interface IFlattenContractOptions {
    contractName: string
    renameLicenseIdentifier?: boolean
}

/**
 * Resolve a contract name to a `.sol` file under `contracts/`.
 *
 * Accepts both the bare contract name (`MyToken`) and a relative path with
 * or without the `.sol` extension (`utils/MyToken`, `utils/MyToken.sol`).
 * Returns the path relative to the contracts directory (`utils/MyToken.sol`)
 * so the caller can build the flatten command and the output filename
 * without re-deriving either. Returns `undefined` when no file matches so
 * the CLI dispatcher can warn instead of silently running on a missing
 * target.
 *
 * Lookup order:
 *   1. Direct path match (`contracts/<contractName>` or `contracts/<contractName>.sol`).
 *   2. Recursive basename match — the first `.sol` file anywhere under
 *      `contracts/` whose filename matches `<contractName>.sol`.
 *
 * The basename search is the same fallback the menu relies on when a user
 * types the contract identifier instead of browsing the directory tree, so
 * passing either form through the flag produces the same result.
 */
export const resolveContractFile = (
    contractName: string,
    contractsDirectory: string = 'contracts'
): string | undefined => {
    if (!contractName || contractName === FLATTEN_ALL_KEYWORD) return undefined
    if (!fs.existsSync(contractsDirectory)) return undefined

    const normalizedInput = contractName.replace(/\\/g, '/')
    const withExtension = normalizedInput.endsWith('.sol') ? normalizedInput : `${normalizedInput}.sol`

    const directCandidate = path.join(contractsDirectory, withExtension)
    if (fs.existsSync(directCandidate) && fs.statSync(directCandidate).isFile()) {
        return withExtension
    }

    const targetBasename = path.basename(withExtension)
    const stack: string[] = [contractsDirectory]
    while (stack.length > 0) {
        const current = stack.pop() as string
        const entries = fs.readdirSync(current)
        for (const entry of entries) {
            const entryPath = path.join(current, entry)
            const stat = fs.lstatSync(entryPath)
            if (stat.isDirectory()) {
                stack.push(entryPath)
                continue
            }
            if (stat.isFile() && entry === targetBasename) {
                return path.relative(contractsDirectory, entryPath).split(path.sep).join('/')
            }
        }
    }
    return undefined
}

/**
 * Build the flatten command for the given contract (or for every contract).
 *
 * Returns `npx hardhat flatten` when `filePath` is undefined (matches the
 * menu's "Flatten all contracts" entry), otherwise appends the resolved
 * `contracts/<file>` path. The `>` redirect is appended by the caller so
 * the command stays useful for piping into tools that want the raw flatten
 * output (e.g. `tar`, `diff`).
 */
export const buildFlattenCommand = (filePath?: string): string => {
    if (!filePath) return 'npx hardhat flatten'
    return `npx hardhat flatten contracts/${filePath}`
}

/**
 * Resolve the path the flatten output is written to.
 *
 * Mirrors the menu's naming convention: `flat_All.sol` for the "flatten
 * everything" entry, and `flat_<dir>-<file>.sol` for everything else
 * (slashes turned into hyphens so a single sub-directory never produces a
 * sub-directory inside `contractsFlatten/`).
 */
export const resolveFlattenOutputPath = (
    filePath: string | undefined,
    flattenDirectory: string,
    flattenPrefix: string
): string => {
    if (!filePath) return path.join(flattenDirectory, `${flattenPrefix}All.sol`)
    const flatName = `${flattenPrefix}${filePath.replace(/\//g, '-')}`
    return path.join(flattenDirectory, flatName)
}

/**
 * Post-process the flatten output file in place: rename the SPDX license
 * identifier and comment out the `pragma solidity` line so the file
 * passes the "duplicate license identifier" sanity check that comes from
 * concatenating multiple files.
 *
 * Returns a summary of which rewrites happened so the caller can log them.
 * Missing or empty files are reported but not treated as errors — the menu
 * previously polled for the file to be non-empty and surfaced a warning
 * when the rename had nothing to do.
 */
export const renameFlattenedLicenseAndPragma = (filePath: string): { spdx: boolean; pragma: boolean } => {
    if (!fs.existsSync(filePath)) return { spdx: false, pragma: false }
    let content = fs.readFileSync(filePath, 'utf8')
    if (content.length === 0) return { spdx: false, pragma: false }
    let spdx = false
    let pragma = false
    if (content.includes('SPDX-License-Identifier')) {
        content = content.replace('SPDX-License-Identifier', 'SPDX-License-DISABLED-Identifier')
        spdx = true
    }
    if (content.includes('pragma solidity')) {
        content = content.replace('pragma solidity', '// pragma solidity')
        pragma = true
    }
    fs.writeFileSync(filePath, content)
    return { spdx, pragma }
}

/**
 * Run `npx hardhat flatten` for the given contract (or for every contract)
 * and optionally rewrite the SPDX/license/pragma headers in the output.
 *
 * Returns `true` when the command was invoked, `false` when validation
 * failed (no `contracts/` directory, unknown contract name, …) so the CLI
 * flag dispatcher can warn instead of throwing. The flatten output is
 * written under the address book config's `contractsFlattenPath`, which
 * defaults to `contractsFlatten/`.
 */
export const runFlattenContract = async (
    options: IFlattenContractOptions,
    userConfig?: { addressBook?: any }
): Promise<boolean> => {
    if (!options || !options.contractName) return false

    const addressBookConfig = getAddressBookConfig(userConfig)

    const isAll = options.contractName === FLATTEN_ALL_KEYWORD
    let filePath: string | undefined
    if (!isAll) {
        filePath = resolveContractFile(options.contractName)
        if (!filePath) {
            console.log(
                '\x1b[33m%s\x1b[0m',
                `Contract "${options.contractName}" was not found under contracts/. ` +
                    `Pass "${FLATTEN_ALL_KEYWORD}" to flatten every contract, or a contract name that matches a file under contracts/.`
            )
            return false
        }
    }

    const outputPath = resolveFlattenOutputPath(
        filePath,
        addressBookConfig.contractsFlattenPath,
        addressBookConfig.contractsFlattenPrefix
    )
    if (!fs.existsSync(addressBookConfig.contractsFlattenPath)) {
        fs.mkdirSync(addressBookConfig.contractsFlattenPath)
    }

    const command = buildFlattenCommand(filePath)
    // `thenExit=false` so the post-processing has a chance to rewrite the
    // output file before the Node process exits — matches the menu flow.
    await runCommand(command, '', ` > ${outputPath}`, false)

    if (options.renameLicenseIdentifier) {
        // Poll briefly so the redirected file has flushed before we read it.
        for (let attempt = 0; attempt < 10; attempt++) {
            if (fs.existsSync(outputPath) && fs.readFileSync(outputPath, 'utf8').length > 0) break
            await waitForReadability(250)
        }
        renameFlattenedLicenseAndPragma(outputPath)
    }
    return true
}

/**
 * Render the value consumed by `--flattenContract` so the printed CLI
 * command round-trips through {@link parseFlattenContractFlag}.
 *
 * Shape: `<contractName>[:renameLicense]`. The `:renameLicense` suffix is
 * only emitted when the rename was requested so the bare flag
 * (`--flattenContract MyToken`) stays as compact as possible for the common
 * case.
 */
export const formatFlattenContractFlag = (
    contractName: string,
    renameLicenseIdentifier: boolean = false
): string => {
    if (!renameLicenseIdentifier) return contractName
    return `${contractName}:${FLATTEN_RENAME_LICENSE_SUFFIX}`
}

/**
 * Parse the `--flattenContract` CLI flag value.
 *
 * Returns `undefined` when the value is missing or empty so `serveCli`
 * can fall through to the next flag. Recognises the `:renameLicense`
 * suffix produced by {@link formatFlattenContractFlag} and converts it to
 * a boolean so callers do not have to string-compare themselves.
 */
export const parseFlattenContractFlag = (
    value: string | undefined
): { contractName: string; renameLicenseIdentifier: boolean } | undefined => {
    if (typeof value !== 'string' || value.trim() === '') return undefined
    const parts = value.split(':')
    const contractName = parts[0]
    if (!contractName) return undefined
    const renameLicenseIdentifier = parts.slice(1).includes(FLATTEN_RENAME_LICENSE_SUFFIX)
    return { contractName, renameLicenseIdentifier }
}
