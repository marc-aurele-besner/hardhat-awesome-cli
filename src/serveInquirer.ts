import {
    addCustomCommand,
    formatAddCustomCommandFlag,
    loadCustomCommands,
    parseAddCustomCommandFlag,
    removeCustomCommand,
    runCustomCommand
} from './buildCustomCommands.ts'
import { parseAddDeploymentScriptFlag } from './buildDeploymentContract.ts'
import { addExcludedFiles, removeExcludedFiles } from './buildExcludedFile.ts'
import { parseFlattenContractFlag, runFlattenContract } from './buildFlattenContracts.ts'
import buildFoundrySetting, { installFoundryTestUtility } from './buildFoundrySetting.ts'
import {
    addActivatedChain,
    formatAddCustomChainFlag,
    parseAddCustomChainFlag,
    removeActivatedChain,
    runAddCustomChain
} from './buildNetworks.ts'
import { parseVerifyContractFlag, runVerifyContract } from './buildVerifyContract.ts'
import { buildWorkflowsFromCommand } from './buildWorkflows.ts'
import { runAddDeploymentScript } from './menus/deploymentScripts.ts'
import serveInquirer from './menus/mainMenu.ts'
import { parseAddCustomMockContractFlag, runAddCustomMockContract } from './menus/mockContracts.ts'
import { serveAccountBalance } from './menus/network.ts'
import detectPackage from './packageInstaller.ts'
import type { IHreContext } from './types.ts'
import { displayFinalCliCommand } from './utils.ts'

/**
 * Flag-parsing helpers that other modules (and the tests) import from here.
 * Re-exported so `serveInquirer.ts` stays the stable public surface it has
 * always been while the implementations live with the menus they back.
 */
export { formatAddCustomMockContractFlag, parseAddCustomMockContractFlag } from './menus/mockContracts.ts'

/**
 * Raw option strings accepted by the `cli` Hardhat task. All fields default
 * to the empty string at the task-definition site; boolean-shaped flags like
 * `--addFoundry` are compared against `'true'` / `'yes'`. Keeping the shape
 * deliberately narrow means we never need `any` to index into `args`.
 */
interface ICliArgs {
    excludeTestFile?: string
    excludeTestDirectory?: string
    excludeScriptFile?: string
    excludeScriptDirectory?: string
    excludeContractFile?: string
    excludeContractDirectory?: string
    addHardhatPlugin?: string
    removeHardhatPlugin?: string
    addGithubTestWorkflow?: string
    addFoundry?: string
    addFoundryTestUtility?: string
    addActivatedChain?: string
    addCustomChain?: string
    removeActivatedChain?: string
    getAccountBalance?: string
    addCustomMockContract?: string
    addDeploymentScript?: string
    runCustomCommand?: string
    addCustomCommand?: string
    removeCustomCommand?: string
    verifyContract?: string
    flattenContract?: string
}

/**
 * Predicate that narrows an optional-string CLI flag to a non-empty string.
 * The plain `value !== ''` check returns `true` even for `undefined`, so we
 * need the explicit type guard to keep `noUncheckedIndexedAccess` happy.
 */
const isPresentString = (value: string | undefined): value is string => typeof value === 'string' && value !== ''

/**
 * Boolean-shaped flags (`--addFoundry`, `--getAccountBalance`, ...) are
 * passed as strings by the task runner. Treat anything other than `''`,
 * `'false'`, or `'no'` as affirmative to mirror the old `=== true ||
 * === 'true' || === 'yes'` behaviour.
 */
const isAffirmativeString = (value: string | undefined): value is string => {
    if (!isPresentString(value)) return false
    return value !== 'false' && value !== 'no'
}

