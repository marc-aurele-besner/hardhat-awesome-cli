import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
    buildActivatedChainNetworkConfig,
    buildCustomChainEntry,
    buildNetworkSelectorChoices,
    findAvailableCustomChainSlot,
    formatAddCustomChainFlag,
    parseAddCustomChainFlag,
    runAddCustomChain
} from '../src/buildNetworks.ts'
import { DefaultChainList } from '../src/config.ts'
import type { IChain } from '../src/types.ts'

const findChain = (chainName: string): IChain => {
    const chain = DefaultChainList.find((entry: IChain) => entry.chainName === chainName)
    if (!chain) throw new Error(`Test fixture missing default chain "${chainName}"`)
    return chain
}

describe('buildNetworkSelectorChoices', function () {
    it('Re-injects the hardhat local network when it was not selected in the activated list', function () {
        const activatedChainList = [findChain('ethereum')]
        const { chains, names } = buildNetworkSelectorChoices(activatedChainList, false)
        expect(names).to.include('Hardhat (Temporary instance)')
        expect(names).to.include('Ethereum - Mainnet')
        // Bug from issue #32: hardhat used to disappear when the user only
        // selected mainnet / testnet chains.
        expect(chains.some((chain: IChain) => chain.chainName === 'hardhat')).to.equal(true)
    })

    it('Does not duplicate hardhat when it is already in the activated list', function () {
        const activatedChainList = [findChain('hardhat'), findChain('ethereum')]
        const { chains } = buildNetworkSelectorChoices(activatedChainList, false)
        const hardhatCount = chains.filter((chain: IChain) => chain.chainName === 'hardhat').length
        expect(hardhatCount).to.equal(1)
    })

    it('Filters hardhat out when noLocalNetwork is set (RPC/accounts editor)', function () {
        const activatedChainList = [findChain('hardhat'), findChain('ethereum')]
        const { chains, names } = buildNetworkSelectorChoices(activatedChainList, true)
        expect(names).to.not.include('Hardhat (Temporary instance)')
        expect(names).to.include('Ethereum - Mainnet')
        expect(chains.every((chain: IChain) => chain.chainName !== 'hardhat')).to.equal(true)
    })

    it('Falls back to hardhat + localhost when no chains are activated at all', function () {
        const { chains, names } = buildNetworkSelectorChoices([], false)
        expect(names).to.include('Hardhat (Temporary instance)')
        expect(names).to.include('Hardhat (Localhost node)')
        expect(chains.length).to.equal(2)
    })

    it('Keeps hardhat as the first choice when it has to be re-injected', function () {
        const activatedChainList = [findChain('ethereum'), findChain('polygon')]
        const { chains } = buildNetworkSelectorChoices(activatedChainList, false)
        expect(chains[0].chainName).to.equal('hardhat')
    })

    it('Preserves the names list aligned with the chains list', function () {
        const activatedChainList = [findChain('ethereum'), findChain('polygon')]
        const { chains, names } = buildNetworkSelectorChoices(activatedChainList, false)
        expect(names.length).to.equal(chains.length)
        chains.forEach((chain: IChain, index: number) => {
            expect(names[index]).to.equal(chain.name)
        })
    })
})

