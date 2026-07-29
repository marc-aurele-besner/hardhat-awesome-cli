import inquirer from 'inquirer'

import { loadCustomCommands } from '../buildCustomCommands.ts'
import detectPackage from '../packageInstaller.ts'
import type { IHreContext, IInquirerListField } from '../types.ts'
import {
    inquirerFileContractsAddressDeployed,
    inquirerFileContractsAddressDeployedHistory,
    inquirerFlattenContracts,
    inquirerRunFoundryTest,
    inquirerRunMockContractCreator,
    inquirerRunScripts,
    inquirerRunTests
} from '../utils.ts'
import { serveRunCustomCommandSelector } from './customCommands.ts'
import { serveDeploymentContractCreatorSelector } from './deploymentScripts.ts'
import { serveMockContractCreatorSelector } from './mockContracts.ts'
import { serveMoreSettingSelector } from './moreSettings.ts'
import { serveAccountBalance } from './network.ts'
import {
    serveFlattenContractsSelector,
    serveFoundryTestSelector,
    serveScriptSelector,
    serveTestSelector
} from './runners.ts'
import { serveSettingSelector } from './settings.ts'
import type { MainMenuAnswer } from './types.ts'
import { serveVerifyContractSelector } from './verifyContract.ts'

/**
 * Top-level interactive menu. Every entry delegates to a focused module in
 * `src/menus/`; this file only owns the banner, the option list, and the
 * dispatch table so adding a menu entry stays a two-line change.
 */
const serveInquirer = async (env: IHreContext) => {
    console.log(
        `
`,
        '\x1b[34m',
        'Welcome to',
        '\x1b[32m',
        `
 .d8b.  db   d8b   db d88888b .d8888.  .d88b.  .88b  d88. d88888b      .o88b. db      d888888b
d8' '8b 88   I8I   88 88'     88'  YP .8P  Y8. 88'YbdP'88 88'         d8P  Y8 88        '88'
88ooo88 88   I8I   88 88ooooo '8bo.   88    88 88  88  88 88ooooo     8P      88         88
88~~~88 Y8   I8I   88 88~~~~~   'Y8b. 88    88 88  88  88 88~~~~~     8b      88         88
88   88 '8b d8'8b d8' 88.     db   8D '8b  d8' 88  88  88 88.         Y8b  d8 88booo.   .88.
YP   YP  '8b8' '8d8'  Y88888P '8888Y'  'Y88P'  YP  YP  YP Y88888P      'Y88P' Y88888P Y888888P
`
    )
    const buildMainOptions: (string | IInquirerListField | InstanceType<typeof inquirer.Separator>)[] = [
        inquirerRunTests,
        inquirerRunScripts,
        inquirerFlattenContracts
    ]
    if (inquirerRunFoundryTest) buildMainOptions.push(inquirerRunFoundryTest)
    if (inquirerRunTests.name === 'Run tests' && inquirerRunScripts.name === 'Run scripts')
        buildMainOptions.push('Select scripts and tests to run')
    const solidityCoverageDetected = await detectPackage('solidity-coverage', false, false, false)
    if (solidityCoverageDetected) buildMainOptions.push('Run coverage tests')
    // Surface the custom-command runner only when the user actually has
    // something to run — otherwise the menu picks up a no-op entry that
    // does nothing but print "no commands defined".
    const customCommands = await loadCustomCommands()
    if (customCommands.length > 0) buildMainOptions.push('Run a custom command')
    buildMainOptions.push(
        'Setup chains, RPC and accounts',
        'More settings',
        new inquirer.Separator(),
        // 'Deploy all contracts and run tests',
        inquirerRunMockContractCreator,
        'Create deployment scripts',
        'Verify a contract',
        'Get account balance',
        new inquirer.Separator(),
        inquirerFileContractsAddressDeployed,
        inquirerFileContractsAddressDeployedHistory,
        new inquirer.Separator()
    )
    const answers: MainMenuAnswer = await inquirer.prompt<MainMenuAnswer>([
        {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: buildMainOptions
        }
    ])
    if (answers.action === 'Run tests') await serveTestSelector(env, 'npx hardhat test', '')
    if (answers.action === 'Run scripts') await serveScriptSelector(env, null)
    if (answers.action === 'Flatten contracts') await serveFlattenContractsSelector(env)
    if (answers.action === 'Run Foundry Forge tests') await serveFoundryTestSelector(env, 'forge test')
    if (answers.action === 'Select scripts and tests to run') await serveScriptSelector(env, serveTestSelector)
    if (answers.action === 'Run coverage tests') await serveTestSelector(env, 'npx hardhat coverage', '')
    if (answers.action === 'Setup chains, RPC and accounts') await serveSettingSelector(env)
    if (answers.action === 'More settings') await serveMoreSettingSelector(env)
    if (answers.action === 'Create Mock contracts') await serveMockContractCreatorSelector()
    if (answers.action === 'Create deployment scripts') await serveDeploymentContractCreatorSelector()
    if (answers.action === 'Verify a contract') await serveVerifyContractSelector(env)
    if (answers.action === 'Get account balance') await serveAccountBalance(env)
    if (answers.action === 'Run a custom command') await serveRunCustomCommandSelector()
}

export default serveInquirer
