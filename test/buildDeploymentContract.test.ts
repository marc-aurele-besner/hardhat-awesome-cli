import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import buildDeploymentContract, {
    formatAddDeploymentScriptFlag,
    parseAddDeploymentScriptFlag,
    renderDeploymentScript
} from '../src/buildDeploymentContract.ts'

/**
 * Tests for the deployment-script generator (issue #166).
 *
 * Mirrors the structure of `buildMockContracts.test.ts`:
 *   - Each test runs in its own `mkdtempSync` fixture so file-system state
 *     does not leak between cases.
 *   - The fixture provides a `hardhat.config.ts` so the generator picks
 *     the TypeScript variant of the template.
 */
describe('buildDeploymentContract (issue #166)', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-deploy-'))
        process.chdir(fixtureDirectory)
        fs.writeFileSync('hardhat.config.ts', 'export default {}\n')
    })

    afterEach(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
    })

    describe('renderDeploymentScript', function () {
        it('substitutes the contract name into every identifier slot', function () {
            const rendered = renderDeploymentScript({ customName: 'MyToken' })

            expect(rendered).to.contain("await ethers.getContractFactory('MyToken')")
            expect(rendered).to.contain('const MyToken = await ethers.getContractFactory')
            expect(rendered).to.contain('const myToken = await MyToken.deploy')
            expect(rendered).to.contain("await addressBook.saveContract('MyToken'")
            expect(rendered).to.contain('MyToken deployed to:')
            // No leftover placeholder text
            expect(rendered).to.not.contain('__CONTRACT_NAME__')
            expect(rendered).to.not.contain('__CAMEL_NAME__')
            expect(rendered).to.not.contain('__CONSTRUCTOR_ARGS__')
        })

        it('emits an empty .deploy(...) call when no constructor args are supplied', function () {
            const rendered = renderDeploymentScript({ customName: 'MyToken' })

            expect(rendered).to.contain('const myToken = await MyToken.deploy()')
        })

        it('forwards constructor arguments to .deploy(...) in source order', function () {
            const rendered = renderDeploymentScript({
                customName: 'MyToken',
                constructorArgs: ['0xTokenAddress', '1000000']
            })

            expect(rendered).to.contain('const myToken = await MyToken.deploy(0xTokenAddress, 1000000)')
        })
    })

    describe('flag helpers', function () {
        it('round-trips a contract name with no constructor args', function () {
            const formatted = formatAddDeploymentScriptFlag('MyToken')
            expect(formatted).to.equal('MyToken')
            const parsed = parseAddDeploymentScriptFlag(formatted)
            expect(parsed).to.deep.equal({ contractName: 'MyToken', constructorArgs: [] })
        })

        it('round-trips a contract name with constructor args', function () {
            const formatted = formatAddDeploymentScriptFlag('MyToken', ['0xToken', '42'])
            expect(formatted).to.equal('MyToken:0xToken:42')
            const parsed = parseAddDeploymentScriptFlag(formatted)
            expect(parsed).to.deep.equal({ contractName: 'MyToken', constructorArgs: ['0xToken', '42'] })
        })

        it('returns undefined for an empty or malformed flag value', function () {
            expect(parseAddDeploymentScriptFlag(undefined)).to.equal(undefined)
            expect(parseAddDeploymentScriptFlag('')).to.equal(undefined)
            expect(parseAddDeploymentScriptFlag(':leadingColon')).to.equal(undefined)
        })
    })

    describe('buildDeploymentContract', function () {
        it('creates scripts/ when it does not exist', function () {
            expect(fs.existsSync('scripts')).to.equal(false)

            const writtenPath = buildDeploymentContract('MyToken')

            expect(writtenPath).to.equal('scripts/deploy-my-token.ts')
            expect(fs.existsSync('scripts')).to.equal(true)
            expect(fs.existsSync('scripts/deploy-my-token.ts')).to.equal(true)
        })

        it('leaves an existing scripts/ directory and its files untouched', function () {
            fs.mkdirSync('scripts')
            const userScript = path.join('scripts', 'my-existing-script.ts')
            fs.writeFileSync(userScript, '// user script')

            buildDeploymentContract('MyToken')

            expect(fs.readFileSync(userScript, 'utf8')).to.equal('// user script')
            expect(fs.existsSync('scripts/deploy-my-token.ts')).to.equal(true)
        })

        it('does not overwrite an existing deployment script', function () {
            fs.mkdirSync('scripts')
            const existing = path.join('scripts', 'deploy-my-token.ts')
            fs.writeFileSync(existing, '// user edits')

            const result = buildDeploymentContract('MyToken')

            expect(result).to.equal(undefined)
            expect(fs.readFileSync(existing, 'utf8')).to.equal('// user edits')
        })

        it('writes a CommonJS script for hardhat.config.js projects', function () {
            fs.rmSync('hardhat.config.ts')
            fs.writeFileSync('hardhat.config.js', 'module.exports = {}\n')

            const writtenPath = buildDeploymentContract('MyToken')

            expect(writtenPath).to.equal('scripts/deploy-my-token.js')
            expect(fs.existsSync('scripts/deploy-my-token.ts')).to.equal(false)
            const generated = fs.readFileSync('scripts/deploy-my-token.js', 'utf8')
            expect(generated).to.contain("const { addressBook, ethers, network } = require('hardhat')")
            expect(generated).to.contain("getContractFactory('MyToken')")
            expect(generated).to.not.match(/@ts-ignore-next-line/)
            expect(generated).to.contain('.then(() => process.exit(0))')
        })

        it('forwards constructor arguments to the generated script', function () {
            buildDeploymentContract('MyToken', { constructorArgs: ['0xToken', '42'] })

            const generated = fs.readFileSync('scripts/deploy-my-token.ts', 'utf8')
            expect(generated).to.contain('const myToken = await MyToken.deploy(0xToken, 42)')
            expect(generated).to.contain("addressBook.saveContract('MyToken'")
        })

        it('uses PascalCase identifiers for multi-word contract names', function () {
            buildDeploymentContract('MyERC20Token')

            const generated = fs.readFileSync('scripts/deploy-my-erc20-token.ts', 'utf8')
            expect(generated).to.contain("getContractFactory('MyERC20Token')")
            expect(generated).to.contain('const MyERC20Token = await ethers.getContractFactory')
            expect(generated).to.contain('const myERC20Token = await MyERC20Token.deploy')
        })

        it('is a no-op when no contract name is supplied', function () {
            const result = buildDeploymentContract('')

            expect(result).to.equal(undefined)
            expect(fs.existsSync('scripts')).to.equal(false)
        })
    })
})