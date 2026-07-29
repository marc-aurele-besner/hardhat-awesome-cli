import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { DefaultGithubWorkflowsList } from './config.ts'
import detectPackage from './packageInstaller.ts'
import type { IDefaultGithubWorkflowsList } from './types.ts'

/**
 * Locate the packaged `githubWorkflows` directory holding the YAML templates.
 *
 * The previous implementation derived the path from `require.main.filename`,
 * which only resolved correctly when the CLI was installed under
 * `node_modules/hardhat-awesome-cli` and was the entry point of the process.
 * Running the CLI from the package root (tests, `bun --cwd …`, a dev
 * eslint scratch) broke the lookup silently and the menu printed
 * "no workflows created" without copying anything.
 *
 * `require` does not exist in an ES module, so we resolve relative to this
 * file instead. The two candidates cover running from `src/` (tests via
 * `tsx/cjs`) and from `dist/src/` (the compiled package).
 */
const resolveWorkflowsPath = (): string | undefined => {
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const candidates = [
        path.join(currentDir, 'githubWorkflows'), // running from src/
        path.join(currentDir, '../../src/githubWorkflows') // running from dist/src/
    ]
    return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'hardhat-npm.yml')))
}

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
    const packageRootPath = resolveWorkflowsPath()
    if (packageRootPath === undefined) {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'Could not locate the packaged GitHub workflow templates. ' +
                'Reinstall hardhat-awesome-cli to restore them.'
        )
        return
    }
    const sourcePath = path.join(packageRootPath, workflowToAdd.file + '.yml')
    if (!fs.existsSync(sourcePath)) {
        console.log('\x1b[33m%s\x1b[0m', 'Unknown workflow template: ' + workflowToAdd.file + '.yml')
        return
    }
    const destinationPath = path.join('.github/workflows', workflowToAdd.file + '.yml')
    if (!fs.existsSync(destinationPath)) {
        fs.copyFileSync(sourcePath, destinationPath)
        console.log(
            '\x1b[32m%s\x1b[0m',
            'Creating workflow ' + workflowToAdd.title + ' in .github/workflows/' + workflowToAdd.file + '.yml'
        )
        if (workflowToAdd.requirement !== undefined) {
            if (workflowToAdd.requirement.length > 0) {
                for (const packageRequire of workflowToAdd.requirement) {
                    await detectPackage(packageRequire, true, false, true)
                }
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

export default buildWorkflows
