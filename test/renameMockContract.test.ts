import { expect } from 'chai'

import {
    formatAddCustomMockContractFlag,
    parseAddCustomMockContractFlag
} from '../src/serveInquirer.ts'
import {
    inheritanceConflicts,
    isValidSolidityIdentifier,
    validateRename
} from '../src/renameMockContract.ts'
import MockContractsList from '../src/mockContracts/index.ts'

/**
 * Unit tests for the rename validators. Issue #167.
 *
 * These cover the pure validators that gate the rename prompts in the
 * interactive flow and the `--addCustomMockContract` CLI flag. The
 * file-IO behaviour of `buildMockContract` / `buildMockDeploymentScriptOrTest`
 * with the new options is covered in `buildMockContracts.test.ts`.
 */
describe('renameMockContract (issue #167)', function () {
    describe('isValidSolidityIdentifier', function () {
        const validNames = ['MyToken', 'MyToken42', '_MyToken', 'token', 'TOKEN_2']
        for (const name of validNames) {
            it(`accepts ${name}`, function () {
                expect(isValidSolidityIdentifier(name)).to.equal(true)
            })
        }

        const invalidNames = [
            '1Token',
            'My-Token',
            'My Token',
            'My.Token',
            '',
            'contract',
            'function',
            'let',
            'const',
            'var',
            'true',
            'false',
            'uint256'
        ]
        for (const name of invalidNames) {
            it(`rejects ${JSON.stringify(name)}`, function () {
                expect(isValidSolidityIdentifier(name)).to.equal(false)
            })
        }
    })

    describe('inheritanceConflicts', function () {
        const mockERC20 = MockContractsList.find((entry) => entry.name === 'MockERC20')!
        const mockERC20Upgradeable = MockContractsList.find((entry) => entry.name === 'MockERC20Upgradeable')!
        const mockProxyAdmin = MockContractsList.find((entry) => entry.name === 'MockProxyAdmin')!

        it('flags the ERC20 parent identifier', function () {
            expect(inheritanceConflicts('ERC20', mockERC20)).to.deep.equal(['ERC20'])
        })

        it('flags the ERC721 parent identifier', function () {
            const mockERC721 = MockContractsList.find((entry) => entry.name === 'MockERC721')!
            expect(inheritanceConflicts('ERC721', mockERC721)).to.deep.equal(['ERC721'])
        })

        it('flags Initializable for upgradeable mocks', function () {
            expect(inheritanceConflicts('Initializable', mockERC20Upgradeable)).to.deep.equal(['Initializable'])
        })

        it('flags ProxyAdmin for the proxy admin mock', function () {
            expect(inheritanceConflicts('ProxyAdmin', mockProxyAdmin)).to.deep.equal(['ProxyAdmin'])
        })

        it('returns an empty list when no conflict exists', function () {
            expect(inheritanceConflicts('MyToken', mockERC20)).to.deep.equal([])
        })
    })

    describe('validateRename', function () {
        const mockERC20 = MockContractsList.find((entry) => entry.name === 'MockERC20')!
        const mockERC20Upgradeable = MockContractsList.find((entry) => entry.name === 'MockERC20Upgradeable')!

        it('accepts a valid, non-conflicting name', function () {
            expect(validateRename('MyToken', mockERC20)).to.equal(true)
        })

        it('rejects a name that clashes with an inherited identifier', function () {
            const result = validateRename('ERC20', mockERC20)
            expect(typeof result).to.equal('string')
            expect(result as string).to.contain('ERC20')
        })

        it('rejects a name that clashes with Initializable for upgradeable mocks', function () {
            const result = validateRename('Initializable', mockERC20Upgradeable)
            expect(typeof result).to.equal('string')
            expect(result as string).to.contain('Initializable')
        })

        it('rejects an invalid identifier with a Solidity-style hint', function () {
            const result = validateRename('1Token', mockERC20)
            expect(typeof result).to.equal('string')
            expect(result as string).to.contain('reserved')
        })
    })

    describe('--addCustomMockContract flag round-trip', function () {
        it('round-trips a well-formed value', function () {
            const formatted = formatAddCustomMockContractFlag('MockERC20', 'MyToken', 'MyToken', 'MOCK')
            expect(formatted).to.equal('MockERC20:MyToken:MyToken:MOCK')
            expect(parseAddCustomMockContractFlag(formatted)).to.deep.equal({
                registryName: 'MockERC20',
                customName: 'MyToken',
                constructorName: 'MyToken',
                constructorSymbol: 'MOCK'
            })
        })

        it('rejects a value with the wrong number of segments', function () {
            expect(parseAddCustomMockContractFlag('MockERC20:MyToken')).to.equal(undefined)
            expect(parseAddCustomMockContractFlag('MockERC20:MyToken:MyToken:MOCK:extra')).to.equal(undefined)
        })

        it('rejects undefined and empty inputs', function () {
            expect(parseAddCustomMockContractFlag(undefined)).to.equal(undefined)
            expect(parseAddCustomMockContractFlag('')).to.equal(undefined)
        })
    })
})