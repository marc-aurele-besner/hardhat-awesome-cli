import fs from 'fs'

import { transformTsToJs } from './utils.ts'

/**
 * Optional inputs accepted by `buildDeploymentContract`.
 *
 * `customName` overrides the contract identifier used throughout the
 * generated script. `constructorArgs` is forwarded to
 * `<Contract>.deploy(...constructorArgs)` so the consumer does not need to
 * hand-edit the script after generation.
 *
 * Both fields are optional. When omitted the generator still produces a
 * working script — the consumer can edit the generated file to call
 * `.deploy(...)` with their own arguments.
 */
export interface IDeploymentContractOptions {
    customName?: string
    constructorArgs?: string[]
}

/**
 * TypeScript template the generator renders into `scripts/deploy-<Name>.ts`.
 *
 * Kept inline (rather than as a separate asset on disk) so the rendered
 * script is easy to evolve alongside the rest of the source — the mock
 * deploy templates follow the same pattern.
 *
 * The placeholders the renderer substitutes are:
 *   `__CONTRACT_NAME__` — PascalCase contract identifier used everywhere
 *     the script touches the contract (`getContractFactory`, `const X =`,
 *     `saveContract`).
 *   `__CAMEL_NAME__` — camelCase local variable (mirrors the mock deploy
 *     script's `mockERC20` style).
 *   `__CONSTRUCTOR_ARGS__` — comma-separated argument list passed to
 *     `<Contract>.deploy(...)` (empty string when no args supplied).
 */
const DEPLOY_SCRIPT_TEMPLATE = `// @ts-ignore-next-line
import { addressBook, ethers, network } from 'hardhat'

async function main() {
    const [deployer] = await ethers.getSigners()

    const __CONTRACT_NAME__ = await ethers.getContractFactory('__CONTRACT_NAME__')
    const __CAMEL_NAME__ = await __CONTRACT_NAME__.deploy(__CONSTRUCTOR_ARGS__)

    await __CAMEL_NAME__.deployed()
    await addressBook.saveContract('__CONTRACT_NAME__', __CAMEL_NAME__.address, (network as any).name, deployer.address)

    console.log('__CONTRACT_NAME__ deployed to:', __CAMEL_NAME__.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
`

const camelCase = (name: string): string => {
    if (name.length === 0) return name
    return name[0].toLowerCase() + name.slice(1)
}

/**
 * Render the deploy-script template with the contract name and constructor
 * arguments the user supplied.
 *
 * Pulled out of `buildDeploymentContract` so it can be unit-tested without
 * touching the filesystem — `renderDeploymentScript` is a pure string
 * transform that mirrors `renderMockTemplate` in `buildMockContracts.ts`.
 */
export const renderDeploymentScript = (options: IDeploymentContractOptions): string => {
    const contractName = options.customName ?? ''
    const camelName = camelCase(contractName)
    const constructorArgs = (options.constructorArgs ?? []).join(', ')
    return DEPLOY_SCRIPT_TEMPLATE.replace(/__CONTRACT_NAME__/g, contractName)
        .replace(/__CAMEL_NAME__/g, camelName)
        .replace(/__CONSTRUCTOR_ARGS__/g, constructorArgs)
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

/**
 * Resolve the kebab-cased path the deploy script is written to.
 *
 * Mirrors the `scripts/deploy-Mock-ERC20.ts` shape of the bundled mocks so
 * the file appears under the same conventions the rest of the project
 * expects. When the consumer has no `scripts/` directory we create it
 * (closes #168).
 */
const resolveDeploymentScriptPath = (customName: string | undefined): { finalPath: string; kebabName: string } => {
    const sourceName = customName ?? 'Contract'
    const kebabName = sourceName
        // Insert a hyphen between a lowercase/digit and an uppercase letter
        // (e.g. `MyToken` → `my-token`, `MyERC20` → `my-erc20`).
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .toLowerCase()
    const extension = pickArtifactExtension()
    const finalPath = `scripts/deploy-${kebabName}.${extension}`
    return { finalPath, kebabName }
}

/**
 * Scaffold a deployment script for a contract the user already authored.
 *
 * Use cases:
 * - The consumer picked a contract name from the contracts listing and
 *   wants a ready-to-run deploy script that wires `addressBook.saveContract`
 *   into the flow (closes #166).
 * - The CLI was launched with `--addDeploymentScript <value>` and the menu
 *   would otherwise force the user through the inquirer prompts.
 *
 * Behaviour:
 * - Creates `scripts/` when missing (`recursive: true` keeps existing
 *   directories intact).
 * - Refuses to overwrite an existing script with the same name — the
 *   consumer can rename or remove the old file before re-running.
 * - Generates a CommonJS variant when the project ships a
 *   `hardhat.config.js`, TypeScript otherwise.
 *
 * Returns the path written so callers can echo the file location.
 */
export const buildDeploymentContract = (
    contractName: string,
    options: IDeploymentContractOptions = {}
): string | undefined => {
    if (!contractName) return undefined

    const renderedTs = renderDeploymentScript({ ...options, customName: options.customName ?? contractName })
    const { finalPath } = resolveDeploymentScriptPath(options.customName ?? contractName)

    fs.mkdirSync('scripts', { recursive: true })

    if (fs.existsSync(finalPath)) {
        console.log('\x1b[33m%s\x1b[0m', 'Deployment script already exists at ' + finalPath)
        return undefined
    }

    const extension = pickArtifactExtension()
    const output = extension === 'js' ? transformTsToJs(renderedTs) : renderedTs

    console.log('\x1b[32m%s\x1b[0m', 'Creating deployment script for ', contractName, ' at ', finalPath)
    fs.writeFileSync(finalPath, output)
    return finalPath
}

export default buildDeploymentContract

/**
 * Render the value consumed by `--addDeploymentScript` so the printed CLI
 * command round-trips through `parseAddDeploymentScriptFlag`.
 *
 * Shape: `<contractName>:<constructorArg1>:<constructorArg2>:...`. Using
 * `:` as the delimiter means contract names (which cannot contain it) can
 * be passed as the first segment, and any number of constructor arguments
 * follow. Solidity identifiers and string literals must not contain `:`
 * without escaping, so we keep the delimiter unambiguous.
 */
export const formatAddDeploymentScriptFlag = (contractName: string, constructorArgs: string[] = []): string => {
    if (constructorArgs.length === 0) return contractName
    return [contractName, ...constructorArgs].join(':')
}

/**
 * Parse the `--addDeploymentScript` CLI flag value.
 *
 * Returns `undefined` when the value is empty or missing the contract name
 * so `serveCli` can fall through to the next flag instead of silently
 * invoking the generator with garbage.
 */
export const parseAddDeploymentScriptFlag = (
    value: string | undefined
): { contractName: string; constructorArgs: string[] } | undefined => {
    if (typeof value !== 'string') return undefined
    const parts = value.split(':')
    if (parts.length === 0) return undefined
    const [contractName, ...constructorArgs] = parts
    if (!contractName) return undefined
    return { contractName, constructorArgs }
}