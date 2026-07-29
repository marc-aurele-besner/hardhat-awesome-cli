import fs from 'fs'
import path from 'path'

import { getPackageManagerCommands, lockfileDetectionLabel } from './packageManager.ts'
import { runCommand } from './utils.ts'

/**
 * Derive the local identifier used to import a plugin into `hardhat.config`.
 *
 * Every Hardhat 3 plugin exposes its `HardhatPlugin` object as the module
 * **default** export, so the identifier is ours to choose. We derive it from
 * the package name (scope stripped, camel cased) so the same package always
 * maps to the same identifier — that makes the "already added?" check and the
 * removal path deterministic, and it works for packages the user passes to
 * `--addHardhatPlugin` that are not in `DefaultHardhatPluginsList`.
 *
 * `@nomicfoundation/hardhat-ethers` -> `hardhatEthers`
 * `@nomicfoundation/hardhat-toolbox-mocha-ethers` -> `hardhatToolboxMochaEthers`
 */
export const hardhatPluginImportName = (packageName: string): string => {
    const bareName = packageName.split('/').filter(Boolean).pop() ?? packageName
    const camelCased = bareName.replace(/[^A-Za-z0-9]+(.)?/g, (_match, nextChar) =>
        nextChar ? nextChar.toUpperCase() : ''
    )
    // A package such as `3rd-party-plugin` would produce an identifier starting
    // with a digit, which is not valid JavaScript.
    return /^[A-Za-z_$]/.test(camelCased) ? camelCased : `plugin${camelCased}`
}

/**
 * Hardhat 3 config files register plugins through the `plugins` array of
 * `defineConfig({ ... })` instead of the Hardhat 2 side-effect
 * `require('some-plugin')` / `import 'some-plugin'`.
 */