const serveCli = async (args: ICliArgs, env: IHreContext) => {
    switch (true) {
        case isPresentString(args.excludeTestFile):
            return removeExcludedFiles('test', args.excludeTestFile)
        case isPresentString(args.excludeTestDirectory):
            return addExcludedFiles('test', args.excludeTestDirectory, args.excludeTestDirectory, 'directory')
        case isPresentString(args.excludeScriptFile):
            return removeExcludedFiles('scripts', args.excludeScriptFile)
        case isPresentString(args.excludeScriptDirectory):
            return addExcludedFiles('scripts', args.excludeScriptDirectory, args.excludeScriptDirectory, 'directory')
        case isPresentString(args.excludeContractFile):
            return removeExcludedFiles('contracts', args.excludeContractFile)
        case isPresentString(args.excludeContractDirectory):
            return addExcludedFiles(
                'contracts',
                args.excludeContractDirectory,
                args.excludeContractDirectory,
                'directory'
            )
        case isPresentString(args.addHardhatPlugin):
            return detectPackage(args.addHardhatPlugin, true, false, true)
        case isPresentString(args.removeHardhatPlugin):
            return detectPackage(args.removeHardhatPlugin, false, true, true)
        case isPresentString(args.addGithubTestWorkflow):
            return buildWorkflowsFromCommand(args.addGithubTestWorkflow)
        case isAffirmativeString(args.addFoundry):
            return buildFoundrySetting()
        case isAffirmativeString(args.addFoundryTestUtility):
            return installFoundryTestUtility()
        case isPresentString(args.addActivatedChain):
            return addActivatedChain(args.addActivatedChain)
        case isPresentString(args.addCustomChain): {
            const parsed = parseAddCustomChainFlag(args.addCustomChain)
            if (!parsed) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Invalid --addCustomChain value. Expected a JSON object with at least "name" (string) and "chainId" (positive integer).'
                )
                return
            }
            const added = await runAddCustomChain(parsed)
            if (added) displayFinalCliCommand('addCustomChain', formatAddCustomChainFlag(parsed))
            return
        }
        case isPresentString(args.removeActivatedChain):
            return removeActivatedChain(args.removeActivatedChain)
        case isAffirmativeString(args.getAccountBalance):
            return serveAccountBalance(env)
        case isPresentString(args.addCustomMockContract): {
            const parsed = parseAddCustomMockContractFlag(args.addCustomMockContract)
            if (!parsed) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Invalid --addCustomMockContract value. Expected "<registryName>:<customName>:<constructorName>:<constructorSymbol>".'
                )
                return
            }
            return runAddCustomMockContract(
                parsed.registryName,
                parsed.customName,
                parsed.constructorName,
                parsed.constructorSymbol
            )
        }
        case isPresentString(args.addDeploymentScript): {
            const parsed = parseAddDeploymentScriptFlag(args.addDeploymentScript)
            if (!parsed) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Invalid --addDeploymentScript value. Expected "<contractName>[:<constructorArg1>:<constructorArg2>:...]".'
                )
                return
            }
            return runAddDeploymentScript(parsed.contractName, parsed.constructorArgs)
        }
        case isPresentString(args.runCustomCommand): {
            const entries = await loadCustomCommands()
            const target = entries.find((entry) => entry.name === args.runCustomCommand)
            if (!target) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    `Custom command "${args.runCustomCommand}" was not found in hardhat-awesome-cli.json.`
                )
                return
            }
            return runCustomCommand(target)
        }
        case isPresentString(args.addCustomCommand): {
            const parsed = parseAddCustomCommandFlag(args.addCustomCommand)
            if (!parsed) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Invalid --addCustomCommand value. Expected a JSON object {"name":"...","description":"...","kind":"shell|hardhat","command":"..."}.'
                )
                return
            }
            const added = await addCustomCommand(parsed)
            if (!added) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    `A custom command named "${parsed.name}" already exists, or the entry was invalid.`
                )
                return
            }
            return displayFinalCliCommand('addCustomCommand', formatAddCustomCommandFlag(parsed))
        }
        case isPresentString(args.removeCustomCommand): {
            const removed = await removeCustomCommand(args.removeCustomCommand)
            if (!removed) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    `Custom command "${args.removeCustomCommand}" was not found in hardhat-awesome-cli.json.`
                )
                return
            }
            return displayFinalCliCommand('removeCustomCommand', args.removeCustomCommand)
        }
        case isPresentString(args.verifyContract): {
            const parsed = parseVerifyContractFlag(args.verifyContract)
            if (!parsed) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Invalid --verifyContract value. Expected "<network>:<contractNameOrAddress>[:<arg1>:<arg2>:...].'
                )
                return
            }
            return runVerifyContract({
                network: parsed.network,
                contractNameOrAddress: parsed.contractNameOrAddress,
                constructorArgs: parsed.constructorArgs
            })
        }
        case isPresentString(args.flattenContract): {
            const parsed = parseFlattenContractFlag(args.flattenContract)
            if (!parsed) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Invalid --flattenContract value. Expected a contract name, or "all" to flatten every contract, optionally followed by ":renameLicense".'
                )
                return
            }
            return runFlattenContract(
                {
                    contractName: parsed.contractName,
                    renameLicenseIdentifier: parsed.renameLicenseIdentifier
                },
                env.userConfig
            )
        }
        default:
            return serveInquirer(env)
    }
}

export default serveCli
