import inquirer from 'inquirer'

import { DefaultHardhatPluginsList, LegacyHardhatPluginsList } from '../config.ts'
import detectPackage from '../packageInstaller.ts'
import type { IHardhatPluginAvailableList } from '../types.ts'
import { displayFinalCliCommand, waitForReadability } from '../utils.ts'
import type { PluginChoiceAnswer } from './types.ts'

export const servePackageInstaller = async () => {
    const hardhatPluginAvailableList: string[] = DefaultHardhatPluginsList.map(
        (plugin: IHardhatPluginAvailableList) => {
            return plugin.title
        }
    )
    // Probe every plugin in parallel and wait for each detection to finish
    // before reading the result, so the menu sees a consistent snapshot of
    // what is installed. Previously this used `Array.map(async)` and a
    // `sleep(500)` to mask the race between the spawned probes and the
    // subsequent read, which was both slow and flaky.
    const hardhatPluginInstalled: string[] = (
        await Promise.all(
            DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
                if (await detectPackage(plugin.name, false, false, false)) return plugin.title
                return null
            })
        )
    ).filter((title): title is string => title !== null)
    const hardhatPluginToNotInclude = new Set(hardhatPluginInstalled)
    const hardhatPluginToInstall: string[] = hardhatPluginAvailableList.filter(
        (plugin: string) => !hardhatPluginToNotInclude.has(plugin)
    )
    if (hardhatPluginToInstall.length === 0) {
        console.log('\x1b[32m%s\x1b[0m', 'All available plugins are already installed.')
        await waitForReadability()
        return
    }
    const pluginssSelected: PluginChoiceAnswer = await inquirer.prompt<PluginChoiceAnswer>([
        {
            type: 'list',
            name: 'plugins',
            message: 'Select a plugin to install',
            choices: hardhatPluginToInstall
        }
    ])
    const packageToInstall: IHardhatPluginAvailableList | undefined = DefaultHardhatPluginsList.find(
        (plugin: IHardhatPluginAvailableList) => plugin.title === pluginssSelected.plugins
    )
    if (packageToInstall !== undefined) {
        await detectPackage(packageToInstall.name, true, false, packageToInstall.addInHardhatConfig)
        displayFinalCliCommand('addHardhatPlugin', packageToInstall.name)
        await waitForReadability()
    }
}

export const servePackageUninstaller = async () => {
    // Projects migrating from Hardhat 2 still have `@nomiclabs/*` packages
    // installed, so the uninstall menu covers the legacy list too even though
    // those plugins are no longer offered for installation.
    const uninstallableList: IHardhatPluginAvailableList[] = [...DefaultHardhatPluginsList, ...LegacyHardhatPluginsList]
    const hardhatPluginInstalled: string[] = (
        await Promise.all(
            uninstallableList.map(async (plugin: IHardhatPluginAvailableList) => {
                if (await detectPackage(plugin.name, false, false, false))
                    return plugin.hardhat2Only ? `${plugin.title} (Hardhat 2 only)` : plugin.title
                return null
            })
        )
    ).filter((title): title is string => title !== null)
    if (hardhatPluginInstalled.length === 0) {
        console.log('\x1b[32m%s\x1b[0m', 'No installed plugins to remove.')
        await waitForReadability()
        return
    }
    const pluginssSelected: PluginChoiceAnswer = await inquirer.prompt<PluginChoiceAnswer>([
        {
            type: 'list',
            name: 'plugins',
            message: 'Select a plugin to uninstall',
            choices: hardhatPluginInstalled
        }
    ])
    const packageToUninstall: IHardhatPluginAvailableList | undefined = uninstallableList.find(
        (plugin: IHardhatPluginAvailableList) =>
            (plugin.hardhat2Only ? `${plugin.title} (Hardhat 2 only)` : plugin.title) === pluginssSelected.plugins
    )
    if (packageToUninstall !== undefined) {
        await detectPackage(packageToUninstall.name, false, true, packageToUninstall.addInHardhatConfig)
        displayFinalCliCommand('removeHardhatPlugin', packageToUninstall.name)
    }
    await waitForReadability()
}
