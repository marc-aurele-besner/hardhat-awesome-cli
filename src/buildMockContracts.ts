import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import MockContractsList from './mockContracts/index.ts'
import detectPackage from './packageInstaller.ts'
import { transformTsToJs } from './utils.ts'
import type { IMockContractsList } from './types.ts'

/**
 * Locate the packaged `mockContracts` directory holding the Solidity, deployment
 * script and test templates.
 *
 * Only the source tree carries those templates: `package.json` ships both `src/`
 * and `dist/`, but `tsc` merely compiles `.ts` files, it never copies the `.sol`
 * assets into `dist/`. So `dist/src/mockContracts` exists yet is incomplete,
 * which is why the candidates below are validated against a marker file instead
 * of a plain directory check.
 *
 * Hardhat 2 resolved this from `require.main.filename`; `require` does not exist
 * in an ES module, so we resolve relative to this file instead.
 */
const resolveMockContractsPath = (): string | undefined => {
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const candidates = [
        path.join(currentDir, 'mockContracts'), // running from src/
        path.join(currentDir, '../../src/mockContracts') // running from dist/src/
    ]
    return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'MockERC20.sol')))
}

/**
 * Optional inputs accepted by `buildMockContract` and
 * `buildMockDeploymentScriptOrTest` so a user can rename and customize a mock
 * contract through the CLI (issue #167).
 *
 * - `customName` overrides the contract identifier across every generated
 *   artifact (Solidity source, deploy script, Hardhat test, Foundry test).
 * - `constructorArgs` replaces the default name/symbol string literals passed
 *   to the inherited constructor (or initializer for upgradeable mocks).
 *
 * When both fields are omitted the function behaves exactly as before — the
 *   `MockERC20` / `MockERC721` / … flow stays untouched.
 */
export interface IRenameOptions {
    customName?: string
    constructorArgs?: string[]
}

const camelCase = (name: string): string => {
    if (name.length === 0) return name
    return name[0].toLowerCase() + name.slice(1)
}

const kebabCase = (name: string): string =>
    name
        // Insert a hyphen between a lowercase/digit and an uppercase letter
        // (e.g. `MyToken` → `my-token`, `MyERC20` → `my-erc20`).
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .toLowerCase()

const escapeForDoubleQuotes = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

/**
 * Rewrite a mock-contract template so every identifier, import path,
 * constructor literal and test reference points at the renamed contract.
 *
 * The substitution strategy is deterministic and intentionally simple:
 *
 * 1. Walk the source line-by-line so multi-line replacements do not collide.
 * 2. Replace the registry-supplied name (`MockERC20`) with the user-supplied
 *    name everywhere it appears — including `import { MockERC20 } from …`,
 *    `describe('MockERC20', ...)`, and `getContractFactory('MockERC20')`.
 * 3. Replace the camelCase variant (`mockERC20`) with the camelCase form of
 *    the user-supplied name.
 * 4. For upgradeable mocks, also rewrite the `__<Name>_init` /
 *    `__<Name>_init_unchained` internal helpers the template emits so the
 *    rename is self-consistent.
 * 5. Override the constructor string literals when `constructorArgs` is set,
 *    in the order the parent contract consumes them (name first, symbol
 *    second for ERC20/721/1155 families).
 *
 * Returning the rendered text keeps the function pure and easy to test in
 * isolation — the callers (`buildMockContract` /
 * `buildMockDeploymentScriptOrTest`) are responsible for the file IO and the
 * path routing.
 */
export const renderMockTemplate = (
    raw: string,
    contract: IMockContractsList,
    options: IRenameOptions = {}
): string => {
    if (!options.customName && (!options.constructorArgs || options.constructorArgs.length === 0)) {
        return raw
    }

    const sourceName = contract.name
    const customName = options.customName ?? sourceName
    const sourceCamel = camelCase(sourceName)
    const customCamel = camelCase(customName)

    const lines = raw.split('\n')
    const out: string[] = []

    // Track the next constructor-argument slot to substitute. Each iteration
    // first counts how many literals on the original line fall inside the
    // parent constructor signature, then performs that many substitutions in
    // source order. We never touch literals after the parent constructor on
    // the same line because the mock templates do not emit any.
    let constructorArgIndex = 0

    for (const originalLine of lines) {
        let line = originalLine

        // Constructor / initializer literals MUST be rewritten before the
        // identifier rename — the literal `'MockERC20'` shares the same
        // substring as the registry name, so the identifier pass would
        // collapse both into the custom name and the literal substitution
        // would no longer match.
        if (options.constructorArgs && options.constructorArgs.length > 0) {
            const matchCount = countConstructorLiterals(originalLine)
            const take = Math.min(matchCount, options.constructorArgs.length - constructorArgIndex)
            if (take > 0) {
                line = substituteConstructorLiterals(line, options.constructorArgs, take, constructorArgIndex)
                constructorArgIndex += take
            }
        }

        // Rename `__<SourceName>_init` / `__<SourceName>_init_unchained`
        // helper calls (upgradeable mocks only). We only touch the
        // double-underscore prefix so we do not collide with the constructor
        // string literal below.
        if (contract.upgradeable) {
            const initPattern = new RegExp(`__${sourceName}_init`, 'g')
            line = line.replace(initPattern, `__${customName}_init`)
        }

        // Replace the registry name and its camelCase variant with the
        // user-supplied form. Order matters: do the original name first so a
        // rename to a name that overlaps the original (e.g. `MockERC20` →
        // `mockERC20`) does not rewrite the camelCase form incorrectly.
        line = line.split(sourceName).join(customName)
        if (sourceCamel !== customCamel) {
            line = line.split(sourceCamel).join(customCamel)
        }

        out.push(line)
    }

    return out.join('\n')
}

