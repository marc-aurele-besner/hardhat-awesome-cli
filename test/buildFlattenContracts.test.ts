import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
    FLATTEN_ALL_KEYWORD,
    buildFlattenCommand,
    formatFlattenContractFlag,
    parseFlattenContractFlag,
    renameFlattenedLicenseAndPragma,
    resolveContractFile,
    resolveFlattenOutputPath
} from '../src/buildFlattenContracts.ts'

/**
 * Tests for the flatten-contracts helper module (issue #165).
 *
 * Mirrors the structure of `buildVerifyContract.test.ts`: each test focuses
 * on a pure helper that can be exercised without spawning `npx hardhat`,
 * which would otherwise require a full Hardhat project. The `runFlattenContract`
 * composition is covered by the helper tests plus the existing `utils.test.ts`
 * coverage of `runCommand`.
 *
 * `runFlattenContract` itself is exercised through the cli.test.ts smoke
 * path on every CI run (the integration tests load the full menu + CLI
 * surface).
 */
describe('buildFlattenContracts (issue #165)', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-flatten-'))
        process.chdir(fixtureDirectory)
        fs.mkdirSync('contracts')
    })

    afterEach(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
    })

    describe('resolveContractFile', function () {
        it('returns undefined for the "all" sentinel', function () {
            expect(resolveContractFile(FLATTEN_ALL_KEYWORD)).to.equal(undefined)
        })

        it('returns undefined for an empty contract name', function () {
            expect(resolveContractFile('')).to.equal(undefined)
        })

        it('returns undefined when the contracts directory is missing', function () {
            fs.rmSync('contracts', { recursive: true })
            expect(resolveContractFile('MyToken')).to.equal(undefined)
        })

        it('matches a contract at the root of contracts/', function () {
            fs.writeFileSync('contracts/MyToken.sol', '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n')

            expect(resolveContractFile('MyToken')).to.equal('MyToken.sol')
        })

        it('matches when the input already carries the .sol extension', function () {
            fs.writeFileSync('contracts/MyToken.sol', '// SPDX-License-Identifier: MIT\n')

            expect(resolveContractFile('MyToken.sol')).to.equal('MyToken.sol')
        })

        it('matches a contract nested under a sub-directory', function () {
            fs.mkdirSync('contracts/utils')
            fs.writeFileSync('contracts/utils/Helper.sol', '// SPDX-License-Identifier: MIT\n')

            expect(resolveContractFile('utils/Helper')).to.equal('utils/Helper.sol')
            expect(resolveContractFile('Helper')).to.equal('utils/Helper.sol')
        })

        it('returns undefined when no file matches the contract name', function () {
            fs.writeFileSync('contracts/MyToken.sol', '// SPDX-License-Identifier: MIT\n')

            expect(resolveContractFile('Unknown')).to.equal(undefined)
        })
    })

    describe('buildFlattenCommand', function () {
        it('Builds the no-arg command for "flatten everything"', function () {
            expect(buildFlattenCommand()).to.equal('npx hardhat flatten')
            expect(buildFlattenCommand(undefined)).to.equal('npx hardhat flatten')
        })

        it('Appends contracts/<file> when given a file path', function () {
            expect(buildFlattenCommand('MyToken.sol')).to.equal('npx hardhat flatten contracts/MyToken.sol')
        })

        it('Keeps nested paths under contracts/', function () {
            expect(buildFlattenCommand('utils/Helper.sol')).to.equal(
                'npx hardhat flatten contracts/utils/Helper.sol'
            )
        })
    })

    describe('resolveFlattenOutputPath', function () {
        it('Maps the "all" entry to <prefix>All.sol', function () {
            expect(resolveFlattenOutputPath(undefined, 'contractsFlatten', 'flat_')).to.equal(
                'contractsFlatten/flat_All.sol'
            )
        })

        it('Replaces slashes with hyphens for nested files', function () {
            expect(resolveFlattenOutputPath('utils/Helper.sol', 'contractsFlatten', 'flat_')).to.equal(
                'contractsFlatten/flat_utils-Helper.sol'
            )
        })

        it('Honours a custom flatten directory and prefix', function () {
            expect(resolveFlattenOutputPath('MyToken.sol', 'flattened', 'combined_')).to.equal(
                'flattened/combined_MyToken.sol'
            )
        })
    })

    describe('renameFlattenedLicenseAndPragma', function () {
        it('Renames SPDX-License-Identifier to the disabled variant', function () {
            const filePath = 'contractsFlatten/flat_MyToken.sol'
            fs.mkdirSync('contractsFlatten')
            fs.writeFileSync(filePath, '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n')

            const result = renameFlattenedLicenseAndPragma(filePath)

            expect(result).to.deep.equal({ spdx: true, pragma: true })
            const updated = fs.readFileSync(filePath, 'utf8')
            expect(updated).to.contain('SPDX-License-DISABLED-Identifier')
            expect(updated).to.not.contain('SPDX-License-Identifier: MIT')
            expect(updated).to.contain('// pragma solidity')
        })

        it('Reports missing rewrites when the file does not contain them', function () {
            const filePath = 'contractsFlatten/flat_Empty.sol'
            fs.mkdirSync('contractsFlatten')
            fs.writeFileSync(filePath, '// nothing to rename here\n')

            const result = renameFlattenedLicenseAndPragma(filePath)

            expect(result).to.deep.equal({ spdx: false, pragma: false })
        })

        it('Returns false flags when the file is missing or empty', function () {
            expect(renameFlattenedLicenseAndPragma('contractsFlatten/flat_Missing.sol')).to.deep.equal({
                spdx: false,
                pragma: false
            })

            fs.mkdirSync('contractsFlatten')
            fs.writeFileSync('contractsFlatten/flat_Empty.sol', '')
            expect(renameFlattenedLicenseAndPragma('contractsFlatten/flat_Empty.sol')).to.deep.equal({
                spdx: false,
                pragma: false
            })
        })
    })

    describe('formatFlattenContractFlag / parseFlattenContractFlag', function () {
        it('Round-trips a bare contract name', function () {
            const formatted = formatFlattenContractFlag('MyToken')
            expect(formatted).to.equal('MyToken')
            const parsed = parseFlattenContractFlag(formatted)
            expect(parsed).to.deep.equal({ contractName: 'MyToken', renameLicenseIdentifier: false })
        })

        it('Round-trips a contract name with the renameLicense suffix', function () {
            const formatted = formatFlattenContractFlag('MyToken', true)
            expect(formatted).to.equal('MyToken:renameLicense')
            const parsed = parseFlattenContractFlag(formatted)
            expect(parsed).to.deep.equal({ contractName: 'MyToken', renameLicenseIdentifier: true })
        })

        it('Round-trips the "all" sentinel with the rename suffix', function () {
            const formatted = formatFlattenContractFlag('all', true)
            expect(formatted).to.equal('all:renameLicense')
            const parsed = parseFlattenContractFlag(formatted)
            expect(parsed).to.deep.equal({ contractName: 'all', renameLicenseIdentifier: true })
        })

        it('Returns undefined for an empty or missing flag value', function () {
            expect(parseFlattenContractFlag(undefined)).to.equal(undefined)
            expect(parseFlattenContractFlag('')).to.equal(undefined)
        })

        it('Returns undefined when the contract name segment is empty', function () {
            expect(parseFlattenContractFlag(':renameLicense')).to.equal(undefined)
        })

        it('Ignores unknown suffixes but still honours renameLicense', function () {
            const parsed = parseFlattenContractFlag('MyToken:extra:renameLicense')
            expect(parsed).to.deep.equal({ contractName: 'MyToken', renameLicenseIdentifier: true })
        })
    })
})
