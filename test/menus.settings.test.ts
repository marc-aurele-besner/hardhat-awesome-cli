import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { serveExcludeFileSelector, serveSettingSelector } from '../src/menus/settings.ts'
import { useInquirerStub } from './menus-test-helpers.ts'

/**
 * Menu-level tests for the extracted settings flows (issue #162).
 *
 * `serveExcludeFileSelector` used to live inside the 1500-line
 * `serveInquirer.ts` where it was unreachable from a test. Now that it is
 * its own module we can drive it by stubbing `inquirer.prompt` and
 * asserting the resulting `hardhat-awesome-cli.json` on disk — the file
 * the menu actually writes to.
 *
 * The two regressions to keep an eye on:
 *   - The previous implementation used `allFiles.map(async ...)` inside a
 *     `.then(...)` without awaiting the array of promises, so the menu
 *     resolved before the settings file was up to date. The test below
 *     would pass for the wrong reason if we forgot to `await Promise.all`
 *     when this code was extracted.
 *   - The checkbox default is read from `hardhat-awesome-cli.json` and
 *     round-tripped back through `addExcludedFiles` / `removeExcludedFiles`.
 *     Without test coverage the binding between the loader and the writer
 *     breaks silently.
 */
describe('menus/settings', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string
    let settingsFile: string

    // `waitForReadability` sleeps by default; skipping the pause shaves a
    // quarter of a second off every menu invocation.
    let originalNoPause: string | undefined

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-menus-settings-'))
        settingsFile = path.join(fixtureDirectory, 'hardhat-awesome-cli.json')
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

    const seedTestFiles = () => {
        fs.mkdirSync('test', { recursive: true })
        fs.writeFileSync(path.join('test', 'Token.test.ts'), '// Token test')
        fs.writeFileSync(path.join('test', 'Vault.test.ts'), '// Vault test')
        fs.mkdirSync(path.join('test', 'helpers'), { recursive: true })
        fs.writeFileSync(path.join('test', 'helpers', 'shared.ts'), '// helper')
    }

    const seedScriptFiles = () => {
        fs.mkdirSync('scripts', { recursive: true })
        fs.writeFileSync(path.join('scripts', 'deploy.ts'), '// deploy script')
        fs.writeFileSync(path.join('scripts', 'migrate.ts'), '// migrate script')
    }

    const seedContractFiles = () => {
        fs.mkdirSync('contracts', { recursive: true })
        fs.writeFileSync(path.join('contracts', 'Token.sol'), '// Token contract')
        fs.writeFileSync(path.join('contracts', 'Vault.sol'), '// Vault contract')
    }

    describe('serveExcludeFileSelector', function () {
        it('Records the files the user ticked as excluded in hardhat-awesome-cli.json', async function () {
            seedTestFiles()
            // The selector asks for a single `checkbox` prompt answering with
            // the file paths to exclude. We tick both test files; the helper
            // directory stays in the runnable list. The menu writes the
            // formatted display name (e.g. `Token - Test`, produced by
            // `formatFileName` in buildFilesList.ts) into the exclusion
            // entry — the test pins that behaviour so the loader keeps
            // matching the writer.
            useInquirerStub([['Token.test.ts', 'Vault.test.ts']])

            await serveExcludeFileSelector('test')

            expect(fs.existsSync(settingsFile)).to.equal(true)
            const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
            expect(settings.excludedFiles).to.deep.equal([
                { directory: 'test', name: 'Token - Test', filePath: 'Token.test.ts', type: 'file' },
                { directory: 'test', name: 'Vault - Test', filePath: 'Vault.test.ts', type: 'file' }
            ])
        })

        it('Marks a directory entry as `type: "directory"` when a folder is selected', async function () {
            seedTestFiles()
            useInquirerStub([['helpers/']])

            await serveExcludeFileSelector('test')

            const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
            expect(settings.excludedFiles).to.deep.equal([
                { directory: 'test', name: 'helpers/', filePath: 'helpers/', type: 'directory' }
            ])
        })

        it('Removes a previously excluded file when the user deselects it', async function () {
            seedTestFiles()
            // Seed the settings file with one entry that the user is about
            // to deselect, and one that the user keeps. The menu should drop
            // the deselected entry and re-write the surviving one.
            fs.writeFileSync(
                settingsFile,
                JSON.stringify({
                    excludedFiles: [
                        { directory: 'test', name: 'Token - Test', filePath: 'Token.test.ts', type: 'file' },
                        { directory: 'test', name: 'Vault - Test', filePath: 'Vault.test.ts', type: 'file' }
                    ]
                })
            )
            useInquirerStub([['Token.test.ts']])

            await serveExcludeFileSelector('test')

            const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
            expect(settings.excludedFiles).to.deep.equal([
                { directory: 'test', name: 'Token - Test', filePath: 'Token.test.ts', type: 'file' }
            ])
        })

        it('Preserves unrelated settings (custom commands) when rewriting excludedFiles', async function () {
            seedTestFiles()
            fs.writeFileSync(
                settingsFile,
                JSON.stringify({
                    customCommands: [{ name: 'demo', kind: 'shell', command: 'echo demo' }]
                })
            )
            useInquirerStub([['Token.test.ts']])

            await serveExcludeFileSelector('test')

            const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
            expect(settings.customCommands).to.deep.equal([{ name: 'demo', kind: 'shell', command: 'echo demo' }])
            expect(settings.excludedFiles).to.deep.equal([
                { directory: 'test', name: 'Token - Test', filePath: 'Token.test.ts', type: 'file' }
            ])
        })

        it('Scopes the writes to the requested directory (scripts vs test vs contracts)', async function () {
            seedScriptFiles()
            seedContractFiles()
            useInquirerStub([['migrate.ts']])

            await serveExcludeFileSelector('scripts')

            const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
            // Only the scripts entry shows up; the seed contract files are
            // untouched and contracts/ is not mentioned.
            expect(settings.excludedFiles).to.deep.equal([
                { directory: 'scripts', name: 'Migrate', filePath: 'migrate.ts', type: 'file' }
            ])
        })

        it('Does not write a settings file when the target directory is empty', async function () {
            // No seed: `test/` doesn't exist yet, so the menu has nothing to
            // show. The menu still prompts (with empty choices — the existing
            // UX), but the post-prompt walk is over an empty file list so
            // nothing gets written. The settings file must not be created.
            const stub = useInquirerStub([[]])

            await serveExcludeFileSelector('test')

            expect(stub.prompts).to.have.lengthOf(1)
            expect(stub.prompts[0][0].choices).to.deep.equal([])
            expect(fs.existsSync(settingsFile)).to.equal(false)
        })
    })

    describe('serveSettingSelector — chain activation', function () {
        it('Persists the user-selected chain list to hardhat-awesome-cli.json', async function () {
            // `serveSettingSelector` waits for a settings selection, then a
            // checkbox of chains. We tick the first chain (Hardhat local);
            // every other chain is deselected and should be removed from
            // the saved list.
            const stub = useInquirerStub(
                ['Add/Remove chains from the chain selection', ['Hardhat (Temporary instance)']],
                undefined
            )
            // The other promise in the menu (the activated-chain preview) is
            // computed inside the same loop; we look at the settings file
            // afterwards to confirm the write happened.
            void stub

            await serveSettingSelector({} as any)

            const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
            const activatedNames = settings.activatedChain.map((chain: { name: string }) => chain.name).sort()
            expect(activatedNames).to.include('Hardhat (Temporary instance)')
            // Every chain the user did not tick should be missing from the
            // saved list — exactly one entry survives.
            expect(settings.activatedChain).to.have.lengthOf(1)
        })
    })
})
