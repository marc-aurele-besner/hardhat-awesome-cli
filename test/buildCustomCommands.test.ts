import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
    addCustomCommand,
    buildCustomCommandInvocation,
    formatAddCustomCommandFlag,
    loadCustomCommands,
    parseAddCustomCommandFlag,
    removeCustomCommand,
    runCustomCommand
} from '../src/buildCustomCommands.ts'
import type { ICustomCommand } from '../src/types.ts'

/**
 * Tests for the custom-commands manager (issue #172).
 *
 * Mirrors the structure used by `buildExcludedFile.test.ts` /
 * `buildDeploymentContract.test.ts`:
 *   - Each test runs in its own `mkdtempSync` fixture so the
 *     `hardhat-awesome-cli.json` written by one case does not leak into
 *     the next.
 *   - No hardhat runtime is needed — the manager is a pure JSON loader /
 *     saver with a thin `child_process` spawn at the end.
 */
describe('buildCustomCommands (issue #172)', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-custom-'))
        process.chdir(fixtureDirectory)
    })

    afterEach(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
    })

    describe('loadCustomCommands', function () {
        it('Returns an empty list when no settings file exists', async function () {
            expect(await loadCustomCommands()).to.deep.equal([])
        })

        it('Returns an empty list when the settings file has no customCommands field', async function () {
            fs.writeFileSync('hardhat-awesome-cli.json', JSON.stringify({ activatedChain: [] }))
            expect(await loadCustomCommands()).to.deep.equal([])
        })

        it('Returns an empty list when the settings file is unparseable JSON', async function () {
            fs.writeFileSync('hardhat-awesome-cli.json', '{ this is not json')
            expect(await loadCustomCommands()).to.deep.equal([])
        })

        it('Loads well-formed entries verbatim', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({
                    customCommands: [
                        {
                            name: 'snapshot',
                            description: 'Take a snapshot of the network state',
                            kind: 'shell',
                            command: 'echo snapshot'
                        },
                        {
                            name: 'compile',
                            kind: 'hardhat',
                            command: 'compile --force'
                        }
                    ]
                })
            )
            const entries = await loadCustomCommands()
            expect(entries).to.deep.equal([
                {
                    name: 'snapshot',
                    description: 'Take a snapshot of the network state',
                    kind: 'shell',
                    command: 'echo snapshot'
                },
                { name: 'compile', kind: 'hardhat', command: 'compile --force' }
            ])
        })

        it('Defaults `kind` to `shell` and omits `description` when absent (legacy entries)', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({
                    customCommands: [{ name: 'legacy', command: 'echo legacy' }]
                })
            )
            const entries = await loadCustomCommands()
            expect(entries).to.deep.equal([{ name: 'legacy', kind: 'shell', command: 'echo legacy' }])
        })

        it('Drops entries that are missing the required name or command field', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({
                    customCommands: [
                        { name: 'valid', command: 'echo ok' },
                        { name: '', command: 'echo bad' },
                        { name: 'no-command' },
                        'not-an-object'
                    ]
                })
            )
            const entries = await loadCustomCommands()
            expect(entries).to.have.lengthOf(1)
            expect(entries[0].name).to.equal('valid')
        })
    })

    describe('addCustomCommand', function () {
        it('Persists a new entry on a fresh project', async function () {
            const added = await addCustomCommand({
                name: 'snapshot',
                description: 'Snapshot state',
                kind: 'shell',
                command: 'echo snap'
            })

            expect(added).to.equal(true)
            const onDisk = JSON.parse(fs.readFileSync('hardhat-awesome-cli.json', 'utf8'))
            expect(onDisk.customCommands).to.deep.equal([
                { name: 'snapshot', description: 'Snapshot state', kind: 'shell', command: 'echo snap' }
            ])
        })

        it('Preserves unrelated top-level settings when adding to an existing file', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({ activatedChain: [{ name: 'Ethereum - Mainnet', chainName: 'ethereum', chainId: 1, gas: 'auto' }] })
            )

            await addCustomCommand({ name: 'snapshot', kind: 'shell', command: 'echo snap' })

            const onDisk = JSON.parse(fs.readFileSync('hardhat-awesome-cli.json', 'utf8'))
            expect(onDisk.activatedChain).to.have.lengthOf(1)
            expect(onDisk.activatedChain[0].chainName).to.equal('ethereum')
            expect(onDisk.customCommands).to.deep.equal([
                { name: 'snapshot', kind: 'shell', command: 'echo snap' }
            ])
        })

        it('Refuses to overwrite an entry with the same name', async function () {
            await addCustomCommand({ name: 'snapshot', kind: 'shell', command: 'echo a' })
            const second = await addCustomCommand({ name: 'snapshot', kind: 'shell', command: 'echo b' })

            expect(second).to.equal(false)
            const entries = await loadCustomCommands()
            expect(entries).to.have.lengthOf(1)
            expect(entries[0].command).to.equal('echo a')
        })

        it('Rejects entries missing a name or command without throwing', async function () {
            expect(await addCustomCommand({ name: '', kind: 'shell', command: 'echo x' })).to.equal(false)
            expect(await addCustomCommand({ name: 'bad', kind: 'shell', command: '' })).to.equal(false)
            expect(fs.existsSync('hardhat-awesome-cli.json')).to.equal(false)
        })

        it('Starts from a clean object when the existing settings file is malformed', async function () {
            fs.writeFileSync('hardhat-awesome-cli.json', '{ broken')

            const added = await addCustomCommand({ name: 'snapshot', kind: 'shell', command: 'echo snap' })

            expect(added).to.equal(true)
            const onDisk = JSON.parse(fs.readFileSync('hardhat-awesome-cli.json', 'utf8'))
            expect(onDisk.customCommands).to.have.lengthOf(1)
        })
    })

    describe('removeCustomCommand', function () {
        it('Removes a previously added entry', async function () {
            await addCustomCommand({ name: 'snapshot', kind: 'shell', command: 'echo snap' })
            await addCustomCommand({ name: 'compile', kind: 'hardhat', command: 'compile' })

            const removed = await removeCustomCommand('snapshot')

            expect(removed).to.equal(true)
            const entries = await loadCustomCommands()
            expect(entries.map((entry: ICustomCommand) => entry.name)).to.deep.equal(['compile'])
        })

        it('Returns false and leaves the file untouched when no entry matches', async function () {
            await addCustomCommand({ name: 'snapshot', kind: 'shell', command: 'echo snap' })

            const removed = await removeCustomCommand('does-not-exist')

            expect(removed).to.equal(false)
            expect(await loadCustomCommands()).to.have.lengthOf(1)
        })

        it('Returns false when the settings file is missing or malformed', async function () {
            expect(await removeCustomCommand('any')).to.equal(false)
            fs.writeFileSync('hardhat-awesome-cli.json', '{ broken')
            expect(await removeCustomCommand('any')).to.equal(false)
        })

        it('Trims whitespace around the requested name', async function () {
            await addCustomCommand({ name: 'snapshot', kind: 'shell', command: 'echo snap' })
            expect(await removeCustomCommand('  snapshot  ')).to.equal(true)
            expect(await loadCustomCommands()).to.deep.equal([])
        })

        it('Preserves unrelated top-level settings when removing', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({
                    activatedChain: [{ name: 'Ethereum - Mainnet', chainName: 'ethereum', chainId: 1, gas: 'auto' }],
                    customCommands: [{ name: 'snapshot', kind: 'shell', command: 'echo snap' }]
                })
            )

            await removeCustomCommand('snapshot')

            const onDisk = JSON.parse(fs.readFileSync('hardhat-awesome-cli.json', 'utf8'))
            expect(onDisk.activatedChain).to.have.lengthOf(1)
            expect(onDisk.customCommands).to.deep.equal([])
        })
    })

    describe('buildCustomCommandInvocation', function () {
        it('Prepends `npx hardhat ` to hardhat-kind entries', function () {
            expect(
                buildCustomCommandInvocation({ name: 'compile', kind: 'hardhat', command: 'compile --force' })
            ).to.equal('npx hardhat compile --force')
        })

        it('Returns shell-kind entries unchanged', function () {
            expect(
                buildCustomCommandInvocation({ name: 'snapshot', kind: 'shell', command: 'echo snap' })
            ).to.equal('echo snap')
        })
    })

    describe('runCustomCommand', function () {
        it('Executes a shell-kind command and resolves once the child exits', async function () {
            // Use a marker file as a synchronous-ish signal that the child
            // actually ran. The CLI is wrapped in a Node child, so we
            // cannot easily read its stdout — the marker file is the
            // cleanest cross-platform equivalent.
            const marker = path.join(fixtureDirectory, 'shell-marker.txt')
            const entry: ICustomCommand = {
                name: 'marker',
                kind: 'shell',
                command: `node -e "require('fs').writeFileSync('${marker.replace(/\\/g, '\\\\')}', 'ok')"`
            }

            await runCustomCommand(entry)

            expect(fs.existsSync(marker)).to.equal(true)
            expect(fs.readFileSync(marker, 'utf8')).to.equal('ok')
        })

        it('Prefixed hardhat-kind entries actually invoke npx hardhat', async function () {
            // `npx hardhat --version` returns 0 without needing a Hardhat
            // project — perfect for a smoke test that the spawn path is
            // wired up correctly. Skip on platforms where `npx` is not
            // available (CI images almost always have it).
            //
            // Cold-start `npx hardhat --version` walks npm to resolve the
            // package and then loads Hardhat — easily 5–10 s on a fresh CI
            // runner with no warm npx cache. Bump the per-test timeout well
            // above the 6 s project default so this smoke test stays reliable.
            this.timeout(30000)
            const entry: ICustomCommand = { name: 'hh-version', kind: 'hardhat', command: '--version' }
            await runCustomCommand(entry)
            // If we got here without throwing, the child exited cleanly.
        })
    })

    describe('flag helpers', function () {
        it('Round-trips a fully-specified entry through JSON', function () {
            const entry: ICustomCommand = {
                name: 'snapshot',
                description: 'Take a snapshot',
                kind: 'shell',
                command: 'echo snap | tee log.txt'
            }
            const formatted = formatAddCustomCommandFlag(entry)
            const parsed = parseAddCustomCommandFlag(formatted)
            expect(parsed).to.deep.equal(entry)
        })

        it('Round-trips a hardhat-kind entry without a description', function () {
            const entry: ICustomCommand = { name: 'compile', kind: 'hardhat', command: 'compile --force' }
            expect(parseAddCustomCommandFlag(formatAddCustomCommandFlag(entry))).to.deep.equal(entry)
        })

        it('Returns undefined for empty, malformed, or incomplete JSON', function () {
            expect(parseAddCustomCommandFlag(undefined)).to.equal(undefined)
            expect(parseAddCustomCommandFlag('')).to.equal(undefined)
            expect(parseAddCustomCommandFlag('not json')).to.equal(undefined)
            expect(parseAddCustomCommandFlag('{"name":"x"}')).to.equal(undefined)
            expect(parseAddCustomCommandFlag('{"name":"","command":"echo"}')).to.equal(undefined)
            expect(parseAddCustomCommandFlag('{"name":"x","command":""}')).to.equal(undefined)
        })
    })
})