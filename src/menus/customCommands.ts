import inquirer from 'inquirer'

import {
    addCustomCommand,
    formatAddCustomCommandFlag,
    loadCustomCommands,
    removeCustomCommand,
    runCustomCommand
} from '../buildCustomCommands.ts'
import { displayFinalCliCommand, waitForReadability } from '../utils.ts'
import type { CustomCommandChoiceAnswer, CustomCommandFormAnswer } from './types.ts'

/**
 * Interactive menu for adding, listing and removing custom commands.
 *
 * Lives under `More settings` so the `Run a custom command` entry at the
 * top of the menu stays focused on actually executing them. The list view
 * just `console.table`s the current entries; the add form validates that
 * `name` and `command` are non-empty before persisting.
 */
export const serveCustomCommandManager = async (): Promise<void> => {
    const action = await inquirer.prompt<CustomCommandChoiceAnswer>([
        {
            type: 'list',
            name: 'customCommand',
            message: 'Custom commands',
            choices: ['Add a custom command', 'Remove a custom command', 'List custom commands']
        }
    ])
    if (action.customCommand === 'List custom commands') {
        const entries = await loadCustomCommands()
        if (entries.length === 0) {
            console.log('\x1b[33m%s\x1b[0m', 'No custom commands defined yet.')
        } else {
            console.table(
                entries.map((entry) => ({
                    name: entry.name,
                    kind: entry.kind,
                    command: entry.kind === 'hardhat' ? `npx hardhat ${entry.command}` : entry.command,
                    description: entry.description || ''
                }))
            )
        }
        await waitForReadability()
        return
    }
    if (action.customCommand === 'Add a custom command') {
        const form = await inquirer.prompt<CustomCommandFormAnswer>([
            {
                type: 'input',
                name: 'name',
                message: 'Command name (used to invoke it later)',
                validate: (input: string) => (input.trim().length > 0 ? true : 'Name cannot be empty')
            },
            {
                type: 'input',
                name: 'description',
                message: 'Short description (optional)'
            },
            {
                type: 'list',
                name: 'kind',
                message: 'Command kind',
                choices: [
                    { name: 'shell — run as a raw shell command', value: 'shell' },
                    { name: 'hardhat — prefixed with `npx hardhat `', value: 'hardhat' }
                ],
                default: 'shell'
            },
            {
                type: 'input',
                name: 'command',
                message: 'Command to run',
                validate: (input: string) => (input.trim().length > 0 ? true : 'Command cannot be empty')
            }
        ])
        const added = await addCustomCommand({
            name: form.name.trim(),
            description: form.description,
            kind: form.kind,
            command: form.command.trim()
        })
        if (!added) {
            console.log('\x1b[33m%s\x1b[0m', `A custom command named "${form.name}" already exists.`)
            await waitForReadability()
            return
        }
        displayFinalCliCommand(
            'addCustomCommand',
            formatAddCustomCommandFlag({
                name: form.name.trim(),
                description: form.description,
                kind: form.kind,
                command: form.command.trim()
            })
        )
        await waitForReadability()
        return
    }
    if (action.customCommand === 'Remove a custom command') {
        const entries = await loadCustomCommands()
        if (entries.length === 0) {
            console.log('\x1b[33m%s\x1b[0m', 'No custom commands to remove.')
            await waitForReadability()
            return
        }
        const removeChoice = await inquirer.prompt<CustomCommandChoiceAnswer>([
            {
                type: 'list',
                name: 'customCommand',
                message: 'Select a custom command to remove',
                choices: entries.map((entry) => entry.name)
            }
        ])
        const removed = await removeCustomCommand(removeChoice.customCommand)
        if (!removed) {
            console.log('\x1b[33m%s\x1b[0m', `Custom command "${removeChoice.customCommand}" was not found.`)
        } else {
            console.log('\x1b[32m%s\x1b[0m', 'Custom command removed.')
            displayFinalCliCommand('removeCustomCommand', removeChoice.customCommand)
        }
        await waitForReadability()
    }
}

/**
 * Interactive picker that lets the user choose and run a custom command
 * from the top-level menu. Falls through silently when there are no
 * commands so the top-level menu just hides the option.
 */
export const serveRunCustomCommandSelector = async (): Promise<void> => {
    const entries = await loadCustomCommands()
    if (entries.length === 0) return
    const choice = await inquirer.prompt<CustomCommandChoiceAnswer>([
        {
            type: 'list',
            name: 'customCommand',
            message: 'Select a custom command to run',
            choices: entries.map((entry) => ({
                name: entry.description ? `${entry.name} — ${entry.description}` : entry.name,
                value: entry.name
            }))
        }
    ])
    const selectedEntry = entries.find((entry) => entry.name === choice.customCommand)
    if (!selectedEntry) return
    await runCustomCommand(selectedEntry)
}