/**
 * Match the parent constructor call on a single Solidity / TS line. We only
 * recognise the OpenZeppelin-style signatures the bundled mocks emit:
 *
 * - Non-upgradeable: `ERC20('Name', 'Symbol')`, `ERC721(...)`,
 *   `ERC1155(...)`
 * - Upgradeable: `__<Name>_init('Name', 'Symbol')` /
 *   `__<Name>_init_unchained('Name', 'Symbol')`
 *
 * Anchoring on the parent identifier keeps the substitution off the test
 * title (`describe('MockERC20', ...)`) and other unrelated string literals
 * that may live further down the same line.
 */
const PARENT_CONSTRUCTOR_PATTERN = /\b(ERC20|ERC721|ERC1155|ERC20Upgradeable|ERC721Upgradeable|ERC1155Upgradeable|ProxyAdmin|TransparentUpgradeableProxy|__\w+_init)\s*\(/

/**
 * Count the number of string literals that fall inside the parent
 * constructor signature on `line`. Used to advance the constructor-argument
 * index after each substitution pass without affecting unrelated literals
 * (e.g. the test title `describe('MockERC20', ...)`).
 */
const countConstructorLiterals = (line: string): number => {
    const callMatch = line.match(PARENT_CONSTRUCTOR_PATTERN)
    if (!callMatch || callMatch.index === undefined) return 0
    const openParen = callMatch.index + callMatch[0].length - 1
    const closeParen = line.indexOf(')', openParen)
    if (closeParen === -1) return 0
    const inside = line.slice(openParen + 1, closeParen)
    const literalMatches = inside.match(/(['"])([^'"\n]*?)\1/g)
    return literalMatches ? literalMatches.length : 0
}

/**
 * Rewrite the string literals inside the parent constructor signature on
 * `line` with the next `take` entries of `args` (in source order).
 *
 * We anchor on the parent-constructor identifier (e.g. `ERC20(`, `__Foo_init(`)
 * so the substitution only touches literals that belong to the constructor —
 * the test title `describe('MockERC20', ...)` lives further down the line
 * and is handled by the identifier rename pass that follows.
 */
const substituteConstructorLiterals = (
    line: string,
    args: string[],
    take: number,
    startIndex: number
): string => {
    const callMatch = line.match(PARENT_CONSTRUCTOR_PATTERN)
    if (!callMatch || callMatch.index === undefined) return line
    const openParen = callMatch.index + callMatch[0].length - 1
    const closeParen = line.indexOf(')', openParen)
    if (closeParen === -1) return line

    const literalPattern = /(['"])([^'"\n]*?)\1/g
    let index = startIndex
    let count = 0
    const before = line.slice(0, openParen + 1)
    const middle = line.slice(openParen + 1, closeParen)
    const after = line.slice(closeParen)

    const rewritten = middle.replace(literalPattern, (_match, quote, value) => {
        if (count >= take || index >= args.length) {
            count++
            return `${quote}${value}${quote}`
        }
        const replacement = escapeForDoubleQuotes(args[index])
        index++
        count++
        return `${quote}${replacement}${quote}`
    })

    return before + rewritten + after
}

const buildMockContract = async (contractName: string, options: IRenameOptions = {}) => {
    const packageRootPath = resolveMockContractsPath()
    if (!packageRootPath) return

    // Ensure `contracts/` exists before writing any artifacts. `recursive: true`
    // makes this a no-op when the directory is already present, so projects that
    // already ship a `contracts/` folder are not touched (closes #168).
    fs.mkdirSync('contracts', { recursive: true })

    if (!MockContractsList) return

    const contractToMock: IMockContractsList[] = MockContractsList.filter(
        (contract) => contract.name === contractName
    )
    if (contractToMock.length === 0) return

    const finalName = options.customName ?? contractName
    const contractFile = `contracts/${finalName}.sol`
    if (fs.existsSync(contractFile)) {
        console.log('\x1b[33m%s\x1b[0m', 'Mock contract already exists')
        return
    }

    console.log('\x1b[32m%s\x1b[0m', 'Creating ', finalName, ' in contracts/')
    const rawTemplate = fs.readFileSync(path.join(packageRootPath, `${contractName}.sol`), 'utf8')
    const rendered = renderMockTemplate(rawTemplate, contractToMock[0], options)
    fs.writeFileSync(contractFile, rendered)

    if (contractToMock[0].dependencies && contractToMock[0].dependencies.length > 0) {
        for (const dependency of contractToMock[0].dependencies) {
            // `detectPackage` now awaits the underlying `npm install`
            // itself, so there is no need for a fixed post-install sleep.
            await detectPackage(dependency, true, false, false)
        }
    }
}

/**
 * Pick the file extension that matches the consumer project's Hardhat config.
 *
 * Templates ship as TypeScript (the single source of truth, see #159). When
 * the consumer uses `hardhat.config.js` we still want to write a `.js` file,
 * so the JS variant is generated from the TS template at write time.
 */
const pickArtifactExtension = (): 'ts' | 'js' => {
    if (fs.existsSync('hardhat.config.ts')) return 'ts'
    if (fs.existsSync('hardhat.config.js')) return 'js'
    // No Hardhat config present — fall back to TS, which is the canonical
    // template language and what Hardhat 3 expects.
    return 'ts'
}

const swapExtension = (filePath: string, target: 'ts' | 'js' | 'sol'): string => {
    if (target === 'ts') return filePath.replace(/\.js$/, '.ts')
    if (target === 'sol') return filePath
    return filePath.replace(/\.ts$/, '.js')
}

/**
 * Resolve the path the consumer receives for a given mock artifact type
 * (deployment, test, Foundry test). When `customName` is provided the path
 * uses the kebab-case form of the custom name so the filename matches the
 * pattern users expect from the bundled mocks (`deploy-Mock-ERC20.ts`,
 * `test-Mock-ERC20.ts`).
 */
const resolveArtifactPath = (
    contract: IMockContractsList,
    type: 'deployment' | 'test' | 'testForge',
    customName: string | undefined,
    extension: 'ts' | 'js' | 'sol'
): { finalPath: string; scriptOrTestDir: string; templatePath: string } | undefined => {
    let templatePath: string
    let scriptOrTestDir: string
    let customPathTemplate: string

    if (type === 'deployment') {
        if (!contract.deploymentScript) return undefined
        templatePath = contract.deploymentScript
        scriptOrTestDir = 'scripts'
        if (customName) {
            customPathTemplate = `scripts/deploy-${kebabCase(customName)}.${extension}`
        } else {
            customPathTemplate = templatePath
        }
    } else if (type === 'test') {
        if (!contract.testScript) return undefined
        templatePath = contract.testScript
        scriptOrTestDir = 'test'
        if (customName) {
            customPathTemplate = `test/test-${kebabCase(customName)}.${extension}`
        } else {
            customPathTemplate = templatePath
        }
    } else if (type === 'testForge') {
        if (!contract.testContractFoundry) return undefined
        templatePath = contract.testContractFoundry
        scriptOrTestDir = 'contracts/test'
        if (customName) {
            customPathTemplate = `contracts/test/${customName}.t.sol`
        } else {
            customPathTemplate = templatePath.replace('testForge/', 'contracts/test/')
        }
    } else {
        return undefined
    }

    const finalPath = swapExtension(customPathTemplate || templatePath, extension)
    // Foundry templates live under `src/mockContracts/testForge/` in the
    // package, while the consumer-side file lives under `contracts/test/`.
    // Return the package-relative template path so the caller can read the
    // source bytes for rendering.
    return { finalPath, scriptOrTestDir, templatePath }
}

export const buildMockDeploymentScriptOrTest = async (
    contractName: string,
    type: 'deployment' | 'test' | 'testForge',
    options: IRenameOptions = {}
) => {
    const packageRootPath = resolveMockContractsPath()
    if (!packageRootPath) return
    if (!MockContractsList) return

    const contractToMock: IMockContractsList[] = MockContractsList.filter(
        (contract) => contract.name === contractName
    )
    if (contractToMock.length === 0) return

    const contractEntry = contractToMock[0]
    const customName = options.customName

    // Pick the destination extension: Foundry tests stay Solidity, everything
    // else follows the consumer's Hardhat config.
    const targetExtension = pickArtifactExtension()
    const writeExtension: 'ts' | 'js' | 'sol' = type === 'testForge' ? 'sol' : targetExtension

    const resolved = resolveArtifactPath(contractEntry, type, customName, writeExtension)
    if (!resolved) return
    const { finalPath, scriptOrTestDir, templatePath } = resolved

    // Ensure the destination directory exists before writing. `recursive: true`
    // is a no-op when the directory is already there, so this is safe to run
    // unconditionally — projects with an existing `scripts/`, `test/`, or
    // `contracts/test/` folder are left untouched (closes #168).
    fs.mkdirSync(scriptOrTestDir, { recursive: true })

    if (fs.existsSync(finalPath)) {
        console.log('\x1b[33m%s\x1b[0m', 'The ' + type + ' in ' + scriptOrTestDir + '/ already exists')
        return
    }

    console.log('\x1b[32m%s\x1b[0m', 'Creating ' + type + ' for ', customName ?? contractName, ' in ' + scriptOrTestDir + '/')
    const rawData: string = fs.readFileSync(path.join(packageRootPath, templatePath), 'utf8')
    const rendered = renderMockTemplate(rawData, contractEntry, options)
    const output = writeExtension === 'js' ? transformTsToJs(rendered) : rendered
    fs.writeFileSync(finalPath, output)
}

export default buildMockContract