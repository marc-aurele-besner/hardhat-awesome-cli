import fs from 'fs'
import path from 'path'

import { runCommand, sleep } from './utils'

const importPackageHardhatConfigFile = async (packageName: string, addToConfig: boolean, removeFromConfig: boolean) => {
    let hardhatConfigFilePath: string = ''
    if (fs.existsSync('hardhat.config.js')) hardhatConfigFilePath = 'hardhat.config.js'
    else if (fs.existsSync('hardhat.config.ts')) hardhatConfigFilePath = 'hardhat.config.ts'
    else {
        console.log('\x1b[31m%s\x1b[0m', 'Hardhat config file not found!')
        return
    }
    if (hardhatConfigFilePath) {
        const rawdata: any = fs.readFileSync(hardhatConfigFilePath)
        const hardhatConfigFile = rawdata.toString()
        if (
            addToConfig &&
            hardhatConfigFile.search(`require("${packageName}");`) === -1 &&
            hardhatConfigFile.search(`require('${packageName}');`) === -1 &&
            hardhatConfigFile.search(`require("${packageName}")`) === -1 &&
            hardhatConfigFile.search(`require('${packageName}')`) === -1 &&
            hardhatConfigFile.search(`import "${packageName}";`) === -1 &&
            hardhatConfigFile.search(`import '${packageName}';`) === -1 &&
            hardhatConfigFile.search(`import "${packageName}"`) === -1 &&
            hardhatConfigFile.search(`import '${packageName}'`) === -1
        ) {
            let newHardHatConfig: string = ''
            if (hardhatConfigFile.includes(`require("hardhat-awesome-cli");`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(
                    `require("hardhat-awesome-cli");`,
                    `require("hardhat-awesome-cli");
require("${packageName}");`
                )
            } else if (hardhatConfigFile.includes(`require('hardhat-awesome-cli');`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(
                    `require('hardhat-awesome-cli');`,
                    `require('hardhat-awesome-cli');
require('${packageName}');`
                )
            } else if (hardhatConfigFile.includes(`require("hardhat-awesome-cli")`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(
                    `require("hardhat-awesome-cli")`,
                    `require("hardhat-awesome-cli")
require("${packageName}")`
                )
            } else if (hardhatConfigFile.includes(`require('hardhat-awesome-cli')`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(
                    `require('hardhat-awesome-cli')`,
                    `require('hardhat-awesome-cli')
require('${packageName}')`
                )
            } else if (hardhatConfigFile.includes(`import "hardhat-awesome-cli";`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(
                    `import "hardhat-awesome-cli";`,
                    `import "hardhat-awesome-cli";
import "${packageName}";`
                )
            } else if (hardhatConfigFile.includes(`import 'hardhat-awesome-cli';`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(
                    `import 'hardhat-awesome-cli';')`,
                    `import 'hardhat-awesome-cli';
import '${packageName}';`
                )
            } else if (hardhatConfigFile.includes(`import "hardhat-awesome-cli"`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(
                    `import "hardhat-awesome-cli"`,
                    `import "hardhat-awesome-cli"
import "${packageName}"`
                )
            } else if (hardhatConfigFile.includes(`import 'hardhat-awesome-cli'`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(
                    `import 'hardhat-awesome-cli'`,
                    `import 'hardhat-awesome-cli'
import '${packageName}'`
                )
            } else {
                newHardHatConfig = hardhatConfigFile
                console.log(
                    '\x1b[34m%s\x1b[0m',
                    'Package ' + packageName + ' not imported in ' + hardhatConfigFilePath + ' file'
                )
            }
            fs.writeFileSync(hardhatConfigFilePath, newHardHatConfig)
        } else if (removeFromConfig) {
            let newHardHatConfig: string = ''
            if (hardhatConfigFile.search(`require("${packageName}");`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(`require("${packageName}");`, '')
            } else if (hardhatConfigFile.search(`require('${packageName}');`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(`require('${packageName}');`, '')
            } else if (hardhatConfigFile.search(`require("${packageName}")`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(`require("${packageName}")`, '')
            } else if (hardhatConfigFile.search(`require('${packageName}')`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(`require('${packageName}')`, '')
            } else if (hardhatConfigFile.search(`import "${packageName}";`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(`import "${packageName}";`, '')
            } else if (hardhatConfigFile.search(`import '${packageName}';`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(`import '${packageName}';`, '')
            } else if (hardhatConfigFile.search(`import "${packageName}"`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(`import "${packageName}"`, '')
            } else if (hardhatConfigFile.search(`import '${packageName}'`)) {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile.replace(`import '${packageName}'`, '')
            } else {
                console.log(
                    '\x1b[34m%s\x1b[0m',
                    'Package ' + packageName + ' not found in ' + hardhatConfigFilePath + ' file'
                )
                newHardHatConfig = hardhatConfigFile
            }
            fs.writeFileSync(hardhatConfigFilePath, newHardHatConfig)
        }
    }
}

const detectPackage = async (
    packageName: string,
    install: boolean,
    unistall: boolean,
    addRemoveInHardhatConfig: boolean
) => {
    if (require && require.main) {
        const nodeModulesPath = path.join(path.dirname(require.main.filename), '../../../')
        if (fs.existsSync(nodeModulesPath + packageName)) {
            if (unistall) {
                console.log('\x1b[34m%s\x1b[0m', 'Uninstalling package: ', '\x1b[97m\x1b[0m', packageName)
                if (fs.existsSync('package-lock.json')) {
                    if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, false, true)
                    await runCommand('npm remove ' + packageName, '', '')
                    await sleep(5000)
                } else if (fs.existsSync('yarn-lock.json')) {
                    if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, false, true)
                    await runCommand('yarn remove ' + packageName, '', '')
                    await sleep(5000)
                }
            }
            return true
        } else {
            if (install) {
                console.log('\x1b[34m%s\x1b[0m', 'Installing package: ', '\x1b[97m\x1b[0m', packageName)
                if (fs.existsSync('package-lock.json')) {
                    console.log('\x1b[33m%s\x1b[0m', 'Detected package-lock.json, installing with npm')
                    if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, true, false)
                    await runCommand('npm install ' + packageName, '', ' --save-dev')
                    await sleep(5000)
                } else if (fs.existsSync('yarn-lock.json')) {
                    console.log('\x1b[33m%s\x1b[0m', 'Detected yarn-lock.json, installing with yarn')
                    if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, true, false)
                    await runCommand('yarn add ' + packageName, '', ' -D')
                    await sleep(5000)
                }
            }
            return false
        }
    }
}

export default detectPackage
