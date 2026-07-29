import fs from 'fs'
import path from 'path'

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

const importsPackage = (hardhatConfigFile: string, packageName: string): boolean =>
    new RegExp(`from\\s*['"]${escapeForRegExp(packageName)}['"]`).test(hardhatConfigFile)

const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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
const findPluginsArray = (hardhatConfigFile: string): { start: number; end: number } | undefined => {
    const match = hardhatConfigFile.match(/\bplugins\s*:\s*\[/)
    if (match === null || match.index === undefined) return undefined
    const start = match.index + match[0].length
    let depth = 1
    for (let index = start; index < hardhatConfigFile.length; index++) {
        const char = hardhatConfigFile[index]
        if (char === '[') depth++
        else if (char === ']') {
            depth--
            if (depth === 0) return { start, end: index }
        }
    }
    return undefined
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
        const newHardhatConfig = hardhat3
            ? addPluginToHardhat3Config(hardhatConfigFile, packageName)
            : addPluginToHardhat2Config(hardhatConfigFile, packageName)
        if (newHardhatConfig === undefined) {
            console.log(
                '\x1b[31m%s\x1b[0m',
                'Could not update ' + hardhatConfigFilePath + ' automatically, please add it yourself:'
            )
            if (hardhat3)
                console.log(
                    '\x1b[97m%s\x1b[0m',
                    `import ${hardhatPluginImportName(packageName)} from '${packageName}'\n` +
                        `... defineConfig({ plugins: [${hardhatPluginImportName(packageName)}] })`
                )
            else console.log('\x1b[97m%s\x1b[0m', `require('${packageName}')`)
            return
        }
        console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' to your ' + hardhatConfigFilePath + ' file')
        fs.writeFileSync(hardhatConfigFilePath, newHardhatConfig)
        return
    }

    if (removeFromConfig) {
        if (!isPluginRegistered(hardhatConfigFile, packageName)) {
            console.log('\x1b[34m%s\x1b[0m', 'Package ' + packageName + ' not found in ' + hardhatConfigFilePath)
            return
        }
        console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
        const newHardhatConfig = hardhat3
            ? removePluginFromHardhat3Config(hardhatConfigFile, packageName)
            : removePluginFromHardhat2Config(hardhatConfigFile, packageName)
        fs.writeFileSync(hardhatConfigFilePath, newHardhatConfig)
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
            if (fs.existsSync('package-lock.json')) {
                if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, false, true)
                // Wait for `npm remove` to actually finish; previously this
                // relied on a 5s sleep which was both slow and unreliable.
                await runCommand('npm remove ' + packageName, '', '', false)
            } else if (fs.existsSync('yarn-lock.json')) {
                if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, false, true)
                await runCommand('yarn remove ' + packageName, '', '', false)
            }
        }
        return true
    } else {
        if (install) {
            console.log('\x1b[34m%s\x1b[0m', 'Installing package: ', '\x1b[97m\x1b[0m', packageName)
            if (fs.existsSync('package-lock.json')) {
                console.log('\x1b[33m%s\x1b[0m', 'Detected package-lock.json, installing with npm')
                if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, true, false)
                await runCommand('npm install ' + packageName, '', ' --save-dev', false)
            } else if (fs.existsSync('yarn-lock.json')) {
                console.log('\x1b[33m%s\x1b[0m', 'Detected yarn-lock.json, installing with yarn')
                if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, true, false)
                await runCommand('yarn add ' + packageName, '', ' -D', false)
            }
        }
        return false
    }
}

export default detectPackage