export const isHardhat3Config = (hardhatConfigFile: string): boolean =>
    /\bdefineConfig\s*\(/.test(hardhatConfigFile) || /\bplugins\s*:\s*\[/.test(hardhatConfigFile)

const importsPackage = (hardhatConfigFile: string, packageName: string): boolean => {
    const quoted = escapeForRegExp(packageName)
    return new RegExp(String.raw`(?:from\s*|import\s*\(\s*|import\s*|require\s*\(\s*)['"]${quoted}['"]`).test(
        hardhatConfigFile
    )
}

const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export type HardhatConfigMutationFailureReason =
    'no-plugins-array' | 'unterminated-plugins-array' | 'multiple-plugins-arrays'

export interface HardhatConfigMutationFailure {
    reason: HardhatConfigMutationFailureReason
    message: string
}

interface PluginsArrayLocation {
    start: number
    end: number
}

const findPluginsArrays = (hardhatConfigFile: string): { locations: PluginsArrayLocation[]; unterminated: boolean } => {
    const locations: PluginsArrayLocation[] = []
    const pattern = /\bplugins\s*:\s*\[/g
    let match: RegExpExecArray | null
    let unterminated = false

    while ((match = pattern.exec(hardhatConfigFile)) !== null) {
        const start = match.index + match[0].length
        let depth = 1
        let quote: string | null = null
        let escaped = false
        let foundEnd = false

        for (let index = start; index < hardhatConfigFile.length; index++) {
            const char = hardhatConfigFile[index]
            if (quote !== null) {
                if (escaped) escaped = false
                else if (char === '\\') escaped = true
                else if (char === quote) quote = null
                continue
            }
            if (char === '"' || char === "'" || char === '`') {
                quote = char
                continue
            }
            if (char === '[') depth++
            else if (char === ']') {
                depth--
                if (depth === 0) {
                    locations.push({ start, end: index })
                    pattern.lastIndex = index + 1
                    foundEnd = true
                    break
                }
            }
        }
        if (!foundEnd) {
            unterminated = true
            break
        }
    }

    return { locations, unterminated }
}

export const inspectHardhat3Config = (
    hardhatConfigFile: string
): PluginsArrayLocation | HardhatConfigMutationFailure => {
    const { locations, unterminated } = findPluginsArrays(hardhatConfigFile)
    if (unterminated)
        return {
            reason: 'unterminated-plugins-array',
            message: 'The plugins array is not terminated.'
        }
    if (locations.length === 0)
        return {
            reason: 'no-plugins-array',
            message: 'No plugins array was found.'
        }
    if (locations.length > 1)
        return {
            reason: 'multiple-plugins-arrays',
            message: 'Multiple plugins arrays were found.'
        }
    return locations[0]
}

const isMutationFailure = (
    result: PluginsArrayLocation | HardhatConfigMutationFailure
): result is HardhatConfigMutationFailure => 'reason' in result

/**
 * Split the content of an array literal on its top-level commas only, so an
 * entry such as `somePlugin({ a: 1, b: 2 })` stays in one piece.
 */
const splitTopLevelEntries = (arrayContent: string): string[] => {
    const entries: string[] = []
    let depth = 0
    let current = ''
    let quote: string | null = null
    for (const char of arrayContent) {
        if (quote) {
            current += char
            if (char === quote) quote = null
            continue
        }
        if (char === '"' || char === "'" || char === '`') {
            quote = char
            current += char
            continue
        }
        if (char === '(' || char === '[' || char === '{') depth++
        if (char === ')' || char === ']' || char === '}') depth--
        if (char === ',' && depth === 0) {
            entries.push(current)
            current = ''
            continue
        }
        current += char
    }
    entries.push(current)
    return entries
}

/**
 * Locate the `plugins: [ ... ]` array of the config file and return the index
 * boundaries of its content, or `undefined` when there is no such array.
 */
const findPluginsArray = (hardhatConfigFile: string): PluginsArrayLocation | undefined => {
    const result = inspectHardhat3Config(hardhatConfigFile)
    return isMutationFailure(result) ? undefined : result
}

/**
 * Rewrite the content of the `plugins` array, preserving the existing layout
 * (single line vs one entry per line, trailing comma or not).
 */
const renderPluginsArray = (arrayContent: string, entries: string[]): string => {
    if (entries.length === 0) return ''
    const isMultiline = arrayContent.includes('\n')
    if (!isMultiline) return entries.join(', ')

    const indentMatch = arrayContent.match(/\n([ \t]*)\S/)
    const entryIndent = indentMatch ? indentMatch[1] : '        '
    const closingIndentMatch = arrayContent.match(/\n([ \t]*)$/)
    const closingIndent = closingIndentMatch ? closingIndentMatch[1] : entryIndent.slice(0, -4)
    const trailingComma = /,\s*$/.test(arrayContent) ? ',' : ''
    return `\n${entries.map((entry) => `${entryIndent}${entry}`).join(',\n')}${trailingComma}\n${closingIndent}`
}

const insertImportStatement = (hardhatConfigFile: string, packageName: string, importName: string): string => {
    const importStatement = `import ${importName} from '${packageName}'`
    const importStatements = [...hardhatConfigFile.matchAll(/^import\s[^\n]*\n/gm)]
    if (importStatements.length === 0) return `${importStatement}\n${hardhatConfigFile}`
    const lastImport = importStatements[importStatements.length - 1]
    const insertAt = (lastImport.index ?? 0) + lastImport[0].length
    return `${hardhatConfigFile.slice(0, insertAt)}${importStatement}\n${hardhatConfigFile.slice(insertAt)}`
}

/**
 * Add a plugin to a Hardhat 3 config file: import its default export and push
 * that identifier into the `plugins` array of `defineConfig(...)`.
 *
 * Returns the new file content, or `undefined` when the config could not be
 * updated safely (no `plugins` array to extend) so the caller can tell the
 * user what to add by hand instead of writing a broken config.
 */
export const addPluginToHardhat3Config = (hardhatConfigFile: string, packageName: string): string | undefined => {
    const importName = hardhatPluginImportName(packageName)
    const pluginsArray = findPluginsArray(hardhatConfigFile)
    if (pluginsArray === undefined) return undefined

    const arrayContent = hardhatConfigFile.slice(pluginsArray.start, pluginsArray.end)
    const entries = splitTopLevelEntries(arrayContent)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    if (entries.includes(importName) && importsPackage(hardhatConfigFile, packageName)) return hardhatConfigFile

    if (!entries.includes(importName)) entries.push(importName)
    const withPlugin =
        hardhatConfigFile.slice(0, pluginsArray.start) +
        renderPluginsArray(arrayContent, entries) +
        hardhatConfigFile.slice(pluginsArray.end)

    if (importsPackage(withPlugin, packageName)) return withPlugin
    return insertImportStatement(withPlugin, packageName, importName)
}

/**
 * Remove a plugin from a Hardhat 3 config file: drop its entry from the
 * `plugins` array and delete the import statement that fed it.
 */
export const removePluginFromHardhat3Config = (hardhatConfigFile: string, packageName: string): string => {
    const importName = hardhatPluginImportName(packageName)
    let newHardhatConfig = hardhatConfigFile

    const pluginsArray = findPluginsArray(newHardhatConfig)
    if (pluginsArray !== undefined) {
        const arrayContent = newHardhatConfig.slice(pluginsArray.start, pluginsArray.end)
        const entries = splitTopLevelEntries(arrayContent)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0 && entry !== importName)
        newHardhatConfig =
            newHardhatConfig.slice(0, pluginsArray.start) +
            renderPluginsArray(arrayContent, entries) +
            newHardhatConfig.slice(pluginsArray.end)
    }

    // Drop the import line, whatever local name it was bound to.
    return newHardhatConfig.replace(
        new RegExp(`^import\\s[^\\n]*from\\s*['"]${escapeForRegExp(packageName)}['"];?[ \\t]*\\r?\\n`, 'm'),
        ''
    )
}

/**
 * Hardhat 2 style registration, kept for projects that have not migrated yet:
 * the plugin is loaded for its side effects next to the `hardhat-awesome-cli`
 * import.
 */
const addPluginToHardhat2Config = (hardhatConfigFile: string, packageName: string): string | undefined => {
    const anchors = [
        `require("hardhat-awesome-cli")`,
        `require('hardhat-awesome-cli')`,
        `import "hardhat-awesome-cli"`,
        `import 'hardhat-awesome-cli'`
    ]
    const anchor = anchors.find((candidate) => hardhatConfigFile.includes(candidate))
    if (anchor === undefined) return undefined
    const statement = anchor.replace('hardhat-awesome-cli', packageName)
    return hardhatConfigFile.replace(anchor, `${anchor}\n${statement}`)
}

const removePluginFromHardhat2Config = (hardhatConfigFile: string, packageName: string): string =>
    hardhatConfigFile.replace(
        new RegExp(
            `^[ \\t]*(?:require|import)\\s*\\(?\\s*['"]${escapeForRegExp(packageName)}['"]\\s*\\)?;?[ \\t]*\\r?\\n`,
            'm'
        ),
        ''
    )

const isPluginRegistered = (hardhatConfigFile: string, packageName: string): boolean => {
    const quoted = escapeForRegExp(packageName)
    return new RegExp(`(?:require|import|from)\\s*\\(?\\s*['"]${quoted}['"]`).test(hardhatConfigFile)
}

export const findHardhatConfigFilePath = (): string => {
    if (fs.existsSync('hardhat.config.ts')) return 'hardhat.config.ts'
    if (fs.existsSync('hardhat.config.js')) return 'hardhat.config.js'
    if (fs.existsSync('hardhat.config.mjs')) return 'hardhat.config.mjs'
    if (fs.existsSync('hardhat.config.cjs')) return 'hardhat.config.cjs'
    return ''
}

export interface HardhatConfigFileMutationResult {
    updated: boolean
    failure?: HardhatConfigMutationFailure
}

export const mutateHardhatConfigFile = (
    hardhatConfigFilePath: string,
    packageName: string,
    addToConfig: boolean
): HardhatConfigFileMutationResult => {
    const hardhatConfigFile = fs.readFileSync(hardhatConfigFilePath, 'utf8')
    const hardhat3 = isHardhat3Config(hardhatConfigFile)
    if (hardhat3) {
        const inspection = inspectHardhat3Config(hardhatConfigFile)
        if (isMutationFailure(inspection)) return { updated: false, failure: inspection }
    }

    const newHardhatConfig = addToConfig
        ? hardhat3
            ? addPluginToHardhat3Config(hardhatConfigFile, packageName)
            : addPluginToHardhat2Config(hardhatConfigFile, packageName)
        : hardhat3
          ? removePluginFromHardhat3Config(hardhatConfigFile, packageName)
          : removePluginFromHardhat2Config(hardhatConfigFile, packageName)
    if (newHardhatConfig === undefined)
        return {
            updated: false,
            failure: {
                reason: 'no-plugins-array',
                message: 'No supported plugin registration location was found.'
            }
        }
    if (newHardhatConfig === hardhatConfigFile) return { updated: false }

    const extension = path.extname(hardhatConfigFilePath)
    const temporaryPath = `${hardhatConfigFilePath}.hardhat-awesome-cli${extension || '.js'}`
    try {
        fs.writeFileSync(temporaryPath, newHardhatConfig)
        if (isHardhat3Config(newHardhatConfig) && isMutationFailure(inspectHardhat3Config(newHardhatConfig)))
            throw new Error('The generated plugins array is invalid.')
        fs.renameSync(temporaryPath, hardhatConfigFilePath)
        return { updated: true }
    } catch (error) {
        fs.rmSync(temporaryPath, { force: true })
        const message = error instanceof Error ? error.message : String(error)
        return {
            updated: false,
            failure: {
                reason: 'unterminated-plugins-array',
                message: `The generated config did not pass syntax validation: ${message}`
            }
        }
    }
}

const manualConfigSnippet = (packageName: string, hardhat3: boolean): string =>
    hardhat3
        ? `import ${hardhatPluginImportName(packageName)} from '${packageName}'\n` +
          `... defineConfig({ plugins: [${hardhatPluginImportName(packageName)}] })`
        : `require('${packageName}')`

const importPackageHardhatConfigFile = async (packageName: string, addToConfig: boolean, removeFromConfig: boolean) => {
    const hardhatConfigFilePath = findHardhatConfigFilePath()
    if (!hardhatConfigFilePath) {
        console.log('\x1b[31m%s\x1b[0m', 'Hardhat config file not found!')
        return
    }
    const hardhatConfigFile = fs.readFileSync(hardhatConfigFilePath, 'utf8')
    const hardhat3 = isHardhat3Config(hardhatConfigFile)

    if (addToConfig) {
        if (isPluginRegistered(hardhatConfigFile, packageName)) {
            console.log(
                '\x1b[34m%s\x1b[0m',
                'Package ' + packageName + ' is already registered in ' + hardhatConfigFilePath
            )
            return
        }
        const mutation = mutateHardhatConfigFile(hardhatConfigFilePath, packageName, true)
        if (mutation.failure !== undefined) {
            console.log(
                '\x1b[31m%s\x1b[0m',
                'Could not update ' + hardhatConfigFilePath + ' automatically: ' + mutation.failure.message
            )
            console.log('\x1b[97m%s\x1b[0m', manualConfigSnippet(packageName, hardhat3))
            return
        }
        if (mutation.updated)
            console.log('\x1b[33m%s\x1b[0m', 'Added ' + packageName + ' to your ' + hardhatConfigFilePath + ' file')
        return
    }

    if (removeFromConfig) {
        if (!isPluginRegistered(hardhatConfigFile, packageName)) {
            console.log('\x1b[34m%s\x1b[0m', 'Package ' + packageName + ' not found in ' + hardhatConfigFilePath)
            return
        }
        const mutation = mutateHardhatConfigFile(hardhatConfigFilePath, packageName, false)
        if (mutation.failure !== undefined) {
            console.log(
                '\x1b[31m%s\x1b[0m',
                'Could not update ' + hardhatConfigFilePath + ' automatically: ' + mutation.failure.message
            )
            console.log('\x1b[97m%s\x1b[0m', manualConfigSnippet(packageName, hardhat3))
            return
        }
        if (mutation.updated)
            console.log('\x1b[33m%s\x1b[0m', 'Removed ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
    }
}

const detectPackage = async (
    packageName: string,
    install: boolean,
    uninstall: boolean,
    addRemoveInHardhatConfig: boolean
) => {
    // Hardhat 2 walked up from `require.main.filename` to reach the consuming
    // project's `node_modules`. `require` does not exist in an ES module, and the
    // rest of this CLI already treats the current working directory as the
    // Hardhat project root (`contracts/`, `hardhat.config.ts`, `package-lock.json`),
    // so resolve `node_modules` from there instead.
    const nodeModulesPath = path.join(process.cwd(), 'node_modules')
    if (fs.existsSync(path.join(nodeModulesPath, packageName))) {
        if (uninstall) {
            console.log('\x1b[34m%s\x1b[0m', 'Uninstalling package: ', '\x1b[97m\x1b[0m', packageName)
            const { manager, commands } = getPackageManagerCommands()
            console.log('\x1b[33m%s\x1b[0m', lockfileDetectionLabel(manager))
            if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, false, true)
            // Wait for the package manager to actually finish; previously this
            // relied on a 5s sleep which was both slow and unreliable.
            await runCommand(commands.remove(packageName), '', '', false)
        }
        return true
    } else {
        if (install) {
            console.log('\x1b[34m%s\x1b[0m', 'Installing package: ', '\x1b[97m\x1b[0m', packageName)
            const { manager, commands } = getPackageManagerCommands()
            console.log('\x1b[33m%s\x1b[0m', lockfileDetectionLabel(manager))
            if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, true, false)
            await runCommand(commands.installDev(packageName), '', '', false)
        }
        return false
    }
}

export default detectPackage
