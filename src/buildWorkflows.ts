import fs from 'fs'
import path from 'path'

import { DefaultGithubWorkflowsList } from './config'
import detectPackage from './packageInstaller'
import { IDefaultGithubWorkflowsList } from './types'

export const buildWorkflowsFromCommand = async (workflowToAdd: string) => {
    const toAdd = DefaultGithubWorkflowsList.find((workflow) => workflow.file === workflowToAdd)
    if (toAdd !== undefined) await buildWorkflows(toAdd)
    return null
}

const buildWorkflows = async (workflowToAdd: IDefaultGithubWorkflowsList) => {
    if (fs.existsSync('.github')) {
        if (!fs.existsSync('.github/workflows')) fs.mkdirSync('.github/workflows')
    } else {
        fs.mkdirSync('.github')
        fs.mkdirSync('.github/workflows')
    }
    if (require && require.main) {
        const packageRootPath = path.join(
            path.dirname(require.main.filename),
            '../../../hardhat-awesome-cli/src/githubWorkflows'
        )
        if (fs.existsSync(packageRootPath + '/' + workflowToAdd.file + '.yml')) {
            if (!fs.existsSync('.github/workflows/' + workflowToAdd.file + '.yml')) {
                fs.copyFileSync(
                    packageRootPath + '/' + workflowToAdd.file + '.yml',
                    '.github/workflows/' + workflowToAdd.file + '.yml'
                )

                console.log(
                    '\x1b[32m%s\x1b[0m',
                    'Creating workflow ' + workflowToAdd.title + ' in .github/workflows/' + workflowToAdd.file + '.yml'
                )
                if (workflowToAdd.requirement !== undefined) {
                    if (workflowToAdd.requirement.length > 0) {
                        workflowToAdd.requirement.forEach(async (packageRequire) => {
                            await detectPackage(packageRequire, true, false, true)
                        })
                    }
                }
            } else {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'The workflow ' +
                        workflowToAdd.title +
                        ' already exists at .github/workflows/' +
                        workflowToAdd.file +
                        '.yml'
                )
            }
        }
    }
}

export default buildWorkflows
