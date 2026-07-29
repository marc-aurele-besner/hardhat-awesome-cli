import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { serveCustomCommandManager } from '../src/menus/customCommands.ts'
import { useInquirerStub } from './menus-test-helpers.ts'

/**
 * Menu-level tests for the custom-command manager (issue #162).
 *
 * `serveCustomCommandManager` is the interactive counterpart of the
 * `--addCustomCommand` / `--removeCustomCommand` CLI flags. The flag
 * paths are covered by `buildCustomCommands.test.ts`; this file drives
 * the menu end-to-end and asserts that the resulting
 * `hardhat-awesome-cli.json` reflects the user's choices.
 */
describe('menus/customCommands', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string
    let settingsFile: string

    let originalNoPause: string | undefined

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-menus-custom-'))
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

    /** Convenience accessor for the assertions below. */
    const readCommands = () => {
        expect(fs.existsSync(settingsFile), 'expected hardhat-awesome-cli.json to be written').to.equal(true)
        return JSON.parse(fs.readFileSync(settingsFile, 'utf8')).customCommands
    }

    it('Adds a fresh custom command entry to hardhat-awesome-cli.json', async function () {
        useInquirerStub([
            'Add a custom command',
            { name: 'demo', description: 'demo command', kind: 'shell', command: 'echo demo' }
        ])

        await serveCustomCommandManager()

        expect(readCommands()).to.deep.equal([
            { name: 'demo', kind: 'shell', command: 'echo demo', description: 'demo command' }
        ])
    })

    it('Preserves unrelated settings (excludedFiles) when adding a custom command', async function () {
        fs.writeFileSync(
            settingsFile,
            JSON.stringify({
                excludedFiles: [{ directory: 'test', name: 'Token - Test', filePath: 'Token.test.ts', type: 'file' }]
            })
        )
        useInquirerStub([
            'Add a custom command',
            { name: 'demo', description: '', kind: 'shell', command: 'echo demo' }
        ])

        await serveCustomCommandManager()

        const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
        expect(settings.excludedFiles).to.deep.equal([
            { directory: 'test', name: 'Token - Test', filePath: 'Token.test.ts', type: 'file' }
        ])
        expect(settings.customCommands).to.deep.equal([{ name: 'demo', kind: 'shell', command: 'echo demo' }])
    })

    it('Does not write a new entry when the user picks a duplicate name', async function () {
        fs.writeFileSync(
            settingsFile,
            JSON.stringify({
                customCommands: [{ name: 'demo', kind: 'shell', command: 'echo demo' }]
            })
        )
        // Capture the previous on-disk snapshot so we can assert the file
        // was not rewritten (the menu prints a warning and returns early).
        const before = fs.readFileSync(settingsFile, 'utf8')
        useInquirerStub([
            'Add a custom command',
            { name: 'demo', description: 'updated', kind: 'shell', command: 'echo demo' }
        ])

        await serveCustomCommandManager()

        const after = fs.readFileSync(settingsFile, 'utf8')
        expect(after).to.equal(before)
        expect(JSON.parse(after).customCommands).to.deep.equal([{ name: 'demo', kind: 'shell', command: 'echo demo' }])
    })

    it('Removes the user-selected custom command from the settings file', async function () {
        fs.writeFileSync(
            settingsFile,
            JSON.stringify({
                customCommands: [
                    { name: 'demo', kind: 'shell', command: 'echo demo' },
                    { name: 'migrate', kind: 'hardhat', command: 'cli --addCustomChain' }
                ]
            })
        )
        useInquirerStub(['Remove a custom command', 'demo'])

        await serveCustomCommandManager()

        expect(readCommands()).to.deep.equal([{ name: 'migrate', kind: 'hardhat', command: 'cli --addCustomChain' }])
    })

    it('Does not write anything when the user picks "List custom commands"', async function () {
        // Listing is read-only — the menu just calls console.table and
        // returns. No settings write should happen regardless of whether
        // the file exists already.
        const stub = useInquirerStub(['List custom commands'])

        await serveCustomCommandManager()

        expect(stub.prompts).to.have.lengthOf(1)
        expect(fs.existsSync(settingsFile)).to.equal(false)
    })
})
