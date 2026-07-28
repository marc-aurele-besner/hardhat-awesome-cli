import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import buildMockContract, { buildMockDeploymentScriptOrTest } from '../src/buildMockContracts.ts'

/**
 * Tests for the mock-contract generator. Issue #168 asked that the mock
 * creator succeed in projects that do not yet have `contracts/`, `test/`,
 * and `scripts/` directories, creating them on demand without overwriting
 * any files that already exist.
 */
describe('buildMockContracts (issue #168)', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string

    // `detectPackage` short-circuits when the dependency already lives under
    // `node_modules/`, so creating an empty placeholder keeps the install
    // command from running during tests.
    const stubOpenZeppelinContracts = () => {
        fs.mkdirSync(path.join(fixtureDirectory, 'node_modules/@openzeppelin/contracts'), {
            recursive: true
        })
    }

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-mocks-'))
        process.chdir(fixtureDirectory)
        // Provide a hardhat.config.ts so `buildMockDeploymentScriptOrTest`
        // picks the TypeScript templates. buildMockContract itself does not
        // require a Hardhat config.
        fs.writeFileSync('hardhat.config.ts', 'export default {}\n')
        stubOpenZeppelinContracts()
    })

    afterEach(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
    })

    describe('buildMockContract', function () {
        it('creates contracts/ when it does not exist', async function () {
            expect(fs.existsSync('contracts')).to.equal(false)

            await buildMockContract('MockERC20')

            expect(fs.existsSync('contracts')).to.equal(true)
            expect(fs.existsSync('contracts/MockERC20.sol')).to.equal(true)
        })

        it('leaves an existing contracts/ directory untouched', async function () {
            fs.mkdirSync('contracts')
            const markerFile = path.join('contracts', 'MyContract.sol')
            fs.writeFileSync(markerFile, '// keep me')

            await buildMockContract('MockERC20')

            // Existing user file is preserved.
            expect(fs.readFileSync(markerFile, 'utf8')).to.equal('// keep me')
            // New mock landed next to it.
            expect(fs.existsSync('contracts/MockERC20.sol')).to.equal(true)
        })

        it('does not overwrite an existing mock contract', async function () {
            fs.mkdirSync('contracts')
            const existingPath = path.join('contracts', 'MockERC20.sol')
            fs.writeFileSync(existingPath, '// existing user edits')

            await buildMockContract('MockERC20')

            expect(fs.readFileSync(existingPath, 'utf8')).to.equal('// existing user edits')
        })

        it('is a no-op for an unknown mock contract name', async function () {
            await buildMockContract('MockThatDoesNotExist')

            // contracts/ should still be created (matches the new behavior),
            // but no .sol file should be added.
            expect(fs.existsSync('contracts')).to.equal(true)
            const entries = fs.readdirSync('contracts')
            expect(entries.filter((entry) => entry.endsWith('.sol'))).to.deep.equal([])
        })
    })

    describe('buildMockDeploymentScriptOrTest', function () {
        it('creates scripts/ when generating a deployment script', async function () {
            expect(fs.existsSync('scripts')).to.equal(false)

            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'deployment')

            expect(fs.existsSync('scripts')).to.equal(true)
            expect(fs.existsSync('scripts/deploy-Mock-ERC20.ts')).to.equal(true)
        })

        it('creates test/ when generating a test script', async function () {
            expect(fs.existsSync('test')).to.equal(false)

            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'test')

            expect(fs.existsSync('test')).to.equal(true)
            expect(fs.existsSync('test/test-Mock-ERC20.ts')).to.equal(true)
        })

        it('creates contracts/test/ when generating a Foundry test', async function () {
            expect(fs.existsSync('contracts/test')).to.equal(false)

            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'testForge')

            expect(fs.existsSync('contracts/test')).to.equal(true)
            expect(fs.existsSync('contracts/test/MockERC20.t.sol')).to.equal(true)
        })

        it('leaves an existing scripts/ directory and its files untouched', async function () {
            fs.mkdirSync('scripts')
            const userScript = path.join('scripts', 'my-deploy.ts')
            fs.writeFileSync(userScript, '// user script')

            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'deployment')

            expect(fs.readFileSync(userScript, 'utf8')).to.equal('// user script')
            expect(fs.existsSync('scripts/deploy-Mock-ERC20.ts')).to.equal(true)
        })

        it('does not overwrite an existing deployment script', async function () {
            fs.mkdirSync('scripts')
            const existing = path.join('scripts', 'deploy-Mock-ERC20.ts')
            fs.writeFileSync(existing, '// user edits')

            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'deployment')

            expect(fs.readFileSync(existing, 'utf8')).to.equal('// user edits')
        })

        it('succeeds when none of contracts/, scripts/, or test/ exist yet', async function () {
            // Sanity check: this is the exact situation from issue #168.
            expect(fs.existsSync('contracts')).to.equal(false)
            expect(fs.existsSync('scripts')).to.equal(false)
            expect(fs.existsSync('test')).to.equal(false)

            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'deployment')
            await buildMockDeploymentScriptOrTest('MockERC20', 'test')

            expect(fs.existsSync('contracts/MockERC20.sol')).to.equal(true)
            expect(fs.existsSync('scripts/deploy-Mock-ERC20.ts')).to.equal(true)
            expect(fs.existsSync('test/test-Mock-ERC20.ts')).to.equal(true)
        })
    })

    // Issue #159: the mock template language ships as a single TS source
    // of truth. When the consumer project uses `hardhat.config.js`, the JS
    // variant is generated from the TS template on the fly.
    describe('JS output for hardhat.config.js projects (issue #159)', function () {
        beforeEach(function () {
            // Replace the TS config with a JS one for this describe block.
            fs.rmSync('hardhat.config.ts')
            fs.writeFileSync('hardhat.config.js', 'module.exports = {}\n')
        })

        it('writes a CommonJS deployment script', async function () {
            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'deployment')

            expect(fs.existsSync('scripts/deploy-Mock-ERC20.js')).to.equal(true)
            expect(fs.existsSync('scripts/deploy-Mock-ERC20.ts')).to.equal(false)
            const generated = fs.readFileSync('scripts/deploy-Mock-ERC20.js', 'utf8')
            expect(generated).to.contain("const { addressBook, ethers, network } = require('hardhat')")
            expect(generated).to.not.match(/@ts-ignore-next-line/)
            expect(generated).to.contain('.then(() => process.exit(0))')
        })

        it('writes a CommonJS test script', async function () {
            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'test')

            expect(fs.existsSync('test/test-Mock-ERC20.js')).to.equal(true)
            expect(fs.existsSync('test/test-Mock-ERC20.ts')).to.equal(false)
            const generated = fs.readFileSync('test/test-Mock-ERC20.js', 'utf8')
            expect(generated).to.contain("const { expect } = require('chai')")
            expect(generated).to.contain("const { ethers } = require('hardhat')")
            expect(generated).to.not.match(/:\s*any/)
        })

        it('does not overwrite an existing JS deployment script', async function () {
            fs.mkdirSync('scripts')
            const existing = path.join('scripts', 'deploy-Mock-ERC20.js')
            fs.writeFileSync(existing, '// user edits')

            await buildMockContract('MockERC20')
            await buildMockDeploymentScriptOrTest('MockERC20', 'deployment')

            expect(fs.readFileSync(existing, 'utf8')).to.equal('// user edits')
        })
    })
})