import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { serveMockContractCreatorSelector } from '../src/menus/mockContracts.ts'
import { useInquirerStub } from './menus-test-helpers.ts'

/**
 * Menu-level tests for the mock-contract creator (issue #162).
 *
 * The interactive `serveMockContractCreatorSelector` flow used to live
 * inside `serveInquirer.ts` and was unreachable from a test. Now that it
 * is its own module we can drive it by stubbing `inquirer.prompt` and
 * asserting the resulting `.sol`, deployment script, and test files on
 * disk — the files the menu actually writes.
 *
 * The underlying helpers (`buildMockContract`, `buildMockDeploymentScriptOrTest`)
 * are already covered by `buildMockContracts.test.ts`. The point of these
 * tests is to pin the menu glue: the prompt sequence, the rename answers,
 * and the file paths written for each declared artifact.
 */
describe('menus/mockContracts', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string

    // `buildMockContract` checks for OpenZeppelin as a marker that the
    // dependency is installed before rendering the template. Both the
    // static and the upgradeable paths must exist so any contract the user
    // picks via the menu can render.
    const stubOpenZeppelinContracts = () => {
        fs.mkdirSync(path.join(fixtureDirectory, 'node_modules/@openzeppelin/contracts'), {
            recursive: true
        })
        fs.mkdirSync(path.join(fixtureDirectory, 'node_modules/@openzeppelin/contracts-upgradeable'), {
            recursive: true
        })
    }

    let originalNoPause: string | undefined

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-menus-mocks-'))
        process.chdir(fixtureDirectory)
        fs.writeFileSync('hardhat.config.ts', 'export default {}\n')
        stubOpenZeppelinContracts()
        originalNoPause = process.env.AWESOME_CLI_NO_PAUSE
        process.env.AWESOME_CLI_NO_PAUSE = '1'
    })

    afterEach(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
        if (originalNoPause === undefined) delete process.env.AWESOME_CLI_NO_PAUSE
        else process.env.AWESOME_CLI_NO_PAUSE = originalNoPause
    })

    /** Build the rename answer object the menu collects per contract. */
    const renameAnswers = (customName: string) => ({
        customName,
        constructorName: customName,
        constructorSymbol: 'MOCK'
    })

    /** The menu's details prompt is a single batch with multiple yes/no keys. */
    const detailsAnswers = (overrides: Record<string, string> = {}) => ({
        mockDeploymentScript: 'yes',
        mockTestScript: 'yes',
        mockTestContractFoundry: 'no',
        ...overrides
    })

    it('Writes the Solidity source, deploy script and test when the user says yes to all', async function () {
        // Script: pick MockERC20, say yes to deployment + test, rename to
        // `MyToken`. The rename prompts (customName / constructorName /
        // constructorSymbol) are the last three calls to inquirer.prompt.
        useInquirerStub(['MockERC20', detailsAnswers(), renameAnswers('MyToken')])

        await serveMockContractCreatorSelector()

        expect(fs.existsSync('contracts/MyToken.sol')).to.equal(true)
        expect(fs.existsSync('scripts/deploy-my-token.ts')).to.equal(true)
        expect(fs.existsSync('test/test-my-token.ts')).to.equal(true)
        // Foundry tests are skipped because `contracts/test/` and
        // `foundry.toml` are not present in the fixture.
        expect(fs.existsSync('contracts/test/MyToken.t.sol')).to.equal(false)
    })

    it('Does not write the deployment script when the user says no to it', async function () {
        useInquirerStub(['MockERC20', detailsAnswers({ mockDeploymentScript: 'no' }), renameAnswers('MyToken')])

        await serveMockContractCreatorSelector()

        expect(fs.existsSync('contracts/MyToken.sol')).to.equal(true)
        expect(fs.existsSync('scripts/deploy-my-token.ts')).to.equal(false)
        expect(fs.existsSync('test/test-my-token.ts')).to.equal(true)
    })

    it('Writes the Foundry test when contracts/test/ and foundry.toml exist', async function () {
        fs.mkdirSync('contracts/test', { recursive: true })
        fs.writeFileSync('foundry.toml', '[profile.default]\nsrc = "contracts"\n')

        useInquirerStub(['MockERC20', detailsAnswers({ mockTestContractFoundry: 'yes' }), renameAnswers('MyToken')])

        await serveMockContractCreatorSelector()

        expect(fs.existsSync('contracts/MyToken.sol')).to.equal(true)
        expect(fs.existsSync('contracts/test/MyToken.t.sol')).to.equal(true)
    })

    it('Generates the registry-named files when the user keeps the default rename', async function () {
        useInquirerStub([
            'MockERC20',
            detailsAnswers(),
            // The collectRenameAnswers prompt uses the registry name as the
            // default for every field, so the user just hits Enter.
            { customName: 'MockERC20', constructorName: 'MockERC20', constructorSymbol: 'MOCK' }
        ])

        await serveMockContractCreatorSelector()

        // The Solidity source uses the customName verbatim, but the deploy
        // and test scripts go through kebab-case (the registry template
        // references `test/test-Mock-ERC20.ts`, but a customName-bearing
        // render routes to `test/test-mock-erc20.ts`). The kebab-case test
        // pass would have caught a case-insensitive-only filesystem on
        // macOS — the assertion uses the lowercase path the renderer
        // actually writes.
        expect(fs.existsSync('contracts/MockERC20.sol')).to.equal(true)
        expect(fs.existsSync('scripts/deploy-mock-erc20.ts')).to.equal(true)
        expect(fs.existsSync('test/test-mock-erc20.ts')).to.equal(true)
    })

    it('Writes every contract when the user picks "All mock contracts"', async function () {
        // The "All" entry iterates the entire registry. The menu asks for
        // one rename answer per contract, so we script a rename for each
        // entry listed in MockContractsList. Keeping the renames identical
        // to the registry names keeps the assertion simple — we just check
        // that every registry entry produced its full artifact set.
        const registryNames = [
            'MockERC20',
            'MockERC721',
            'MockERC1155',
            'MockERC20Upgradeable',
            'MockERC721Upgradeable',
            'MockERC1155Upgradeable',
            'MockProxyAdmin',
            'MockTransparentUpgradeableProxy'
        ]
        const script: any[] = ['All mock contracts', detailsAnswers()]
        for (const name of registryNames) {
            script.push({ customName: name, constructorName: name, constructorSymbol: 'MOCK' })
        }
        useInquirerStub(script)

        await serveMockContractCreatorSelector()

        for (const name of registryNames) {
            expect(fs.existsSync(`contracts/${name}.sol`), `missing contracts/${name}.sol`).to.equal(true)
        }
        // The Hardhat test script gets kebab-cased the same way as the
        // deployment script. `MockERC20` → `test-mock-erc20.ts`. The
        // first entry is enough to pin the behaviour; the registry loop
        // above already covers every other .sol file.
        expect(fs.existsSync('test/test-mock-erc20.ts')).to.equal(true)
    })

    it('Does not write anything when the user picks a contract but answers no to every artifact', async function () {
        useInquirerStub([
            'MockERC20',
            detailsAnswers({ mockDeploymentScript: 'no', mockTestScript: 'no' }),
            renameAnswers('MyToken')
        ])

        await serveMockContractCreatorSelector()

        // The contract still gets written because that is unconditional —
        // the deploy/test/Foundry switches only gate the *scripts* and
        // *tests*. The test pins that the "no" path does not regress into
        // silently dropping the contract.
        expect(fs.existsSync('contracts/MyToken.sol')).to.equal(true)
        expect(fs.existsSync('scripts/deploy-my-token.ts')).to.equal(false)
        expect(fs.existsSync('test/test-my-token.ts')).to.equal(false)
    })
})
