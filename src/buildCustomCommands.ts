import fs from 'fs'
import { spawn } from 'child_process'

import { getAddressBookConfig } from './config.ts'
import type { ICustomCommand } from './types.ts'

/**
 * Normalize a raw settings entry into the canonical {@link ICustomCommand}
 * shape.
 *
 * Older settings files (or hand-edited ones) might miss optional fields.
 * `kind` defaults to `'shell'`, `description` to `''`. `name` and `command`
 * are required and an entry missing either is dropped to keep `loadCustomCommands`
 * from leaking malformed rows into the menu.
 */
const normalizeCustomCommand = (raw: any): ICustomCommand | undefined => {
    if (!raw || typeof raw !== 'object') return undefined
    const name = typeof raw.name === 'string' ? raw.name.trim() : ''
    const command = typeof raw.command === 'string' ? raw.command : ''
    if (!name || !command) return undefined
    const kind: ICustomCommand['kind'] = raw.kind === 'hardhat' ? 'hardhat' : 'shell'
    const entry: ICustomCommand = { name, kind, command }
    if (typeof raw.description === 'string' && raw.description.length > 0) {
        entry.description = raw.description
    }
    return entry
}

/**
 * Read the `customCommands` array out of `hardhat-awesome-cli.json`.
 *
 * Returns an empty list when the file is missing, unreadable, or has no
 * `customCommands` field yet — that matches the way every other settings
 * loader in the codebase handles a fresh project (see `buildExcludedFile`,
 * `buildActivatedChainList`).
 */
export const loadCustomCommands = async (): Promise<ICustomCommand[]> => {
    const addressBookConfig = getAddressBookConfig()
    if (!fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) return []
    try {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
        const fileSetting = JSON.parse(rawdata)
        if (!fileSetting || !Array.isArray(fileSetting.customCommands)) return []
        return fileSetting.customCommands
            .map((entry: any) => normalizeCustomCommand(entry))
            .filter((entry: ICustomCommand | undefined): entry is ICustomCommand => entry !== undefined)
    } catch {
        // Malformed JSON — surface a warning but keep the CLI usable. The
        // user can fix the file by hand; we don't want to throw from a
        // loader the menu polls on every render.
        return []
    }
}

/**
 * Persist a single entry to the `customCommands` array of
 * `hardhat-awesome-cli.json`.
 *
 * The function preserves every other top-level field on the settings file
 * (chains, excluded files, …) so calling it from the menu does not blow
 * away unrelated settings. A duplicate `name` is rejected and the call
 * returns `false` so the CLI can warn the user without throwing.
 */
export const addCustomCommand = async (entry: ICustomCommand): Promise<boolean> => {
    const normalized = normalizeCustomCommand(entry)
    if (!normalized) return false
    const addressBookConfig = getAddressBookConfig()
    let fileSetting: any = {}
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        try {
            const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
            fileSetting = JSON.parse(rawdata)
        } catch {
            // Unparseable file — start from a clean object so we don't
            // silently clobber the user's settings on a one-off typo.
            fileSetting = {}
        }
    }
    if (!Array.isArray(fileSetting.customCommands)) fileSetting.customCommands = []
    if (fileSetting.customCommands.some((existing: ICustomCommand) => existing.name === normalized.name)) {
        return false
    }
    fileSetting.customCommands.push(normalized)
    try {
        fs.writeFileSync(addressBookConfig.fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
        return true
    } catch {
        return false
    }
}

/**
 * Remove a custom command by `name`.
 *
 * Returns `true` when the entry was found and removed, `false` when no
 * matching name existed. Other top-level settings are preserved the same
 * way {@link addCustomCommand} preserves them.
 */
export const removeCustomCommand = async (name: string): Promise<boolean> => {
    const trimmed = typeof name === 'string' ? name.trim() : ''
    if (!trimmed) return false
    const addressBookConfig = getAddressBookConfig()
    if (!fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) return false
    let fileSetting: any = {}
    try {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
    } catch {
        return false
    }
    if (!Array.isArray(fileSetting.customCommands)) return false
    const initialLength = fileSetting.customCommands.length
    fileSetting.customCommands = fileSetting.customCommands.filter(
        (existing: ICustomCommand) => existing.name !== trimmed
    )
    if (fileSetting.customCommands.length === initialLength) return false
    try {
        fs.writeFileSync(addressBookConfig.fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
        return true
    } catch {
        return false
    }
}

/**
 * Render the shell line the CLI will actually spawn.
 *
 * `kind: 'hardhat'` gets `npx hardhat ` prepended so the user only has to
 * type the task name and any flags. Everything else is treated as a raw
 * shell command and handed to `spawn(cmd, { shell: true })` unchanged.
 */
export const buildCustomCommandInvocation = (entry: ICustomCommand): string => {
    if (entry.kind === 'hardhat') return `npx hardhat ${entry.command}`
    return entry.command
}

/**
 * Spawn the command and resolve once the child exits.
 *
 * Mirrors `runCommand` in `utils.ts` (inherit stdio so the user sees the
 * output, resolve on exit so the menu can resume cleanly afterwards) but
 * without the `firstCommand` chaining or the `thenExit` semantics — the
 * caller decides whether to exit the process.
 */
export const runCustomCommand = (entry: ICustomCommand): Promise<void> =>
    new Promise<void>((resolve) => {
        const commandToRun = buildCustomCommandInvocation(entry)
        console.log('\x1b[33m%s\x1b[0m', 'Running custom command: ', '\x1b[97m\x1b[0m', entry.name)
        console.log('\x1b[33m%s\x1b[0m', 'Command: ', '\x1b[97m\x1b[0m', commandToRun)
        const child = spawn(commandToRun, { stdio: 'inherit', shell: true })
        child.on('exit', () => resolve())
    })

/**
 * Render the value consumed by `--addCustomCommand` so the printed CLI
 * command round-trips through `parseAddCustomCommandFlag`.
 *
 * Custom commands carry an arbitrary shell string, so JSON is the only
 * delimiter that survives every realistic payload (`make foo | grep bar`,
 * commands with embedded quotes, …). The flag value is a JSON object with
 * the same fields as `ICustomCommand`.
 */
export const formatAddCustomCommandFlag = (entry: ICustomCommand): string => JSON.stringify(entry)

/**
 * Parse the `--addCustomCommand` CLI flag value.
 *
 * Returns `undefined` for anything that is not a valid JSON object with
 * the required `name` / `command` fields so `serveCli` can warn the user
 * instead of silently adding a malformed entry.
 */
export const parseAddCustomCommandFlag = (value: string | undefined): ICustomCommand | undefined => {
    if (typeof value !== 'string' || value === '') return undefined
    let parsed: any
    try {
        parsed = JSON.parse(value)
    } catch {
        return undefined
    }
    if (!parsed || typeof parsed !== 'object') return undefined
    const normalized = normalizeCustomCommand(parsed)
    if (!normalized) return undefined
    return normalized
}