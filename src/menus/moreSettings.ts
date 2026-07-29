import inquirer from 'inquirer'

import buildFoundrySetting, { installFoundryTestUtility } from '../buildFoundrySetting.ts'
import buildWorkflows from '../buildWorkflows.ts'
import { DefaultGithubWorkflowsGroup, DefaultGithubWorkflowsList } from '../config.ts'
import type { IDefaultGithubWorkflowsList, IHreContext } from '../types.ts'
import { displayFinalCliCommand, waitForReadability } from '../utils.ts'
import { serveCustomCommandManager } from './customCommands.ts'
import { servePackageInstaller, servePackageUninstaller } from './plugins.ts'
import { serveFunctionListSelector } from './runners.ts'
import { serveExcludeFileSelector } from './settings.ts'
import type { MoreSettingsAnswer, WorkflowChoiceAnswer } from './types.ts'

export const serveWorkflowBuilder = async () => {
    const workflowsList: string[] = []
    let workflowToAdd: IDefaultGithubWorkflowsList | undefined
    DefaultGithubWorkflowsGroup.map((workflowGroup: string) => {
        DefaultGithubWorkflowsList.filter(
            (workflow: IDefaultGithubWorkflowsList) => workflow.group === workflowGroup
        ).map((workflow: IDefaultGithubWorkflowsList) => {
            workflowsList.push(workflow.title)
        })
    })
    const workflowSelected: WorkflowChoiceAnswer = await inquirer.prompt<WorkflowChoiceAnswer>([
        {
            type: 'list',
            name: 'workflowType',
            message: 'Select a workflow to create',
            choices: workflowsList
        }
    ])
    DefaultGithubWorkflowsList.map((workflow: IDefaultGithubWorkflowsList) => {
        if (workflow.title === workflowSelected.workflowType) workflowToAdd = workflow
    })
    if (workflowToAdd !== undefined) {
        await buildWorkflows(workflowToAdd)
        displayFinalCliCommand('addGithubTestWorkflow', workflowToAdd.file)
        await waitForReadability()
    }
}

export const serveMoreSettingSelector = async (env: IHreContext) => {
    const moreSettingsSelected: MoreSettingsAnswer = await inquirer.prompt<MoreSettingsAnswer>([
        {
            type: 'list',
            name: 'moreSettings',
            message: 'Select a mock contract',
            choices: [
                'Exclude test file from the tests selection list',
                'Exclude script file from the scripts selection list',
                'Exclude contract file from the contract selection list',
                new inquirer.Separator(),
                'List function from a contract by function selector',
                new inquirer.Separator(),
                'Add other Hardhat plugins',
                'Remove other Hardhat plugins',
                new inquirer.Separator(),
                'Create Github test workflows',
                'Create Foundry settings, remapping and test utilities',
                'Add foundry-test-utility (npm package for shared Forge mocks & utilities)',
                new inquirer.Separator(),
                'Manage custom commands'
            ]
        }
    ])
    if (moreSettingsSelected.moreSettings === 'Exclude test file from the tests selection list')
        await serveExcludeFileSelector('test')
    if (moreSettingsSelected.moreSettings === 'Exclude script file from the scripts selection list')
        await serveExcludeFileSelector('scripts')
    if (moreSettingsSelected.moreSettings === 'Exclude contract file from the contract selection list')
        await serveExcludeFileSelector('contracts')
    if (moreSettingsSelected.moreSettings === 'List function from a contract by function selector')
        await serveFunctionListSelector(env)
    if (moreSettingsSelected.moreSettings === 'Add other Hardhat plugins') await servePackageInstaller()
    if (moreSettingsSelected.moreSettings === 'Remove other Hardhat plugins') await servePackageUninstaller()
    if (moreSettingsSelected.moreSettings === 'Create Github test workflows') await serveWorkflowBuilder()
    if (moreSettingsSelected.moreSettings === 'Create Foundry settings, remapping and test utilities') {
        await buildFoundrySetting()
        displayFinalCliCommand('addFoundry')
    }
    if (
        moreSettingsSelected.moreSettings ===
        'Add foundry-test-utility (npm package for shared Forge mocks & utilities)'
    ) {
        await installFoundryTestUtility()
        displayFinalCliCommand('addFoundryTestUtility')
    }
    if (moreSettingsSelected.moreSettings === 'Manage custom commands') {
        await serveCustomCommandManager()
    }
}
