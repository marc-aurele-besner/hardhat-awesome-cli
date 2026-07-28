import { task } from 'hardhat/config'
import { definePlugin } from 'hardhat/plugins'

import type { NewTaskDefinition } from 'hardhat/types/tasks'
import type { HardhatPlugin } from 'hardhat/types/plugins'

import { resolveUserConfigHandler } from './hook-handlers.js'

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
        name: 'excludeScriptFile',
        description: 'Exclude script file from the scripts selection list',
        defaultValue: ''
    })
    .addOption({
        name: 'excludeContractFile',
        description: 'Exclude contract file from the contract selection list',
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
    // The action must be a lazy import so plugins stay load-order safe.
    .setAction(() => import('./cli-action.js'))
    .build()

const hardhatAwesomeCliPlugin: HardhatPlugin = definePlugin({
    id: 'hardhat-awesome-cli',
    npmPackage: 'hardhat-awesome-cli',
    tasks: [cliTask],
    hookHandlers: {
        config: async () => {
            const mod = await import('./hook-handlers.js')
            return { default: mod.default }
        }
    }
})

export default hardhatAwesomeCliPlugin
export { resolveUserConfigHandler } from './hook-handlers.js'
export { AwesomeAddressBook } from '../AwesomeAddressBook.js'
export { FunctionList } from '../functionList.js'