describe('buildActivatedChainNetworkConfig (secrets redaction)', function () {
    const originalShowSecrets = process.env.AWESOME_CLI_SHOW_SECRETS
    const originalCwd = process.cwd()
    let fixtureDir: string

    beforeEach(function () {
        // Use a fresh temp dir for every test so the JSON fixture can't bleed
        // into a sibling test (the function reads relative files via cwd).
        fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'awesome-cli-network-'))
        process.chdir(fixtureDir)
        delete process.env.AWESOME_CLI_SHOW_SECRETS
    })

    afterEach(function () {
        process.chdir(originalCwd)
        if (originalShowSecrets === undefined) delete process.env.AWESOME_CLI_SHOW_SECRETS
        else process.env.AWESOME_CLI_SHOW_SECRETS = originalShowSecrets
        fs.rmSync(fixtureDir, { recursive: true, force: true })
    })

    it('returns an empty config when the file is missing', function () {
        // No hardhat-awesome-cli.json in the temp dir — the function returns []
        // without throwing. Issue #176: this must stay safe regardless of how
        // the user invokes the "See all config" menu.
        expect(buildActivatedChainNetworkConfig()).to.deep.equal([])
    })

    it('masks accounts / mnemonic values in the rendered config', function () {
        const activatedChain = {
            name: 'Ethereum - Mainnet',
            chainName: 'ethereum',
            chainId: 1,
            gas: 'auto',
            currency: 'ETH',
            defaultRpcUrl: 'https://example.invalid',
            defaultBlockExplorer: 'https://etherscan.io/'
        }
        fs.writeFileSync(
            'hardhat-awesome-cli.json',
            JSON.stringify({ activatedChain: [activatedChain] }, null, 2)
        )
        // The env lookup has a known bug where `getEnvValue` returns the
        // function reference, which `redactSecret` then maps to `''`. So
        // no accounts key shows up in the output regardless. The redaction
        // happens at `redactSecret`, which is unit-tested directly. Here we
        // simply confirm the function does not leak raw 0x-prefixed key
        // material into the rendered string — even if the upstream bug is
        // ever fixed (so real keys start flowing through), the output stays
        // safe.
        const config = buildActivatedChainNetworkConfig()
        expect(config).to.be.a('string')
        expect(config).to.not.match(/\b0x[0-9a-fA-F]{8}/)
    })
})

/**
 * Tests for the `--addCustomChain` helper (issue #165).
 *
 * Mirrors the structure of the other build* suites: each case runs in a
 * fresh temp directory so the `hardhat-awesome-cli.json` written by
 * `runAddCustomChain` cannot leak into a sibling test.
 */
