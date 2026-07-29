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

    // Every workflow used in these tests is one of the Foundry entries:
    // they have no `requirement` array, so the menu does not call
    // `detectPackage` and never spawns `npm install`. The Hardhat
    // workflows all require `solidity-coverage`, which would force a real
    // registry round-trip mid-test and break CI.
    //
    // The behaviour we care about (file copy, directory creation, no
    // overwrite) is identical across Foundry and Hardhat workflows — the
    // only difference is the `requirement` follow-up.
    const workflowFile = 'foundry-npm'
    const workflowTitle = 'NPM - Foundry - Forge Test'

    it('Copies the requested workflow YAML into .github/workflows/<file>.yml', async function () {
        // Use the CLI flag path so we can drive it without the inquirer
        // prompt and inspect the file on disk deterministically.
        await buildWorkflowsFromCommand(workflowFile)

        const destination = path.join('.github', 'workflows', workflowFile + '.yml')
        expect(fs.existsSync(destination)).to.equal(true)
        const bundled = fs.readFileSync(path.join(sourceDir, workflowFile + '.yml'), 'utf8')
        expect(fs.readFileSync(destination, 'utf8')).to.equal(bundled)
    })

    it('Creates the .github/workflows directory when it does not exist yet', async function () {
        expect(fs.existsSync('.github')).to.equal(false)

        await buildWorkflowsFromCommand(workflowFile)

        expect(fs.existsSync('.github')).to.equal(true)
        expect(fs.existsSync('.github/workflows')).to.equal(true)
        expect(fs.existsSync('.github/workflows/' + workflowFile + '.yml')).to.equal(true)
    })

    it('Does not overwrite a workflow that already exists at the destination', async function () {
        fs.mkdirSync('.github/workflows', { recursive: true })
        const destination = path.join('.github/workflows/' + workflowFile + '.yml')
        fs.writeFileSync(destination, '# user edits stay here')

        await buildWorkflowsFromCommand(workflowFile)

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
        useInquirerStub([workflowTitle])

        await serveWorkflowBuilder()

        const destination = path.join('.github/workflows/' + workflowFile + '.yml')
        expect(fs.existsSync(destination)).to.equal(true)
    })

    it('Does not trigger a package install when the workflow has no requirement', async function () {
        // Lock in the Foundry-only decision above: calling
        // `buildWorkflowsFromCommand` from a clean fixture must not call
        // `detectPackage` (which would spawn `npm install`). A misstep
        // here would silently rerun the CI failure we hit before
        // switching to Foundry workflows.
        //
        // We assert the absence of a `node_modules/solidity-coverage`
        // directory after the call — that is the only package that the
        // Hardhat workflows in the registry try to install. If a future
        // refactor accidentally re-introduces a Hardhat workflow here,
        // npm would either fail (CI) or slow the test down by orders of
        // magnitude (local); either way the test would have to be
        // revisited.
        expect(fs.existsSync('node_modules/solidity-coverage')).to.equal(false)

        await buildWorkflowsFromCommand(workflowFile)

        expect(fs.existsSync('node_modules/solidity-coverage')).to.equal(false)
    })
})
