import { task } from 'hardhat/config'
import { definePlugin } from 'hardhat/plugins'

import type { NewTaskDefinition } from 'hardhat/types/tasks'
import type { HardhatPlugin } from 'hardhat/types/plugins'

import { resolveUserConfigHandler } from './hook-handlers.ts'

/**
 * Hardhat 3 plugin entry. The plugin:
 *   - resolves `paths.cli` from the user config into the resolved config
 *     (handled by the `config.resolveUserConfig` hook)
 *   - registers a top-level `cli` task whose action drives the inquirer UI
 *
 * Side-effect-based plugin registration is gone in Hardhat 3 — consumers
 * import this module and add it to their `plugins` array in `hardhat.config.ts`.
 */
const cliTask: NewTaskDefinition = task('cli', 'Easy command line interface to use hardhat')
    .addOption({
        name: 'excludeTestFile',
        description: 'Exclude test file from the tests selection list',
        defaultValue: ''
    })
    .addOption({
        name: 'excludeTestDirectory',
        description: 'Exclude test directory (and every nested file) from the tests selection list',
        defaultValue: ''
    })
    .addOption({
        name: 'excludeScriptFile',
        description: 'Exclude script file from the scripts selection list',
        defaultValue: ''
    })
    .addOption({
        name: 'excludeScriptDirectory',
        description: 'Exclude script directory (and every nested file) from the scripts selection list',
        defaultValue: ''
    })
    .addOption({
        name: 'excludeContractFile',
        description: 'Exclude contract file from the contract selection list',
        defaultValue: ''
    })
    .addOption({
        name: 'excludeContractDirectory',
        description: 'Exclude contract directory (and every nested file) from the contract selection list',
        defaultValue: ''
    })
    .addOption({
        name: 'addHardhatPlugin',
        description: 'Add other Hardhat plugins',
        defaultValue: ''
    })
    .addOption({
        name: 'removeHardhatPlugin',
        description: 'Remove other Hardhat plugins',
        defaultValue: ''
    })
    .addOption({
        name: 'addGithubTestWorkflow',
        description: 'Create Github test workflows',
        defaultValue: ''
    })
    .addOption({
        name: 'addFoundry',
        description: 'Create Foundry settings, remapping and test utilities',
        defaultValue: ''
    })
    .addOption({
        name: 'addFoundryTestUtility',
        description: 'Install the foundry-test-utility npm package and add its remapping',
        defaultValue: ''
    })
    .addOption({
        name: 'addActivatedChain',
        description: 'Add chains from the chain selection',
        defaultValue: ''
    })
    .addOption({
        name: 'removeActivatedChain',
        description: 'Remove chains from the chain selection',
        defaultValue: ''
    })
    .addOption({
        name: 'getAccountBalance',
        description: 'Get account balance',
        defaultValue: ''
    })
    .addOption({
        name: 'addDeploymentScript',
        description:
            'Scaffold a deployment script for the named contract. Pass the contract name, optionally followed by ":"-separated constructor arguments, e.g. "<ContractName>:<arg1>:<arg2>".',
        defaultValue: ''
    })
    .addOption({
        name: 'runCustomCommand',
        description: 'Run a custom command stored in hardhat-awesome-cli.json by name',
        defaultValue: ''
    })
    .addOption({
        name: 'addCustomCommand',
        description:
            'Add a custom command to hardhat-awesome-cli.json. Pass a JSON object {"name":"...","description":"...","kind":"shell|hardhat","command":"..."}.',
        defaultValue: ''
    })
    .addOption({
        name: 'removeCustomCommand',
        description: 'Remove a custom command stored in hardhat-awesome-cli.json by name',
        defaultValue: ''
    })
    .addOption({
        name: 'verifyContract',
        description:
            'Verify a deployed contract on a block explorer. Pass "<network>:<contractNameOrAddress>[:<arg1>:<arg2>:...]" — the contract name is resolved from the address book, or pass a 0x-prefixed address directly.',
        defaultValue: ''
    })
    .addOption({
        name: 'flattenContract',
        description:
            'Flatten a contract (or every contract) under contracts/. Pass a contract name (with or without the .sol extension, optionally including a sub-path), or "all" to flatten every contract. Append ":renameLicense" to also rewrite the SPDX-License-Identifier and pragma solidity in the output.',
        defaultValue: ''
    })
    // The action must be a lazy import so plugins stay load-order safe.
    .setAction(() => import('./cli-action.ts'))
    .build()

const hardhatAwesomeCliPlugin: HardhatPlugin = definePlugin({
    id: 'hardhat-awesome-cli',
    npmPackage: 'hardhat-awesome-cli',
    tasks: [cliTask],
    hookHandlers: {
        config: async () => {
            const mod = await import('./hook-handlers.ts')
            return { default: mod.default }
        }
    }
})

export default hardhatAwesomeCliPlugin
export { resolveUserConfigHandler } from './hook-handlers.ts'
export { AwesomeAddressBook } from '../AwesomeAddressBook.ts'
export { FunctionList } from '../functionList.ts'
