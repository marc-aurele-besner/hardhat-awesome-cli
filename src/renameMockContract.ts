import type { IMockContractsList } from './types.ts'

/**
 * Validators for renaming a mock contract (issue #167).
 *
 * `isValidSolidityIdentifier` enforces the Solidity identifier grammar plus
 * the reserved-word list so the renamed artifact compiles without surprises.
 * `inheritanceConflicts` flags names that would shadow the parent contract
 * (or any other identifier the template relies on), which Solidity rejects
 * because `contract Foo is ERC20` and `contract ERC20 is …` cannot coexist in
 * the same source unit.
 *
 * Both helpers stay pure so the inquirer prompt flow and the
 * `--addCustomMockContract` CLI flag can share the same validation.
 */

// Solidity reserved words that the language spec forbids as identifiers.
// Sourced from https://docs.soliditylang.org/en/latest/grammar.html (the
// "Reserved Keywords" and "Keywords" lists). We do not try to be exhaustive
// across every legacy version — we only need the words a mock-contract name
// could plausibly collide with.
const SOLIDITY_RESERVED_WORDS = new Set<string>([
    'abstract',
    'after',
    'alias',
    'apply',
    'auto',
    'bool',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'constant',
    'continue',
    'contract',
    'default',
    'define',
    'delete',
    'do',
    'else',
    'emit',
    'enum',
    'error',
    'event',
    'external',
    'false',
    'final',
    'fixed',
    'for',
    'function',
    'hex',
    'if',
    'immutable',
    'implements',
    'import',
    'in',
    'indexed',
    'interface',
    'internal',
    'is',
    'library',
    'mapping',
    'match',
    'memory',
    'modifier',
    'new',
    'null',
    'of',
    'override',
    'partial',
    'payable',
    'pragma',
    'private',
    'protected',
    'public',
    'pure',
    'receive',
    'return',
    'returns',
    'revert',
    'sealed',
    'sizeof',
    'static',
    'storage',
    'string',
    'struct',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'type',
    'typedef',
    'typeid',
    'typeof',
    'uint',
    'unchecked',
    'unicode',
    'using',
    'var',
    'view',
    'virtual',
    'void',
    'volatile',
    'while',
    'address',
    'int',
    'int8',
    'int16',
    'int32',
    'int64',
    'int128',
    'int256',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'uint128',
    'uint256',
    'bytes',
    'bytes1',
    'bytes2',
    'bytes4',
    'bytes8',
    'bytes16',
    'bytes20',
    'bytes24',
    'bytes28',
    'bytes32'
])

// TypeScript / JavaScript reserved words the deploy script and Hardhat test
// templates emit (e.g. `let`, `const`, `function`). A rename that produces a
// TS keyword would silently break the generated source files, so reject it.
const TS_RESERVED_WORDS = new Set<string>([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'let',
    'async',
    'await',
    'of'
])

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

/**
 * `true` when the supplied string is a legal Solidity (and TypeScript)
 * identifier and does not collide with a reserved word from either language.
 */
export const isValidSolidityIdentifier = (name: string): boolean => {
    if (typeof name !== 'string') return false
    if (name.length === 0) return false
    if (!IDENTIFIER_PATTERN.test(name)) return false
    if (SOLIDITY_RESERVED_WORDS.has(name)) return false
    if (TS_RESERVED_WORDS.has(name)) return false
    return true
}

/**
 * Inherited identifier map for the bundled mock contracts.
 *
 * The templates declare their parent contracts via the `is` clause and the
 * OpenZeppelin `import` statement. We encode the parent names here so the
 * conflict check works without parsing the `.sol` file at runtime.
 *
 * Keys are the registry `IMockContractsList.name` field; values are the
 * identifier strings the source file references (and therefore cannot be
 * shadowed by the renamed contract).
 */
const INHERITED_IDENTIFIERS: Record<string, string[]> = {
    MockERC20: ['ERC20'],
    MockERC721: ['ERC721'],
    MockERC1155: ['ERC1155'],
    MockERC20Upgradeable: ['ERC20Upgradeable', 'Initializable'],
    MockERC721Upgradeable: ['ERC721Upgradeable', 'Initializable'],
    MockERC1155Upgradeable: ['ERC1155Upgradeable', 'Initializable'],
    MockProxyAdmin: ['ProxyAdmin'],
    MockTransparentUpgradeableProxy: ['TransparentUpgradeableProxy']
}

/**
 * Return the list of inherited identifiers (e.g. `ERC20`, `Initializable`)
 * that a rename would shadow. Empty array means the new name is safe.
 */
export const inheritanceConflicts = (customName: string, contract: IMockContractsList): string[] => {
    if (typeof customName !== 'string') return []
    const inherited = INHERITED_IDENTIFIERS[contract.name] ?? []
    return inherited.filter((parent) => parent === customName)
}

/**
 * One-shot validator used by the inquirer `validate` callback and the
 * `--addCustomMockContract` CLI flag. Returns `true` when the supplied name
 * is acceptable, otherwise a human-readable error string inquirer can
 * surface inline.
 */
export const validateRename = (customName: string, contract: IMockContractsList): true | string => {
    if (!isValidSolidityIdentifier(customName)) {
        return 'Contract name must start with a letter or underscore and contain only letters, digits and underscores, and must not be a Solidity or TypeScript reserved word.'
    }
    const conflicts = inheritanceConflicts(customName, contract)
    if (conflicts.length > 0) {
        return `Contract name conflicts with inherited identifier(s): ${conflicts.join(', ')}.`
    }
    return true
}