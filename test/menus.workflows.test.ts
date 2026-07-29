import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { buildWorkflowsFromCommand } from '../src/buildWorkflows.ts'
import { DefaultGithubWorkflowsList } from '../src/config.ts'
import { serveWorkflowBuilder } from '../src/menus/moreSettings.ts'
import { useInquirerStub } from './menus-test-helpers.ts'

/**
 * Menu-level tests for the GitHub workflow builder (issue #162).
 *
 * `serveWorkflowBuilder` is the interactive counterpart of the
 * `--addGithubTestWorkflow` CLI flag. The flag path used to rely on
 * `require.main.filename` to locate the packaged YAML templates, which
 * only worked when the CLI was installed under
 * `node_modules/hardhat-awesome-cli` and was the entry point of the
 * process. The fix that ships with this test (see `buildWorkflows.ts`)
 * resolves the templates from the package's own directory via
 * `fileURLToPath(import.meta.url)`, so the menu works both for the
 * installed package and for the package root (tests, dev scratch).
 *
 * The menu's helper functions (`buildWorkflows`, `buildWorkflowsFromCommand`)
 * are exercised directly here so the assertions can rely on the file
 * actually landing on disk regardless of how the menu prompts. The end-to-end
 * `serveWorkflowBuilder` flow is covered too, as a smoke test pinning the
 * prompt → write → file path chain.
 */
describe('menus/workflows', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string

    let originalNoPause: string | undefined

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-menus-workflows-'))
        process.chdir(fixtureDirectory)
        originalNoPause = process.env.AWESOME_CLI_NO_PAUSE
        process.env.AWESOME_CLI_NO_PAUSE = '1'
    })

    afterEach(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
        if (originalNoPause === undefined) delete process.env.AWESOME_CLI_NO_PAUSE
        else process.env.AWESOME_CLI_NO_PAUSE = originalNoPause
    })

    const sourceDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../src/githubWorkflows')

    it('Copies the requested workflow YAML into .github/workflows/<file>.yml', async function () {
        // Use the CLI flag path so we can drive it without the inquirer
        // prompt and inspect the file on disk deterministically.
        await buildWorkflowsFromCommand('hardhat-npm')

        const destination = path.join('.github', 'workflows', 'hardhat-npm.yml')
        expect(fs.existsSync(destination)).to.equal(true)
        const bundled = fs.readFileSync(path.join(sourceDir, 'hardhat-npm.yml'), 'utf8')
        expect(fs.readFileSync(destination, 'utf8')).to.equal(bundled)
    })

    it('Creates the .github/workflows directory when it does not exist yet', async function () {
        expect(fs.existsSync('.github')).to.equal(false)

        await buildWorkflowsFromCommand('foundry-npm')

        expect(fs.existsSync('.github')).to.equal(true)
        expect(fs.existsSync('.github/workflows')).to.equal(true)
        expect(fs.existsSync('.github/workflows/foundry-npm.yml')).to.equal(true)
    })

    it('Does not overwrite a workflow that already exists at the destination', async function () {
        fs.mkdirSync('.github/workflows', { recursive: true })
        const destination = path.join('.github/workflows/hardhat-npm.yml')
        fs.writeFileSync(destination, '# user edits stay here')

        await buildWorkflowsFromCommand('hardhat-npm')

        expect(fs.readFileSync(destination, 'utf8')).to.equal('# user edits stay here')
    })

    it('Resolves the package templates from the package root (no require.main)', async function () {
        // The previous implementation used `require.main.filename` which
        // is the mocha bin path when running from the package root. The
        // resolved path always exists when the package is installed under
        // node_modules and the CLI is the entry point, but breaks in
        // every other context. The fix pins a file-existence check on a
        // template that ships in `src/githubWorkflows/`.
        expect(fs.existsSync(sourceDir)).to.equal(true)
        for (const workflow of DefaultGithubWorkflowsList) {
            expect(
                fs.existsSync(path.join(sourceDir, workflow.file + '.yml')),
                `missing bundled template for ${workflow.title}`
            ).to.equal(true)
        }
    })

    it('Writes the workflow picked from the menu', async function () {
        // End-to-end smoke test: the menu asks for a single list prompt
        // answering with the workflow title. The end result matches the
        // direct CLI flag path above.
        //
        // Pick a workflow with no `requirement` so the menu does not
        // trigger an actual `npm install` mid-test. The Hardhat workflows
        // all require `solidity-coverage`; the Foundry ones do not.
        const target = DefaultGithubWorkflowsList.find((workflow) => workflow.file === 'foundry-npm')
        expect(target).to.not.equal(undefined)

        useInquirerStub([target!.title])

        await serveWorkflowBuilder()

        const destination = path.join('.github/workflows/foundry-npm.yml')
        expect(fs.existsSync(destination)).to.equal(true)
    })
})
