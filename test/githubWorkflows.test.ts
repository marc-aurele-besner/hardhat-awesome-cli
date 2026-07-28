import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import { DefaultGithubWorkflowsList } from '../src/config.ts'
import type { IDefaultGithubWorkflowsList } from '../src/types.ts'

const WORKFLOW_YAML_DIR = path.join(__dirname, '..', 'src', 'githubWorkflows')

describe('DefaultGithubWorkflowsList group metadata', function () {
    it('Tags the Hardhat yarn workflow with group "yarn"', function () {
        const yarnHardhat = DefaultGithubWorkflowsList.find(
            (workflow: IDefaultGithubWorkflowsList) => workflow.file === 'hardhat-yarn'
        )
        expect(yarnHardhat, 'hardhat-yarn workflow missing from config').to.not.equal(undefined)
        expect(yarnHardhat!.group).to.equal('yarn')
    })

    it('Tags the Foundry yarn workflow with group "yarn"', function () {
        const yarnFoundry = DefaultGithubWorkflowsList.find(
            (workflow: IDefaultGithubWorkflowsList) => workflow.file === 'foundry-yarn'
        )
        expect(yarnFoundry, 'foundry-yarn workflow missing from config').to.not.equal(undefined)
        expect(yarnFoundry!.group).to.equal('yarn')
    })

    it('Keeps npm workflows tagged with group "npm"', function () {
        const npmWorkflows = DefaultGithubWorkflowsList.filter(
            (workflow: IDefaultGithubWorkflowsList) => workflow.file.endsWith('-npm')
        )
        expect(npmWorkflows.length).to.be.greaterThan(0)
        npmWorkflows.forEach((workflow: IDefaultGithubWorkflowsList) => {
            expect(workflow.group).to.equal('npm')
        })
    })

    it('Has one npm and one yarn entry per tooling (Hardhat / Foundry)', function () {
        // Guards against the original bug where every entry was tagged npm,
        // which made serveWorkflowBuilder list both yarn items under "npm".
        const groupCounts = DefaultGithubWorkflowsList.reduce<Record<string, number>>((counts, workflow) => {
            counts[workflow.group] = (counts[workflow.group] ?? 0) + 1
            return counts
        }, {})
        expect(groupCounts.npm).to.equal(2)
        expect(groupCounts.yarn).to.equal(2)
    })
})

describe('Generated GitHub workflow YAMLs', function () {
    const yamlFiles = ['hardhat-npm.yml', 'hardhat-yarn.yml', 'foundry-npm.yml', 'foundry-yarn.yml']

    yamlFiles.forEach((fileName: string) => {
        describe(fileName, function () {
            const content = fs.readFileSync(path.join(WORKFLOW_YAML_DIR, fileName), 'utf8')

            it('Uses a current major of actions/checkout (>= v4)', function () {
                // Pin to v7 to match the rest of the project's own workflows;
                // the assertion allows a forward bump without editing the test.
                expect(content).to.match(/uses:\s*actions\/checkout@v(4|5|6|7|8|9)/)
            })

            it('Sets up Node with a maintained major (>= v4)', function () {
                expect(content).to.match(/uses:\s*actions\/setup-node@v(4|5|6|7|8|9)/)
            })

            it('Targets a current LTS Node version (>= 20)', function () {
                expect(content).to.match(/node-version:\s*["']?(2[0-9]|3[0-9])/)
            })

            it('Mentions the install command that matches its group', function () {
                if (fileName.includes('yarn')) {
                    expect(content).to.include('yarn')
                    expect(content).to.not.match(/npm ci\b/)
                } else {
                    expect(content).to.match(/npm (ci|install)/)
                }
            })
        })
    })
})