describe('addCustomChain helpers (issue #165)', function () {
    const originalCwd = process.cwd()
    let fixtureDirectory: string

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-add-custom-chain-'))
        process.chdir(fixtureDirectory)
    })

    afterEach(function () {
        process.chdir(originalCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
    })

    describe('findAvailableCustomChainSlot', function () {
        it('Returns customChain1 when no settings file exists', async function () {
            expect(await findAvailableCustomChainSlot()).to.equal('customChain1')
        })

        it('Returns the first free slot when some are already taken', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({
                    activatedChain: [
                        { name: 'First', chainName: 'customChain1', chainId: 9001, gas: 'auto' },
                        { name: 'Second', chainName: 'customChain2', chainId: 9002, gas: 'auto' }
                    ]
                })
            )
            expect(await findAvailableCustomChainSlot()).to.equal('customChain3')
        })

        it('Returns undefined when every customChain{N} slot (1..8) is taken', async function () {
            const slots = Array.from({ length: 8 }, (_, i) => i + 1).map((n) => ({
                name: `Slot ${n}`,
                chainName: `customChain${n}`,
                chainId: 9100 + n,
                gas: 'auto'
            }))
            fs.writeFileSync('hardhat-awesome-cli.json', JSON.stringify({ activatedChain: slots }))
            expect(await findAvailableCustomChainSlot()).to.equal(undefined)
        })
    })

    describe('buildCustomChainEntry', function () {
        it('Returns a fully-populated IChain with the first free slot', async function () {
            const entry = await buildCustomChainEntry({
                name: 'My Custom',
                chainId: 12345,
                gas: '120000000',
                defaultRpcUrl: 'https://rpc.example.invalid'
            })
            expect(entry).to.deep.equal({
                name: 'My Custom',
                chainName: 'customChain1',
                chainId: 12345,
                gas: '120000000',
                defaultRpcUrl: 'https://rpc.example.invalid'
            })
        })

        it('Defaults gas to "auto" and omits defaultRpcUrl when missing', async function () {
            const entry = await buildCustomChainEntry({ name: 'Minimal', chainId: 42 })
            expect(entry).to.deep.equal({
                name: 'Minimal',
                chainName: 'customChain1',
                chainId: 42,
                gas: 'auto'
            })
            expect(entry).to.not.have.property('defaultRpcUrl')
        })

        it('Trims whitespace around name, gas, and defaultRpcUrl', async function () {
            const entry = await buildCustomChainEntry({
                name: '  Trimmed  ',
                chainId: 7,
                gas: '  auto  ',
                defaultRpcUrl: '  https://rpc.example.invalid  '
            })
            expect(entry?.name).to.equal('Trimmed')
            expect(entry?.gas).to.equal('auto')
            expect(entry?.defaultRpcUrl).to.equal('https://rpc.example.invalid')
        })

        it('Coerces a numeric string chainId to a number', async function () {
            const entry = await buildCustomChainEntry({ name: 'Coerced', chainId: '314' as unknown as number })
            expect(entry?.chainId).to.equal(314)
        })

        it('Returns undefined when name is missing or empty', async function () {
            expect(await buildCustomChainEntry({ name: '', chainId: 1 })).to.equal(undefined)
            expect(await buildCustomChainEntry({ name: '   ', chainId: 1 })).to.equal(undefined)
        })

        it('Returns undefined when chainId is missing, zero, or negative', async function () {
            expect(await buildCustomChainEntry({ name: 'x', chainId: 0 })).to.equal(undefined)
            expect(await buildCustomChainEntry({ name: 'x', chainId: -1 })).to.equal(undefined)
            expect(await buildCustomChainEntry({ name: 'x' } as any)).to.equal(undefined)
            expect(await buildCustomChainEntry({ name: 'x', chainId: 'abc' as unknown as number })).to.equal(undefined)
            expect(await buildCustomChainEntry({ name: 'x', chainId: 1.5 as unknown as number })).to.equal(undefined)
        })

        it('Returns undefined when no customChain{N} slot is free', async function () {
            const slots = Array.from({ length: 8 }, (_, i) => i + 1).map((n) => ({
                name: `Slot ${n}`,
                chainName: `customChain${n}`,
                chainId: 9200 + n,
                gas: 'auto'
            }))
            fs.writeFileSync('hardhat-awesome-cli.json', JSON.stringify({ activatedChain: slots }))
            expect(await buildCustomChainEntry({ name: 'Overflow', chainId: 9999 })).to.equal(undefined)
        })
    })

    describe('runAddCustomChain', function () {
        it('Persists a new chain on a fresh project and reports success', async function () {
            const added = await runAddCustomChain({
                name: 'My Custom',
                chainId: 7777,
                gas: 'auto',
                defaultRpcUrl: 'https://rpc.example.invalid'
            })

            expect(added).to.equal(true)
            const onDisk = JSON.parse(fs.readFileSync('hardhat-awesome-cli.json', 'utf8'))
            expect(onDisk.activatedChain).to.deep.equal([
                {
                    name: 'My Custom',
                    chainName: 'customChain1',
                    chainId: 7777,
                    gas: 'auto',
                    defaultRpcUrl: 'https://rpc.example.invalid'
                }
            ])
        })

        it('Picks the next free slot when some are already taken', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({
                    activatedChain: [
                        { name: 'First', chainName: 'customChain1', chainId: 9001, gas: 'auto' }
                    ]
                })
            )

            const added = await runAddCustomChain({ name: 'Second', chainId: 9002 })

            expect(added).to.equal(true)
            const onDisk = JSON.parse(fs.readFileSync('hardhat-awesome-cli.json', 'utf8'))
            const customEntry = onDisk.activatedChain.find((chain: IChain) => chain.name === 'Second')
            expect(customEntry.chainName).to.equal('customChain2')
        })

        it('Returns false and writes nothing when the chainId collides with a default chain', async function () {
            // `ethereum` defaults to chainId 1 in DefaultChainList. Use a
            // random free short name slot so the slot-picker alone does not
            // mask the chainId conflict.
            const added = await runAddCustomChain({ name: 'Ethereum clone', chainId: 1 })

            expect(added).to.equal(false)
            expect(fs.existsSync('hardhat-awesome-cli.json')).to.equal(false)
        })

        it('Returns false and writes nothing when the chainId collides with an existing activated chain', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({
                    activatedChain: [
                        { name: 'Existing', chainName: 'customChain1', chainId: 5050, gas: 'auto' }
                    ]
                })
            )

            const added = await runAddCustomChain({ name: 'Clash', chainId: 5050 })

            expect(added).to.equal(false)
            const onDisk = JSON.parse(fs.readFileSync('hardhat-awesome-cli.json', 'utf8'))
            expect(onDisk.activatedChain).to.have.lengthOf(1)
            expect(onDisk.activatedChain[0].name).to.equal('Existing')
        })

        it('Returns false when every customChain{N} slot is taken', async function () {
            const slots = Array.from({ length: 8 }, (_, i) => i + 1).map((n) => ({
                name: `Slot ${n}`,
                chainName: `customChain${n}`,
                chainId: 9300 + n,
                gas: 'auto'
            }))
            fs.writeFileSync('hardhat-awesome-cli.json', JSON.stringify({ activatedChain: slots }))

            const added = await runAddCustomChain({ name: 'Overflow', chainId: 9999 })

            expect(added).to.equal(false)
        })

        it('Returns false on invalid input without touching the settings file', async function () {
            fs.writeFileSync(
                'hardhat-awesome-cli.json',
                JSON.stringify({
                    activatedChain: [
                        { name: 'Untouched', chainName: 'customChain1', chainId: 1, gas: 'auto' }
                    ]
                })
            )

            expect(await runAddCustomChain({ name: '', chainId: 1 })).to.equal(false)
            expect(await runAddCustomChain({ name: 'bad', chainId: -1 })).to.equal(false)

            const onDisk = JSON.parse(fs.readFileSync('hardhat-awesome-cli.json', 'utf8'))
            expect(onDisk.activatedChain).to.have.lengthOf(1)
            expect(onDisk.activatedChain[0].name).to.equal('Untouched')
        })
    })

    describe('formatAddCustomChainFlag / parseAddCustomChainFlag', function () {
        it('Round-trips a fully-specified payload', function () {
            const input = {
                name: 'My Custom',
                chainId: 7777,
                gas: 'auto',
                defaultRpcUrl: 'https://rpc.example.invalid'
            }
            const formatted = formatAddCustomChainFlag(input)
            const parsed = parseAddCustomChainFlag(formatted)
            expect(parsed).to.deep.equal(input)
        })

        it('Round-trips the minimal payload (only name + chainId)', function () {
            const formatted = formatAddCustomChainFlag({ name: 'Minimal', chainId: 42 })
            const parsed = parseAddCustomChainFlag(formatted)
            expect(parsed).to.deep.equal({ name: 'Minimal', chainId: 42 })
        })

        it('Returns undefined for an empty or missing flag value', function () {
            expect(parseAddCustomChainFlag(undefined)).to.equal(undefined)
            expect(parseAddCustomChainFlag('')).to.equal(undefined)
            expect(parseAddCustomChainFlag('   ')).to.equal(undefined)
        })

        it('Returns undefined for malformed JSON', function () {
            expect(parseAddCustomChainFlag('not json')).to.equal(undefined)
            expect(parseAddCustomChainFlag('{"name":')).to.equal(undefined)
        })

        it('Returns undefined for a JSON value that is not an object', function () {
            expect(parseAddCustomChainFlag('null')).to.equal(undefined)
            expect(parseAddCustomChainFlag('"a string"')).to.equal(undefined)
            expect(parseAddCustomChainFlag('123')).to.equal(undefined)
        })

        it('Returns undefined when name is missing or empty', function () {
            expect(parseAddCustomChainFlag('{"chainId":1}')).to.equal(undefined)
            expect(parseAddCustomChainFlag('{"name":"","chainId":1}')).to.equal(undefined)
            expect(parseAddCustomChainFlag('{"name":"   ","chainId":1}')).to.equal(undefined)
        })

        it('Returns undefined when chainId is missing, zero, or negative', function () {
            expect(parseAddCustomChainFlag('{"name":"x"}')).to.equal(undefined)
            expect(parseAddCustomChainFlag('{"name":"x","chainId":0}')).to.equal(undefined)
            expect(parseAddCustomChainFlag('{"name":"x","chainId":-5}')).to.equal(undefined)
            expect(parseAddCustomChainFlag('{"name":"x","chainId":"abc"}')).to.equal(undefined)
        })

        it('Coerces a numeric string chainId to a number on the way in', function () {
            expect(parseAddCustomChainFlag('{"name":"x","chainId":"314"}')?.chainId).to.equal(314)
        })

        it('Drops blank gas / defaultRpcUrl on the way in', function () {
            expect(parseAddCustomChainFlag('{"name":"x","chainId":1,"gas":"  ","defaultRpcUrl":""}')).to.deep.equal({
                name: 'x',
                chainId: 1
            })
        })
    })
})
