import { spawn } from 'child_process'
import fs from 'fs'
import { exit } from 'process'

import { getAddressBookConfig } from './config.ts'
import type { FunctionSelector, IContractAddressDeployed, IInquirerListField } from './types.ts'

let contractsAddressDeployed: IContractAddressDeployed[] = []
let contractsAddressDeployedHistory: IContractAddressDeployed[] = []

const addressBookConfig = getAddressBookConfig()

export const inquirerRunTests: IInquirerListField = { name: 'Run tests' }
if (!fs.existsSync('test')) inquirerRunTests.disabled = "We can't run tests without a test/ directory"
export const inquirerRunScripts: IInquirerListField = { name: 'Run scripts' }
if (!fs.existsSync('scripts')) inquirerRunScripts.disabled = "We can't run scripts without a scripts/ directory"
export const inquirerFlattenContracts: IInquirerListField = { name: 'Flatten contracts' }
export const inquirerRunMockContractCreator: IInquirerListField = { name: 'Create Mock contracts' }
export let inquirerRunFoundryTest: string = ''
if (!fs.existsSync('contracts')) {
    inquirerFlattenContracts.disabled = "We can't flatten contracts without a contracts/ directory"
    inquirerRunMockContractCreator.disabled = "We can't create Mock contracts without a contracts/ directory"
}
if (fs.existsSync('contracts/test') && fs.existsSync('foundry.toml')) {
    inquirerRunFoundryTest = 'Run Foundry Forge tests'
}
export let inquirerFileContractsAddressDeployed: IInquirerListField | string = {
    name: 'Get the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)) {
    const rawdata: any = fs.readFileSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)
    try {
        contractsAddressDeployed = JSON.parse(rawdata)
        inquirerFileContractsAddressDeployed = 'Get the previously deployed contracts address'
    } catch {}
}
export let inquirerFileContractsAddressDeployedHistory: IInquirerListField | string = {
    name: 'Get all the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory)) {
    try {
        const rawdata: any = fs.readFileSync(
            addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory
        )
        contractsAddressDeployedHistory = JSON.parse(rawdata)
        inquirerFileContractsAddressDeployedHistory = 'Get all the previously deployed contracts address'
    } catch {}
}

export const buildCommand = (command: string, firstCommand: string, commandFlags: string) => {
    let commandToRun = command + commandFlags
    if (firstCommand) {
        commandToRun = firstCommand + commandFlags + ' && ' + commandToRun
    }
    return commandToRun
}

/**
 * Run a shell command and resolve once the child process exits.
 *
 * `thenExit=true` (the default for backwards compatibility) terminates the
 * current Node process after the child exits, mirroring the previous fire-and-
 * exit behaviour. `thenExit=false` keeps the process alive so callers can chain
 * follow-up work; in that case the returned promise only resolves after the
 * child has actually exited, replacing the `sleep(N)` calls that used to mask
 * the spawn.
 */
export const runCommand = async (
    command: string,
    firstCommand: string,
    commandFlags: string,
    thenExit: boolean = true
): Promise<void> => {
    const commandToRun = buildCommand(command, firstCommand, commandFlags)
    console.log('\x1b[33m%s\x1b[0m', 'Command to run: ', '\x1b[97m\x1b[0m', commandToRun)
    console.log(`Please wait...
`)
    await new Promise<void>((resolve) => {
        const runSpawn = spawn(commandToRun, {
            stdio: 'inherit',
            shell: true
        })
        runSpawn.on('exit', (code) => {
            resolve()
            if (thenExit) exit(typeof code === 'number' ? code : 0)
        })
    })
}

/**
 * Build the `npx hardhat cli --flagName value` command line that reproduces
 * the current menu selection, so the user can skip the interactive prompts
 * next time. When `value` is an array every entry is appended as its own
 * `--flagName <entry>` pair so the CLI accepts the full batch.
 */
export const buildFinalCliCommand = (flagName: string, value: string | string[]): string => {
    const values = Array.isArray(value) ? value : [value]
    return ['npx hardhat cli', ...values.map((entry) => `--${flagName} ${entry}`)].join(' ')
}

/**
 * Print the equivalent CLI command for a menu selection. Used by the
 * settings flows (exclude files, install/uninstall plugins, create
 * workflows, add/remove chains, ...) to teach users how to skip the
 * interactive prompts next time. When `value` is omitted, the flag is
 * rendered as a boolean (e.g. `--addFoundry`).
 */
export const displayFinalCliCommand = (flagName: string, value?: string | string[]): string => {
    const command = value === undefined ? `npx hardhat cli --${flagName}` : buildFinalCliCommand(flagName, value)
    console.log('\x1b[33m%s\x1b[0m', 'Equivalent CLI command: ', '\x1b[97m\x1b[0m', command)
    return command
}

/**
 * List every public and external function of a compiled contract with its
 * 4 bytes function selector, sorted by selector (ascending).
 *
 * Requires `hre.ethers` (`@nomicfoundation/hardhat-ethers`) to be available,
 * and the contract to be compiled. Both ethers v6 (`fragment.selector`) and
 * ethers v5 (`ethers.utils.id(signature)`) are supported.
 *
 * @param hre Hardhat Runtime Environment
 * @param contractName Name of the contract to inspect (e.g. `MockERC20`)
 * @returns `{ name, selector }` for each function, ordered by selector
 */
export const listAllFunctionSelectors = async (hre: any, contractName: string) => {
    const factory = await hre.ethers.getContractFactory(contractName)

    const functions: FunctionSelector[] = []
    for (const fragment of factory.interface.fragments) {
        if (fragment.type !== 'function') continue
        // `sighash` is the canonical signature (`transfer(address,uint256)`)
        // in both ethers v5 and v6.
        const name = fragment.format('sighash')
        functions.push({
            name,
            // ethers v6 computes the selector on the fragment, ethers v5 does not.
            selector: fragment.selector ?? hre.ethers.utils.id(name).substring(0, 10)
        })
    }
    functions.sort((a, b) => {
        return a.selector.localeCompare(b.selector)
    })
    return functions
}

/**
 * Raw `setTimeout`-backed delay. Kept for backward compatibility; new code that
 * only wants a brief pause for human readability should call `waitForReadability`
 * instead, which honours the `AWESOME_CLI_PAUSE_MS` / `AWESOME_CLI_NO_PAUSE`
 * environment variables so users can skip or shorten the pause.
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Sentinel returned by {@link redactSecret} when the secret is hidden.
 *
 * Used by callers that want to detect a redacted value (for example, to skip
 * printing a placeholder RPC URL alongside a placeholder key) without having to
 * know the masking format itself.
 */
export const REDACTED_SECRET = '****'

/**
 * Mask a secret (private key, mnemonic, API token) before it reaches the
 * terminal. By default the value is replaced with `REDACTED_SECRET` and a
 * short suffix taken from the end of the input, so a user can still tell two
 * different keys apart without seeing them in full.
 *
 * - Empty / non-string inputs return an empty string.
 * - Inputs of 4 characters or fewer are fully masked, since no safe suffix is
 *   long enough to be useful.
 * - Setting `AWESOME_CLI_SHOW_SECRETS=1` opts in to returning the original
 *   value. This is intentionally opt-in: any code path that prints the result
 *   of this helper should be safe even without the variable.
 */
export const redactSecret = (value: string): string => {
    if (typeof value !== 'string' || value.length === 0) return ''
    if (process.env.AWESOME_CLI_SHOW_SECRETS === '1') return value
    if (value.length <= 4) return REDACTED_SECRET
    return REDACTED_SECRET + value.slice(-4)
}

const DEFAULT_READABILITY_PAUSE_MS = 250

/**
 * Resolve after a short, optional pause used to let the terminal settle before
 * the next menu step paints over the previous output.
 *
 * The duration is read from `AWESOME_CLI_PAUSE_MS` (default 250ms). Set
 * `AWESOME_CLI_NO_PAUSE=1` to skip the pause entirely, which is useful in CI
 * or non-interactive contexts. Pauses are never longer than 5s — anything
 * genuinely waiting for a child process should `await runCommand` instead.
 */
export const waitForReadability = (ms?: number): Promise<void> => {
    if (process.env.AWESOME_CLI_NO_PAUSE === '1') return Promise.resolve()
    const effective = Math.min(Math.max(ms ?? DEFAULT_READABILITY_PAUSE_MS, 0), 5000)
    return sleep(effective).then(() => undefined)
}

/**
 * Convert a mock-contract template written in TypeScript into the equivalent
 * CommonJS JavaScript that ships alongside `hardhat.config.js` projects.
 *
 * The mock template language is small and well-controlled:
 * - `import { a, b } from 'mod'` becomes `const { a, b } = require('mod')`
 * - `// @ts-ignore-next-line` directives are dropped (they only exist to
 *   silence the TS compiler over the `hardhat` module).
 * - `: any` type annotations on `let`/`const` declarations are stripped.
 * - `main().catch(...)` is rewritten so the script also exits cleanly on
 *   success, matching the original hand-maintained JS templates.
 *
 * This keeps a single source of truth (`src/mockContracts/scripts/*.ts` and
 * `src/mockContracts/test/*.ts`) while still serving `hardhat.config.js`
 * consumers the language they prefer (closes #159).
 */
export const transformTsToJs = (source: string): string => {
    const lines = source.split('\n')
    const out: string[] = []
    for (const line of lines) {
        // Drop `// @ts-ignore-next-line` directives — they only exist to
        // silence the TS compiler over the `hardhat` module.
        if (/^\s*\/\/\s*@ts-ignore-next-line\s*$/.test(line)) continue

        // `import { a, b } from 'mod'` → `const { a, b } = require('mod')`.
        // We only consume the named-import form these templates use.
        const importMatch = line.match(/^(\s*)import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*$/)
        if (importMatch) {
            const indent = importMatch[1]
            const names = importMatch[2]
                .split(',')
                .map((name) => name.trim())
                .filter((name) => name.length > 0)
            out.push(`${indent}const { ${names.join(', ')} } = require('${importMatch[3]}')`)
            continue
        }

        // Strip `: any` type annotations on top-level `let`/`const`/`var`
        // declarations. The mock templates only use `: any`, no other types.
        const anyAnnotation = line.replace(/^(\s*(?:let|const|var)\s+[A-Za-z_$][\w$]*)\s*:\s*any\b/, '$1')
        out.push(anyAnnotation)
    }

    let js = out.join('\n')

    // Ensure the script exits cleanly on success. The TS templates use
    // `main().catch(...)` with `process.exitCode = 1`; the JS-equivalent
    // generated file needs an explicit `process.exit(0)` on success.
    js = js.replace(/main\(\)\s*\.catch\s*\(/, 'main()\n    .then(() => process.exit(0))\n    .catch(')

    return js
}
