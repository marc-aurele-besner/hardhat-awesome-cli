#!/usr/bin/env node

import { spawn } from 'child_process'
import fs from 'fs'
import { extendConfig, extendEnvironment, task } from 'hardhat/config'
import { lazyObject } from 'hardhat/plugins'
import { HardhatConfig, HardhatUserConfig, NetworksUserConfig } from 'hardhat/types'
import inquirer from 'inquirer'
import path from 'path'
import { exit } from 'process'

import { AwesomeAddressBook } from './AwesomeAddressBook'
import buildFoundrySetting from './buildFoundrySetting'
import buildWorkflows from './buildWorkflows'
import { DefaultChainList, DefaultHardhatPluginsList } from './config'
import MockContractsList from './mockContracts'
import './type-extensions'
import {
    IChain,
    IContractAddressDeployed,
    IExcludedFiles,
    IFileList,
    IFileSetting,
    IHardhatPluginAvailableList,
    IInquirerListField,
    IMockContractsList
} from './types'

const fileHardhatAwesomeCLI = 'hardhat-awesome-cli.json'
const fileEnvHardhatAwesomeCLI = '.env.hardhat-awesome-cli'
const fileContractsAddressDeployed = 'contractsAddressDeployed.json'
const fileContractsAddressDeployedHistory = 'contractsAddressDeployedHistory.json'
let contractsAddressDeployed: IContractAddressDeployed[] = []
let contractsAddressDeployedHistory: IContractAddressDeployed[] = []

const inquirerRunTests: IInquirerListField = { name: 'Run tests' }
if (!fs.existsSync('test')) inquirerRunTests.disabled = "We can't run tests without a test/ directory"
const inquirerRunScripts: IInquirerListField = { name: 'Run scripts' }
if (!fs.existsSync('scripts')) inquirerRunScripts.disabled = "We can't run scripts without a scripts/ directory"
const inquirerFlattenContracts: IInquirerListField = { name: 'Flatten contract' }
const inquirerRunMockContractCreator: IInquirerListField = { name: 'Create Mock contracts' }
if (!fs.existsSync('contracts')) {
    inquirerFlattenContracts.disabled = "We can't flatten contracts without a contracts/ directory"
    inquirerRunMockContractCreator.disabled = "We can't create Mock contracts without a contracts/ directory"
}
let inquirerFileContractsAddressDeployed: IInquirerListField | string = {
    name: 'Get the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if (fs.existsSync(fileContractsAddressDeployed)) {
    const rawdata: any = fs.readFileSync(fileContractsAddressDeployed)
    try {
        contractsAddressDeployed = JSON.parse(rawdata)
        inquirerFileContractsAddressDeployed = 'Get the previously deployed contracts address'
    } catch {}
}
let inquirerFileContractsAddressDeployedHistory: IInquirerListField | string = {
    name: 'Get all the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if (fs.existsSync(fileContractsAddressDeployedHistory)) {
    try {
        const rawdata: any = fs.readFileSync(fileContractsAddressDeployedHistory)
        contractsAddressDeployedHistory = JSON.parse(rawdata)
        inquirerFileContractsAddressDeployedHistory = 'Get all the previously deployed contracts address'
    } catch {}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const runCommand = async (command: string, firstCommand: string, commandFlags: string) => {
    let commandToRun = command + commandFlags
    if (firstCommand) {
        commandToRun = firstCommand + commandFlags + ' && ' + commandToRun
    }
    console.log('\x1b[33m%s\x1b[0m', 'Command to run: ', '\x1b[97m\x1b[0m', commandToRun)
    console.log(`Please wait...
`)
    const runSpawn = spawn(commandToRun, {
        stdio: 'inherit',
        shell: true
    })
    runSpawn.on('exit', (code) => {
        exit()
    })
}

const buildActivatedChainNetworkConfig = () => {
    let chainConfig: string = ''
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
    }
    if (fileSetting && fileSetting.activatedChain) {
        if (fileSetting.activatedChain.length > 0) {
            fileSetting.activatedChain.forEach((chain: IChain) => {
                const defaultRpcUrl = getEnvValue('rpcUrl'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                const defaultPrivateKey = getEnvValue('privateKey'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                const defaultMnemonic = getEnvValue('mnemonic'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                let buildAccounts = ''
                if (defaultPrivateKey) {
                    buildAccounts = `"accounts": ["${defaultPrivateKey}"]`
                } else if (defaultMnemonic) {
                    buildAccounts = `"accounts": {
                        "mnemonic": "${defaultMnemonic}"
                    }`
                }
                if (buildAccounts) {
                    if (defaultRpcUrl || chain.defaultRpcUrl) {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas || 'auto'}",
                                "gasPrice": "auto",
                                "gasMultiplier": 1,
                                "url": "${defaultRpcUrl || chain.defaultRpcUrl || 'http://localhost:8545'}",
                                "timeout": 40000,
                                "httpHeaders": {},
                                ${buildAccounts || '"accounts": "remote"'}
                            },`
                    } else {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas || 'auto'}",
                                "gasPrice": "auto",
                                "gasMultiplier": 1,
                                "url": "http://localhost:8545",
                                "timeout": 40000,
                                "httpHeaders": {},
                                ${buildAccounts || '"accounts": "remote"'}
                            },`
                    }
                } else {
                    if (defaultRpcUrl || chain.defaultRpcUrl) {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas || 'auto'}",
                                "gasPrice": "auto",
                                "gasMultiplier": 1,
                                "url": "${defaultRpcUrl || chain.defaultRpcUrl || ''}",
                                "timeout": 40000,
                                "httpHeaders": {},
                                ${buildAccounts || '"accounts": "remote"'}
                            },`
                    } else {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas || 'auto'}",
                                "gasPrice": "auto",
                                "gasMultiplier": 1,
                                "url": "http://localhost:8545",
                                "timeout": 40000,
                                "httpHeaders": {},
                                "accounts": "remote"
                            },`
                    }
                }
                return chainConfig
            })
            // await sleep(100)
            const fihainConfig = `${chainConfig.slice(0, -1)}`
            return fihainConfig
        }
    }
    return []
}

const buildActivatedChainList = async () => {
    const chainList: IChain[] = []
    let fileSetting: IFileSetting = {}
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
    }
    if (fileSetting && fileSetting.activatedChain) {
        if (fileSetting.activatedChain.length > 0) {
            fileSetting.activatedChain.forEach((chain: IChain) => {
                chainList.push(chain)
            })
        }
    }
    return chainList
}

const buildAllTestsList = async () => {
    const testList: IFileList[] = []
    if (fs.existsSync('test')) {
        testList.push({
            name: 'All tests',
            type: 'all',
            filePath: ''
        })
        const files = fs.readdirSync('test')
        files.map((file) => {
            let fileName = file.replace(/\.[^/.]+$/, '').replace(/\.test/, ' - Test')
            const words = fileName.split(' ')
            for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].substr(1)
            }
            fileName = words.join(' ')
            testList.push({
                name: fileName,
                type: 'file',
                filePath: file
            })
        })
    }
    return testList
}

const buildAllScriptsList = async () => {
    const scriptsList: IFileList[] = []
    if (fs.existsSync('scripts')) {
        const files = fs.readdirSync('scripts')
        files.map((file) => {
            let fileName = file.replace(/\.[^/.]+$/, '').replace(/\.test/, ' - Test')
            const words = fileName.split(' ')
            for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].substr(1)
            }
            fileName = words.join(' ')
            scriptsList.push({
                name: fileName,
                type: 'file',
                filePath: file
            })
        })
    }
    return scriptsList
}

const buildAllContractsList = async () => {
    const scontractsList: IFileList[] = []
    if (fs.existsSync('contracts')) {
        const files = fs.readdirSync('contracts')
        files.map((file) => {
            let fileName = file.replace(/\.[^/.]+$/, '')
            const words = fileName.split(' ')
            for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].substr(1)
            }
            fileName = words.join(' ')
            scontractsList.push({
                name: fileName,
                type: 'file',
                filePath: file
            })
        })
    }
    return scontractsList
}

const buildTestsList = async () => {
    let allTestList: IFileList[] = await buildAllTestsList()
    let excludedFiles: IExcludedFiles[] = await buildExcludedFile()
    const buildFilePath: string[] = []
    if (excludedFiles && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: IExcludedFiles) => test.directory === 'test')
        if (excludedFiles && excludedFiles.length > 0) {
            excludedFiles.map((file: IExcludedFiles) => {
                buildFilePath.push(file.filePath)
            })
            allTestList = allTestList.filter((script: IFileList) => {
                return !buildFilePath.includes(script.filePath)
            })
            return allTestList
        }
    } else {
        return allTestList
    }
}

const buildScriptsList = async () => {
    let allScriptList: IFileList[] = await buildAllScriptsList()
    let excludedFiles: IExcludedFiles[] = await buildExcludedFile()
    const buildFilePath: string[] = []
    if (excludedFiles && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: any) => test.directory === 'scripts')
        if (excludedFiles && excludedFiles.length > 0) {
            excludedFiles.map((file: any) => {
                buildFilePath.push(file.filePath)
            })
            allScriptList = allScriptList.filter((script: IFileList) => {
                return !buildFilePath.includes(script.filePath)
            })
            return allScriptList
        }
    } else {
        return allScriptList
    }
}

const buildContractsList = async () => {
    let allContractsList: IFileList[] = await buildAllContractsList()
    let excludedFiles: IExcludedFiles[] = await buildExcludedFile()
    const buildFilePath: string[] = []
    if (excludedFiles && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: any) => test.directory === 'contracts')
        if (excludedFiles && excludedFiles.length > 0) {
            excludedFiles.map((file: any) => {
                buildFilePath.push(file.filePath)
            })
            allContractsList = allContractsList.filter((script: IFileList) => {
                return !buildFilePath.includes(script.filePath)
            })
            return allContractsList
        }
    } else {
        return allContractsList
    }
}

const buildMockContract = async (contractName: string) => {
    if (require && require.main) {
        const packageRootPath = path.join(path.dirname(require.main.filename), '../../../hardhat-awesome-cli/src/mockContracts')
        if (fs.existsSync(packageRootPath)) {
            if (fs.existsSync('contracts')) {
                if (MockContractsList) {
                    const contractToMock: IMockContractsList[] = MockContractsList.filter((contract) => contract.name === contractName)
                    if (contractToMock) {
                        if (fs.existsSync('contracts/' + contractName + '.sol')) {
                            console.log('\x1b[33m%s\x1b[0m', 'Mock contract already exists')
                        } else {
                            if (fs.existsSync('contracts/' + contractName + '.sol')) {
                                console.log('\x1b[33m%s\x1b[0m', "Can't locate the mock contract")
                            } else {
                                console.log('\x1b[32m%s\x1b[0m', 'Creating ', contractName, ' in contracts/')
                                fs.copyFileSync(packageRootPath + '/' + contractName + '.sol', 'contracts/' + contractName + '.sol')
                            }
                        }
                        if (contractToMock[0].dependencies && contractToMock[0].dependencies.length > 0) {
                            contractToMock[0].dependencies.forEach(async (dependency: string) => {
                                await detectPackage(dependency, true, false, false)
                            })
                            await sleep(3000)
                        }
                    }
                }
            } else console.log('\x1b[33m%s\x1b[0m', 'Error creating mock contract')
        }
    }
}

const buildMockDeploymentScriptOrTest = async (contractName: string, type: string) => {
    if (require && require.main) {
        const packageRootPath = path.join(path.dirname(require.main.filename), '../../../hardhat-awesome-cli/src/mockContracts')
        if (fs.existsSync(packageRootPath)) {
            if (fs.existsSync('contracts')) {
                if (MockContractsList) {
                    let deploymentScriptOrTestPath: string = ''
                    let finalPath: string = ''
                    let scriptOrTestDir: string = ''
                    const contractToMock: IMockContractsList[] = MockContractsList.filter((contract) => contract.name === contractName)
                    if (contractToMock && type === 'deployment') {
                        scriptOrTestDir = 'scripts'
                        if (fs.existsSync('hardhat.config.js')) {
                            if (contractToMock[0].deploymentScriptJs !== undefined) deploymentScriptOrTestPath = contractToMock[0].deploymentScriptJs
                        } else if (fs.existsSync('hardhat.config.ts')) {
                            if (contractToMock[0].deploymentScriptTs !== undefined) deploymentScriptOrTestPath = contractToMock[0].deploymentScriptTs
                            else if (contractToMock[0].deploymentScriptJs !== undefined) deploymentScriptOrTestPath = contractToMock[0].deploymentScriptJs
                        }
                        finalPath = deploymentScriptOrTestPath
                    }
                    if (contractToMock && type === 'test') {
                        scriptOrTestDir = 'test'
                        if (fs.existsSync('hardhat.config.js')) {
                            if (contractToMock[0].testScriptJs !== undefined) deploymentScriptOrTestPath = contractToMock[0].testScriptJs
                        } else if (fs.existsSync('hardhat.config.ts')) {
                            if (contractToMock[0].testScriptTs !== undefined) deploymentScriptOrTestPath = contractToMock[0].testScriptTs
                            else if (contractToMock[0].testScriptJs !== undefined) deploymentScriptOrTestPath = contractToMock[0].testScriptJs
                        }
                        finalPath = deploymentScriptOrTestPath
                    }
                    if (contractToMock && type === 'testForge') {
                        scriptOrTestDir = 'contracts/test'
                        if (contractToMock[0]?.testContractFoundry !== undefined) deploymentScriptOrTestPath = contractToMock[0].testContractFoundry
                        finalPath = deploymentScriptOrTestPath.replace('testForge/', 'contracts/test/')
                    }
                    if (contractToMock && deploymentScriptOrTestPath && finalPath) {
                        if (fs.existsSync(finalPath)) {
                            console.log('\x1b[33m%s\x1b[0m', 'The ' + type + ' in ' + scriptOrTestDir + '/ already exists')
                        } else {
                            if (fs.existsSync(deploymentScriptOrTestPath)) {
                                console.log('\x1b[33m%s\x1b[0m', "Can't locate the " + type + ' ' + scriptOrTestDir)
                            } else {
                                console.log('\x1b[32m%s\x1b[0m', 'Creating ' + type + ' for ', contractName, ' in ' + scriptOrTestDir + '/')
                                const rawdata: any = fs.readFileSync(packageRootPath + '/' + deploymentScriptOrTestPath)
                                let scriptsTestRawdataModify = rawdata
                                if (type !== 'testForge') scriptsTestRawdataModify = rawdata.toString().slice(2).replace(/\*\//g, '').trim()
                                await sleep(500)
                                fs.writeFileSync(finalPath, `${scriptsTestRawdataModify}`)
                            }
                        }
                    }
                }
            } else console.log('\x1b[33m%s\x1b[0m', 'Error creating ' + type + ' script')
        }
    }
}

const buildExcludedFile = async () => {
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.excludedFiles && fileSetting.excludedFiles.length > 0) {
            return fileSetting.excludedFiles
        }
    }
    return []
}

const addChain = async (chainName: string, chainToAdd: IChain) => {
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting) {
            if (!fileSetting.activatedChain) {
                fileSetting = {
                    ...fileSetting,
                    activatedChain: []
                }
            } else {
                fileSetting = {
                    ...fileSetting,
                    activatedChain: [...fileSetting.activatedChain]
                }
            }
        }
    } else {
        fileSetting = {
            activatedChain: []
        }
    }
    if (fileSetting && fileSetting.activatedChain) {
        if (fileSetting.activatedChain.length > 0) {
            if (!fileSetting.activatedChain.find((chain: IChain) => chain.name === chainName)) {
                fileSetting.activatedChain.push(chainToAdd)
            }
        } else {
            fileSetting.activatedChain.push(chainToAdd)
        }
    } else {
        fileSetting.push({
            activatedChain: [chainToAdd]
        })
    }
    try {
        fs.writeFileSync(fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
    } catch {
        console.log('\x1b[31m%s\x1b[0m', 'Error adding chain: ' + chainName + ' to your settings!')
    }
}

const addActivatedChain = async (chainName: string) => {
    const FullChainList: IChain[] = DefaultChainList
    const chainToAdd: IChain | undefined = FullChainList.find((chain: IChain) => chain.name === chainName)
    if (chainToAdd !== undefined) {
        await addChain(chainName, chainToAdd)
    }
}

const removeActivatedChain = async (chainName: string) => {
    const FullChainList: IChain[] = DefaultChainList
    const chainToRemove: IChain | undefined = FullChainList.find((chain: IChain) => chain.name === chainName)
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI) && chainToRemove) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.activatedChain) {
            if (fileSetting.activatedChain.length > 0) {
                fileSetting.activatedChain
                    .filter((chain: IChain) => chain.chainName === chainToRemove.chainName)
                    .forEach((chain: IChain) => {
                        fileSetting.activatedChain.pop(chain)
                        fs.writeFileSync(fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
                    })
            }
        }
    }
}

const addCustomChain = async (chainDetails: IChain) => {
    const FullChainList = DefaultChainList
    const ActivatedChainList = await buildActivatedChainList()
    // Verify if the chain already exists in regular full chain list
    if (FullChainList.find((chain: IChain) => chain.chainName === chainDetails.chainName)) {
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same Short-Name already exists in regular chain selection')
    } else if (FullChainList.find((chain: IChain) => chain.chainId === chainDetails.chainId)) {
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same chainId already exists in regular chain selection')
    }
    // Verify if the chain already exists in user setting activated chain list
    else if (ActivatedChainList.find((chain: IChain) => chain.chainName === chainDetails.chainName)) {
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same Short-Name already exists in your settings activated chain list')
    } else if (ActivatedChainList.find((chain: IChain) => chain.chainId === chainDetails.chainId)) {
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same chainId already exists in your settings activated chain list')
    } else {
        await addChain(chainDetails.chainName, chainDetails)
    }
}

const addExcludedFiles = async (directory: string, filePath: string) => {
    let fileSetting: any = []
    const fileToAdd = {
        directory,
        filePath
    }
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && !fileSetting.excludedFiles) {
            fileSetting = {
                ...fileSetting,
                excludedFiles: []
            }
        }
    } else {
        fileSetting = {
            excludedFiles: []
        }
    }
    if (fileSetting && fileSetting.excludedFiles) {
        if (fileSetting.excludedFiles.length > 0) {
            if (
                !fileSetting.excludedFiles.find((file: { directory: string; filePath: string }) => file.directory === directory && file.filePath === filePath)
            ) {
                fileSetting.excludedFiles.push(fileToAdd)
            }
        } else {
            fileSetting.excludedFiles.push(fileToAdd)
        }
    } else {
        fileSetting.push({
            excludedFiles: [fileToAdd]
        })
    }
    try {
        fs.writeFileSync(fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
    } catch {
        console.log('\x1b[31m%s\x1b[0m', 'Error adding file: ' + directory + '/' + filePath + ' to your excluded files settings!')
    }
}

const removeExcludedFiles = async (directory: string, filePath: string) => {
    let allFiles: any = []
    const excludedFiles: any = []
    if (directory === 'test') {
        allFiles = (await buildAllTestsList())
            .filter((test) => test.type === 'file')
            .map((file: any) => {
                return file.filePath
            })
    } else if (directory === 'script') {
        allFiles = (await buildAllScriptsList())
            .filter((script: IFileList) => script.type === 'file')
            .map((file: IFileList) => {
                return file.filePath
            })
    }
    const fileToRemove = allFiles.find((file: IExcludedFiles) => file.directory === directory && file.filePath === filePath)
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.excludedFiles) {
            if (fileSetting.excludedFiles.length > 0) {
                fileSetting.excludedFiles
                    .filter((file: IExcludedFiles) => file.directory === directory && file.filePath === filePath)
                    .forEach(() => {
                        fileSetting.excludedFiles.pop(fileToRemove)
                        fs.writeFileSync(fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
                    })
            }
        }
    }
}

const addEnvFileInGitiignore = async (ignoreFile: string, envFile: string, createIfNotExist: boolean) => {
    if (fs.existsSync(ignoreFile)) {
        const rawdata: any = fs.readFileSync(ignoreFile)
        const gitignore = rawdata.toString()
        if (!gitignore.includes(envFile)) {
            console.log('\x1b[33m%s\x1b[0m', 'Adding ' + envFile + ' to your ' + ignoreFile + ' file')
            const newGitignore = rawdata + '\n\n#Hardhat-Awesome-CLI\n' + envFile
            fs.writeFileSync(ignoreFile, newGitignore)
        }
    } else {
        if (createIfNotExist) {
            const newGitignore = '\n\n#Hardhat-Awesome-CLI\n' + envFile
            fs.writeFileSync(ignoreFile, newGitignore)
            console.log('\x1b[33m%s\x1b[0m', 'Adding ' + envFile + ' to your ' + ignoreFile + ' file')
        }
    }
}

const importPackageHardhatConfigFile = async (packageName: string, addToConfig: boolean, removeFromConfig: boolean) => {
    let hardhatConfigFilePath: string = ''
    if (fs.existsSync('hardhat.config.js')) {
        hardhatConfigFilePath = 'hardhat.config.js'
    } else if (fs.existsSync('hardhat.config.ts')) {
        hardhatConfigFilePath = 'hardhat.config.ts'
    } else {
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
                console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(
                    `require("hardhat-awesome-cli");`,
                    `require("hardhat-awesome-cli");
require("${packageName}");`
                )
            } else if (hardhatConfigFile.includes(`require('hardhat-awesome-cli');`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(
                    `require('hardhat-awesome-cli');`,
                    `require('hardhat-awesome-cli');
require('${packageName}');`
                )
            } else if (hardhatConfigFile.includes(`require("hardhat-awesome-cli")`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(
                    `require("hardhat-awesome-cli")`,
                    `require("hardhat-awesome-cli")
require("${packageName}")`
                )
            } else if (hardhatConfigFile.includes(`require('hardhat-awesome-cli')`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(
                    `require('hardhat-awesome-cli')`,
                    `require('hardhat-awesome-cli')
require('${packageName}')`
                )
            } else if (hardhatConfigFile.includes(`import "hardhat-awesome-cli";`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(
                    `import "hardhat-awesome-cli";`,
                    `import "hardhat-awesome-cli";
import "${packageName}";`
                )
            } else if (hardhatConfigFile.includes(`import 'hardhat-awesome-cli';`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(
                    `import 'hardhat-awesome-cli';')`,
                    `import 'hardhat-awesome-cli';
import '${packageName}';`
                )
            } else if (hardhatConfigFile.includes(`import "hardhat-awesome-cli"`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(
                    `import "hardhat-awesome-cli"`,
                    `import "hardhat-awesome-cli"
import "${packageName}"`
                )
            } else if (hardhatConfigFile.includes(`import 'hardhat-awesome-cli'`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Adding ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(
                    `import 'hardhat-awesome-cli'`,
                    `import 'hardhat-awesome-cli'
import '${packageName}'`
                )
            } else {
                newHardHatConfig = hardhatConfigFile
                console.log('\x1b[34m%s\x1b[0m', 'Package ' + packageName + ' not imported in ' + hardhatConfigFilePath + ' file')
            }
            fs.writeFileSync(hardhatConfigFilePath, newHardHatConfig)
        } else if (removeFromConfig) {
            let newHardHatConfig: string = ''
            if (hardhatConfigFile.search(`require("${packageName}");`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(`require("${packageName}");`, '')
            } else if (hardhatConfigFile.search(`require('${packageName}');`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(`require('${packageName}');`, '')
            } else if (hardhatConfigFile.search(`require("${packageName}")`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(`require("${packageName}")`, '')
            } else if (hardhatConfigFile.search(`require('${packageName}')`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(`require('${packageName}')`, '')
            } else if (hardhatConfigFile.search(`import "${packageName}";`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(`import "${packageName}";`, '')
            } else if (hardhatConfigFile.search(`import '${packageName}';`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(`import '${packageName}';`, '')
            } else if (hardhatConfigFile.search(`import "${packageName}"`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(`import "${packageName}"`, '')
            } else if (hardhatConfigFile.search(`import '${packageName}'`)) {
                console.log('\x1b[33m%s\x1b[0m', 'Removing ' + packageName + ' from your ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile.replace(`import '${packageName}'`, '')
            } else {
                console.log('\x1b[34m%s\x1b[0m', 'Package ' + packageName + ' not found in ' + hardhatConfigFilePath + ' file')
                newHardHatConfig = hardhatConfigFile
            }
            fs.writeFileSync(hardhatConfigFilePath, newHardHatConfig)
        }
    }
}

const getEnvValue = (envName: string) => {
    if (fs.existsSync(fileEnvHardhatAwesomeCLI)) {
        const allEnv = require('dotenv').config({ path: fileEnvHardhatAwesomeCLI })
        const oldEnv = Object.entries(allEnv.parsed)
        for (const [key, value] of oldEnv) {
            if (key && value && key === envName) {
                return value
            }
        }
    }
    return ''
}

const writeToEnv = async (env: any, chainName: string, envToBuild: { rpcUrl: string; privateKeyOrMnemonic: any }) => {
    let isRpcUrl = false
    let isPrivateKey = false
    let isMnemonic = false
    const rpcUrlEnv = 'rpcUrl'.toUpperCase() + '_' + chainName.toUpperCase() + ' = ' + '"' + envToBuild.rpcUrl + '"'
    const privateKeyEnv = 'privateKey'.toUpperCase() + '_' + chainName.toUpperCase() + ' = ' + '"' + envToBuild.privateKeyOrMnemonic + '"'
    const mnemonicEnv = 'mnemonic'.toUpperCase() + '_' + chainName.toUpperCase() + ' = ' + '"' + envToBuild.privateKeyOrMnemonic + '"'
    if (envToBuild.rpcUrl) {
        isRpcUrl = true
    }
    if (envToBuild.privateKeyOrMnemonic) {
        try {
            const owner = new env.ethers.Wallet(envToBuild.privateKeyOrMnemonic, env.ethers.provider)
            isPrivateKey = true
        } catch {
            try {
                const owner = await env.ethers.Wallet.fromMnemonic(envToBuild.privateKeyOrMnemonic)
                isMnemonic = true
            } catch {
                console.log('\x1b[31m%s\x1b[0m', 'Error: Private Key or Mnemonic is not valid')
            }
            isPrivateKey = false
        }
    }
    let envToWrite = ''
    if (isRpcUrl) envToWrite = rpcUrlEnv + '\n'
    if (isPrivateKey) envToWrite = privateKeyEnv + '\n'
    if (isMnemonic) envToWrite = mnemonicEnv + '\n'

    if (fs.existsSync(fileEnvHardhatAwesomeCLI)) {
        const allEnv = require('dotenv').config({ path: fileEnvHardhatAwesomeCLI })
        const oldEnv = Object.entries(allEnv.parsed)
        let newEnv = ''
        const wipEnv: any = []
        let isRpcUrlEnvExist = false
        let isPrivateKeyEnvExist = false
        let isMnemoniclEnvExist = false
        for (const [key, value] of oldEnv) {
            if (!wipEnv.find((eachEnv: any) => eachEnv.key === key)) {
                wipEnv.push({
                    key
                })
                if (key && value && isRpcUrl && key === 'rpcUrl'.toUpperCase() + '_' + chainName.toUpperCase()) {
                    newEnv += key + ' = "' + envToBuild.rpcUrl + '"\n'
                    isRpcUrlEnvExist = true
                } else if (key && value && isPrivateKey && key === 'privateKey'.toUpperCase() + '_' + chainName.toUpperCase()) {
                    newEnv += key + ' = "' + envToBuild.privateKeyOrMnemonic + '"\n'
                    isPrivateKeyEnvExist = true
                } else if (key && value && isMnemonic && key === 'mnemonic'.toUpperCase() + '_' + chainName.toUpperCase()) {
                    newEnv += key + ' = "' + envToBuild.privateKeyOrMnemonic + '"\n'
                    isMnemoniclEnvExist = true
                } else {
                    newEnv += key + ' = "' + value + '"\n'
                }
            }
        }
        if (isRpcUrl && !isRpcUrlEnvExist) {
            newEnv += rpcUrlEnv + '\n'
        }
        if (isPrivateKey && !isPrivateKeyEnvExist) {
            newEnv += privateKeyEnv + '\n'
        }
        if (isMnemonic && !isMnemoniclEnvExist) {
            newEnv += mnemonicEnv + '\n'
        }
        fs.writeFileSync(fileEnvHardhatAwesomeCLI, newEnv)
    } else {
        fs.writeFileSync(fileEnvHardhatAwesomeCLI, envToWrite)
    }
    console.log('\x1b[32m%s\x1b[0m', 'Env file updated')
    await addEnvFileInGitiignore('.gitignore', fileEnvHardhatAwesomeCLI, true)
    await addEnvFileInGitiignore('.npmignore', fileEnvHardhatAwesomeCLI, false)
}

const detectPackage = async (packageName: string, install: boolean, unistall: boolean, addRemoveInHardhatConfig: boolean) => {
    if (require && require.main) {
        const nodeModulesPath = path.join(path.dirname(require.main.filename), '../../../')
        if (fs.existsSync(nodeModulesPath + packageName)) {
            if (unistall) {
                console.log('\x1b[34m%s\x1b[0m', 'Uninstalling package: ', '\x1b[97m\x1b[0m', packageName)
                if (fs.existsSync('package-lock.json')) {
                    const command = 'npm remove ' + packageName
                    if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, false, true)
                    const runSpawn = spawn(command, {
                        stdio: 'inherit',
                        shell: true
                    })
                    runSpawn.on('exit', (code) => {
                        console.log('\x1b[32m%s\x1b[0m', 'Package uninstalled!')
                        exit()
                    })
                    await sleep(5000)
                } else if (fs.existsSync('yarn-lock.json')) {
                    const command = 'yarn remove ' + packageName
                    if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, false, true)
                    const runSpawn = spawn(command, {
                        stdio: 'inherit',
                        shell: true
                    })
                    runSpawn.on('exit', (code) => {
                        console.log('\x1b[32m%s\x1b[0m', 'Package uninstalled!')
                        exit()
                    })
                    await sleep(5000)
                }
            }
            return true
        } else {
            if (install) {
                console.log('\x1b[34m%s\x1b[0m', 'Installing package: ', '\x1b[97m\x1b[0m', packageName)
                if (fs.existsSync('package-lock.json')) {
                    console.log('\x1b[33m%s\x1b[0m', 'Detected package-lock.json, installing with npm')
                    const command = 'npm install ' + packageName + ' --save-dev'
                    if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, true, false)
                    const runSpawn = spawn(command, {
                        stdio: 'inherit',
                        shell: true
                    })
                    runSpawn.on('exit', (code) => {
                        console.log('\x1b[32m%s\x1b[0m', 'Package installed!')
                        exit()
                    })
                    await sleep(5000)
                } else if (fs.existsSync('yarn-lock.json')) {
                    console.log('\x1b[33m%s\x1b[0m', 'Detected yarn-lock.json, installing with yarn')
                    if (addRemoveInHardhatConfig) await importPackageHardhatConfigFile(packageName, true, false)
                    const command = 'yarn add ' + packageName + ' -D'
                    const runSpawn = spawn(command, {
                        stdio: 'inherit',
                        shell: true
                    })
                    runSpawn.on('exit', (code) => {
                        console.log('\x1b[32m%s\x1b[0m', 'Package installed!')
                        exit()
                    })
                    await sleep(5000)
                }
            }
            return false
        }
    }
}

const serveNetworkSelector = async (env: any, command: string, firstCommand: string, GetAccountBalance: any, ServeEnvBuilder: any, noLocalNetwork: boolean) => {
    const ActivatedChainList: IChain[] = await buildActivatedChainList()
    const BuildFullChainList: IChain[] = DefaultChainList
    const activatedChainList: string[] = []
    ActivatedChainList.map((chain: IChain) => {
        if (noLocalNetwork && chain.chainName !== 'hardhat') {
            activatedChainList.push(chain.name)
        } else if (!noLocalNetwork) {
            activatedChainList.push(chain.name)
        }
    })
    if (activatedChainList.length === 0) {
        const addHardhat = BuildFullChainList.find((basicChain: IChain) => basicChain.chainName === 'hardhat')
        if (addHardhat) {
            activatedChainList.push(addHardhat.name)
        }
    }
    let commandFlags = ''
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'network',
                message: 'Select a network',
                choices: activatedChainList
            }
        ])
        .then(async (networkSelected: { network: string }) => {
            ActivatedChainList.map((chain: IChain) => {
                if (chain.name === networkSelected.network) {
                    commandFlags = ' --network ' + chain.chainName
                }
            })
            if (GetAccountBalance) {
                await GetAccountBalance(env)
            } else if (ServeEnvBuilder) {
                await ServeEnvBuilder(env, networkSelected.network)
            }
            await sleep(5000)
        })
    if (command) {
        await runCommand(command, firstCommand, commandFlags)
    }
}

const serveTestSelector = async (env: any, command: string, firstCommand: string) => {
    const testFilesObject = await buildTestsList()
    let testFilesList: string[] = []
    if (testFilesObject) {
        testFilesList = testFilesObject.map((file: IFileList) => {
            return file.name
        })
        if (testFilesList.length > 0) {
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'test',
                        message: 'Select a test',
                        choices: testFilesList
                    }
                ])
                .then(async (testSelected: { test: string }) => {
                    testFilesObject.forEach((file: IFileList) => {
                        if (file.name === testSelected.test) {
                            if (file.type === 'file') {
                                command = command + ' test/' + file.filePath
                            }
                        }
                    })
                    if (firstCommand) {
                        command = 'npx hardhat test ' + command
                    }
                    await serveNetworkSelector(env, command, firstCommand, '', '', false)
                    await sleep(5000)
                })
        }
    }
}

const serveScriptSelector = async (env: any, ServeTestSelector: any) => {
    const scriptFilesObject = await buildScriptsList()
    const scriptFilesList: string[] = []
    if (scriptFilesObject) {
        scriptFilesObject.map((file: IFileList) => {
            scriptFilesList.push(file.name)
        })
        if (scriptFilesObject.length > 0) {
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'script',
                        message: 'Select a script',
                        choices: scriptFilesList
                    }
                ])
                .then(async (scriptSelected: { script: string }) => {
                    let command = 'npx hardhat run'
                    scriptFilesObject.forEach((file: IFileList) => {
                        if (file.name === scriptSelected.script) {
                            if (file.type === 'file') {
                                command = command + ' scripts/' + file.filePath
                            }
                        }
                    })
                    if (ServeTestSelector) {
                        await ServeTestSelector(env, '', command)
                    } else {
                        await serveNetworkSelector(env, command, '', '', '', false)
                        await sleep(5000)
                    }
                })
        }
    }
}

const serveFlattenContractsSelector = async (env: any, command: string) => {
    const contractsFilesObject = await buildContractsList()
    const contractsFilesList: string[] = ['Flatten all contracts']
    if (contractsFilesObject) {
        contractsFilesObject.map((file: IFileList) => {
            contractsFilesList.push(file.name)
        })
        if (contractsFilesList.length > 0) {
            let contractFlattenName: string = ''
            await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'flatten',
                        message: 'Select a contract to flatten',
                        choices: contractsFilesList
                    }
                ])
                .then(async (contractsSelected: { flatten: string }) => {
                    if (!fs.existsSync('contractsFlatten')) {
                        fs.mkdirSync('contractsFlatten')
                    }
                    if (contractsSelected.flatten !== 'Flatten all contracts') {
                        contractsFilesObject.forEach((file: IFileList) => {
                            if (file.name === contractsSelected.flatten) {
                                if (file.type === 'file') {
                                    command = command + ' contracts/' + file.filePath
                                    contractFlattenName = file.filePath.replace('.sol', 'Flatten.sol')
                                }
                            }
                        })
                    } else {
                        contractFlattenName = 'AllContractsFlatten.sol'
                    }
                })
            if (command) {
                await runCommand(command, '', ' > contractsFlatten/' + contractFlattenName)
                await sleep(3000)
            }
        }
    }
}

const serveEnvBuilder = async (env: any, chainSelected: string) => {
    const ActivatedChainList = await buildActivatedChainList()
    if (ActivatedChainList.find((chain: IChain) => chain.name === chainSelected)) {
        const selectedChain = ActivatedChainList.find((chain: IChain) => chain.name === chainSelected) as IChain
        const defaultRpcUrl = await getEnvValue('rpcUrl'.toUpperCase() + '_' + selectedChain.chainName.toUpperCase())
        const defaultPrivateKey = await getEnvValue('privateKey'.toUpperCase() + '_' + selectedChain.chainName.toUpperCase())
        const defaultMnemonic = await getEnvValue('mnemonic'.toUpperCase() + '_' + selectedChain.chainName.toUpperCase())
        await inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'rpcUrl',
                    message: selectedChain.name + ' RPC Url',
                    default: defaultRpcUrl
                },
                {
                    type: 'input',
                    name: 'privateKeyOrMnemonic',
                    message: selectedChain.name + ' private key or mnemonic',
                    default: defaultPrivateKey || defaultMnemonic
                }
            ])
            .then(async (envToBuild: { rpcUrl: string; privateKeyOrMnemonic: string }) => {
                await writeToEnv(env, selectedChain.chainName, envToBuild)
            })
        await sleep(2000)
    }
}

const serveSettingSelector = async (env: any) => {
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'settings',
                message: 'Select a setting',
                choices: [
                    'Add/Remove chains from the chain selection',
                    'Set RPC Url, private key or mnemonic for all or one chain',
                    'Add a custom chain to the current chain selection',
                    new inquirer.Separator(),
                    'See all config for activated chain'
                ]
            }
        ])
        .then(async (settingSelected: { settings: string }) => {
            const ActivatedChainList = await buildActivatedChainList()
            const activatedChainList: string[] = []
            ActivatedChainList.map((chain: IChain) => {
                activatedChainList.push(chain.name)
            })
            const FullChainList = DefaultChainList
            const fullChainList: string[] = []
            FullChainList.map((chain: IChain) => {
                fullChainList.push(chain.name)
            })
            if (settingSelected.settings === 'Add/Remove chains from the chain selection') {
                await inquirer
                    .prompt([
                        {
                            type: 'checkbox',
                            name: 'chainList',
                            message: 'Select a setting',
                            choices: fullChainList,
                            default: activatedChainList
                        }
                    ])
                    .then(async (chainListSelected: { chainList: string[] }) => {
                        fullChainList.map(async (chain: string) => {
                            if (chainListSelected.chainList.includes(chain)) {
                                await addActivatedChain(chain)
                            } else {
                                await removeActivatedChain(chain)
                            }
                        })
                        console.log('\x1b[32m%s\x1b[0m', 'Settings updated!')
                        await sleep(1000)
                    })
            }
            if (settingSelected.settings === 'Set RPC Url, private key or mnemonic for all or one chain') {
                await serveNetworkSelector(env, '', '', '', serveEnvBuilder, true)
            }
            if (settingSelected.settings === 'Add a custom chain to the current chain selection') {
                await inquirer
                    .prompt([
                        {
                            type: 'input',
                            name: 'name',
                            message: 'Chain Name'
                        },
                        {
                            type: 'input',
                            name: 'chainId',
                            message: 'Chain Id'
                        },
                        {
                            type: 'input',
                            name: 'gas',
                            message: 'Chain gas setting',
                            default: 'auto'
                        },
                        {
                            type: 'input',
                            name: 'defaultRpcUrl',
                            message: 'Chain default RPC Url'
                        }
                    ])
                    .then(async (chainSelected: { name: string; chainId: number; gas: string; defaultRpcUrl?: string }) => {
                        const getNetworkConfig = buildActivatedChainNetworkConfig()
                        let buildNetworkConfig: any = {}
                        if (getNetworkConfig) {
                            buildNetworkConfig = `{
                                    "networks": [
                                        {${getNetworkConfig}}
                                    ]
                                }`
                            buildNetworkConfig = JSON.parse(buildNetworkConfig)
                        }
                        let chainName: string = ''
                        if (buildNetworkConfig.networks[0].customChain1 !== undefined && !chainName) chainName = 'customChain1'
                        if (buildNetworkConfig.networks[0].customChain2 !== undefined && !chainName) chainName = 'customChain2'
                        if (buildNetworkConfig.networks[0].customChain3 !== undefined && !chainName) chainName = 'customChain3'
                        if (buildNetworkConfig.networks[0].customChain4 !== undefined && !chainName) chainName = 'customChain4'
                        if (buildNetworkConfig.networks[0].customChain5 !== undefined && !chainName) chainName = 'customChain5'
                        if (buildNetworkConfig.networks[0].customChain6 !== undefined && !chainName) chainName = 'customChain6'
                        if (buildNetworkConfig.networks[0].customChain7 !== undefined && !chainName) chainName = 'customChain7'
                        if (buildNetworkConfig.networks[0].customChain8 !== undefined && !chainName) chainName = 'customChain8'
                        if (chainName) {
                            const chainToAdd: IChain = {
                                name: chainSelected.name,
                                chainName,
                                chainId: chainSelected.chainId,
                                gas: chainSelected.gas,
                                defaultRpcUrl: chainSelected.defaultRpcUrl
                            }
                            await addCustomChain(chainToAdd)
                        }
                    })
            }
            if (settingSelected.settings === 'See all config for activated chain') {
                const getNetworkConfig = buildActivatedChainNetworkConfig()
                let buildNetworkConfig: any = {}
                if (getNetworkConfig) {
                    buildNetworkConfig = `{
                            "networks": [
                                {${getNetworkConfig}}
                            ]
                        }`
                    buildNetworkConfig = JSON.parse(buildNetworkConfig)
                }
                console.table(buildNetworkConfig.networks[0])
            }
        })
}

const serveExcludeFileSelector = async (option: string) => {
    let allFiles: IFileList[] = []
    let excludedFiles: IExcludedFiles[] = await buildExcludedFile()
    const allFilesSelection: string[] = []
    let allExcludedSelection: string[] = []
    if (option === 'test') {
        allFiles = await buildAllTestsList()
    } else if (option === 'scripts') {
        allFiles = await buildAllScriptsList()
    } else if (option === 'contracts') {
        allFiles = await buildAllContractsList()
    }
    if (allFiles && allFiles.length > 0) {
        if (allFiles.filter((test: IFileList) => test.type === 'file').length > 0) {
            allFiles
                .filter((test: IFileList) => test.type === 'file')
                .map((file: IFileList) => {
                    allFilesSelection.push(file.filePath)
                })
        }
    }
    if (excludedFiles && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: IExcludedFiles) => test.directory === option)
        if (excludedFiles && excludedFiles.length > 0) {
            allExcludedSelection = excludedFiles.map((file: IExcludedFiles) => {
                return file.filePath
            })
        }
    }
    await inquirer
        .prompt([
            {
                type: 'checkbox',
                name: 'allFiles',
                message: 'Select the files you want to exclude',
                choices: allFilesSelection,
                default: allExcludedSelection
            }
        ])
        .then(async (activateFilesSelected: { allFiles: string[] }) => {
            allFiles.map(async (file: IFileList) => {
                if (activateFilesSelected.allFiles.includes(file.filePath)) {
                    await addExcludedFiles(option, file.name)
                } else {
                    await removeExcludedFiles(option, file.name)
                }
            })
            console.log('\x1b[32m%s\x1b[0m', 'Settings updated!')
        })
}

const serveWorkflowBuilder = async () => {
    let workflowToAdd: string = ''
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'workflowType',
                message: 'Select a workflow to create',
                choices: [
                    'NPM - Hardhat - Test & Coverage',
                    'NPM - Foundry - Forge Test',
                    new inquirer.Separator(),
                    'Yarn - Hardhat - Test & Coverage',
                    'Yarn - Foundry - Forge Test'
                ]
            }
        ])
        .then(async (workflowSelected: { workflowType: string }) => {
            workflowToAdd = workflowSelected.workflowType
        })
    if (workflowToAdd) await buildWorkflows(workflowToAdd)
}

const serveMoreSettingSelector = async () => {
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'moreSettings',
                message: 'Select a mock contract',
                choices: [
                    'Exclude test file from the tests selection list',
                    'Exclude script file from the scripts selection list',
                    'Exclude contract file from the contract selection list',
                    new inquirer.Separator(),
                    'Add other Hardhat plugins',
                    'Remove other Hardhat plugins',
                    new inquirer.Separator(),
                    'Create Github test workflows',
                    'Create Foundry settings, remmapping and test utilities',
                    new inquirer.Separator()
                ]
            }
        ])
        .then(async (moreSettingsSelected: { moreSettings: string }) => {
            if (moreSettingsSelected.moreSettings === 'Exclude test file from the tests selection list') {
                await serveExcludeFileSelector('test')
            }
            if (moreSettingsSelected.moreSettings === 'Exclude script file from the scripts selection list') {
                await serveExcludeFileSelector('scripts')
            }
            if (moreSettingsSelected.moreSettings === 'Exclude contract file from the contract selection list') {
                await serveExcludeFileSelector('contracts')
            }
            if (moreSettingsSelected.moreSettings === 'Add other Hardhat plugins') {
                await servePackageInstaller()
            }
            if (moreSettingsSelected.moreSettings === 'Remove other Hardhat plugins') {
                await servePackageUninstaller()
            }
            if (moreSettingsSelected.moreSettings === 'Create Github test workflows') {
                await serveWorkflowBuilder()
            }
            if (moreSettingsSelected.moreSettings === 'Create Foundry settings, remmapping and test utilities') {
                await buildFoundrySetting()
            }
        })
}

const servePackageInstaller = async () => {
    const hardhatPluginAvailableList: string[] = DefaultHardhatPluginsList.map((plugin: IHardhatPluginAvailableList) => {
        return plugin.title
    })
    const hardhatPluginInstalled: string[] = []
    DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
        if (await detectPackage(plugin.name, false, false, false)) {
            hardhatPluginInstalled.push(plugin.title)
        }
    })
    await sleep(500)
    const hardhatPluginToNotInclude = new Set(hardhatPluginInstalled)
    const hardhatPluginToInstall: string[] = hardhatPluginAvailableList.filter((plugin: string) => !hardhatPluginToNotInclude.has(plugin))
    let packageToInstall: IHardhatPluginAvailableList | undefined
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'plugins',
                message: 'Select a plugin to install',
                choices: hardhatPluginToInstall
            }
        ])
        .then(async (pluginssSelected: { plugins: string }) => {
            DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
                if (plugin.title === pluginssSelected.plugins) packageToInstall = plugin
            })
            await sleep(1500)
        })
    if (packageToInstall !== undefined) {
        await detectPackage(packageToInstall.name, true, false, packageToInstall.addInHardhatConfig)
        await sleep(5000)
    }
}

const servePackageUninstaller = async () => {
    const hardhatPluginInstalled: string[] = []
    DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
        if (await detectPackage(plugin.name, false, false, false)) {
            hardhatPluginInstalled.push(plugin.title)
        }
    })
    await sleep(1000)
    let packageToUninstall: IHardhatPluginAvailableList | undefined
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'plugins',
                message: 'Select a plugin to install',
                choices: hardhatPluginInstalled
            }
        ])
        .then(async (pluginssSelected: { plugins: string }) => {
            DefaultHardhatPluginsList.map(async (plugin: IHardhatPluginAvailableList) => {
                if (plugin.title === pluginssSelected.plugins) packageToUninstall = plugin
            })
            await sleep(1500)
        })
    if (packageToUninstall !== undefined) await detectPackage(packageToUninstall.name, false, true, packageToUninstall.addInHardhatConfig)
    await sleep(5000)
}

const serveMockContractCreatorSelector = async () => {
    if (MockContractsList) {
        const mockContractsList: string[] = MockContractsList.map((file: IMockContractsList) => {
            return file.name
        })
        let mockContractFirstSelected: string = ''
        let mockContractToAdd: { mockContract: string; mockDeploymentScript: string; mockTestScript: string; mockTestContractFoundry: string } | undefined
        await inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'mockContract',
                    message: 'Select a mock contract',
                    choices: mockContractsList
                }
            ])
            .then(async (mockContractSelected: { mockContract: string }) => {
                mockContractFirstSelected = mockContractSelected.mockContract
            })
        if (mockContractFirstSelected) {
            const mockContractFirstSelectedDetail = MockContractsList.filter((file: IMockContractsList) => file.name === mockContractFirstSelected)[0]
            const mockContractDetailSelector = []
            if (mockContractFirstSelectedDetail.deploymentScriptJs !== undefined || mockContractFirstSelectedDetail.deploymentScriptTs !== undefined)
                mockContractDetailSelector.push({
                    type: 'list',
                    name: 'mockDeploymentScript',
                    message: 'Create a deployment script for this mock contract',
                    choices: ['yes', 'no']
                })
            if (mockContractFirstSelectedDetail.testScriptJs !== undefined || mockContractFirstSelectedDetail.testScriptTs !== undefined)
                mockContractDetailSelector.push({
                    type: 'list',
                    name: 'mockTestScript',
                    message: 'Create a test script for this mock contract',
                    choices: ['yes', 'no']
                })
            if (mockContractFirstSelectedDetail.testContractFoundry !== undefined)
                mockContractDetailSelector.push({
                    type: 'list',
                    name: 'mockTestContractFoundry',
                    message: 'Create a Foundry test contract for this mock contract',
                    choices: ['yes', 'no']
                })
            await inquirer
                .prompt(mockContractDetailSelector)
                .then(async (mockContractSelected: { mockDeploymentScript: string; mockTestScript: string; mockTestContractFoundry: string }) => {
                    mockContractToAdd = {
                        mockContract: mockContractFirstSelected,
                        mockDeploymentScript: mockContractSelected.mockDeploymentScript || 'no',
                        mockTestScript: mockContractSelected.mockTestScript || 'no',
                        mockTestContractFoundry: mockContractSelected.mockTestContractFoundry || 'no'
                    }
                })
        }
        if (mockContractToAdd !== undefined) {
            await buildMockContract(mockContractToAdd.mockContract)
            if (mockContractToAdd.mockDeploymentScript === 'yes') {
                await buildMockDeploymentScriptOrTest(mockContractToAdd.mockContract, 'deployment')
            }
            if (mockContractToAdd.mockTestScript === 'yes') {
                await buildMockDeploymentScriptOrTest(mockContractToAdd.mockContract, 'test')
            }
            if (mockContractToAdd.mockTestContractFoundry === 'yes') {
                await buildMockDeploymentScriptOrTest(mockContractToAdd.mockContract, 'testForge')
            }
        }
    }
}

const serveDeploymentContractCreatorSelector = async () => {}

const serveAccountBalance = async (env: any) => {
    const getAccountBalance = async (Env: any) => {
        const [deployer] = await Env.ethers.getSigners()
        const network = await Env.network

        // Get account balance
        const balance = await deployer.getBalance()
        console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', '\x1b[97m%s\x1b[0m', network.name)
        console.log('\x1b[32m%s\x1b[0m', 'Account address: ', '\x1b[97m%s\x1b[0m', deployer.address)
        console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', '\x1b[97m%s\x1b[0m', balance.toString())
    }

    await serveNetworkSelector(env, '', '', getAccountBalance, '', false)
}

const serveCli = async (env: any) => {
    console.log(
        `
`,
        '\x1b[34m',
        'Welcome to',
        '\x1b[32m',
        `
 .d8b.  db   d8b   db d88888b .d8888.  .d88b.  .88b  d88. d88888b      .o88b. db      d888888b 
d8' '8b 88   I8I   88 88'     88'  YP .8P  Y8. 88'YbdP'88 88'         d8P  Y8 88        '88'   
88ooo88 88   I8I   88 88ooooo '8bo.   88    88 88  88  88 88ooooo     8P      88         88    
88~~~88 Y8   I8I   88 88~~~~~   'Y8b. 88    88 88  88  88 88~~~~~     8b      88         88    
88   88 '8b d8'8b d8' 88.     db   8D '8b  d8' 88  88  88 88.         Y8b  d8 88booo.   .88.   
YP   YP  '8b8' '8d8'  Y88888P '8888Y'  'Y88P'  YP  YP  YP Y88888P      'Y88P' Y88888P Y888888P 
`
    )
    const buildMainOptions: any = [inquirerRunTests, inquirerRunScripts, inquirerFlattenContracts]
    if (inquirerRunTests.name === 'Run tests' && inquirerRunScripts.name === 'Run scripts') buildMainOptions.push('Select scripts and tests to run')
    const solidityCoverageDetected = await detectPackage('solidity-coverage', false, false, false)
    if (solidityCoverageDetected) buildMainOptions.push('Run coverage tests')
    buildMainOptions.push(
        'Setup chains, RPC and accounts',
        'More settings',
        new inquirer.Separator(),
        // 'Deploy all contracts and run tests',
        inquirerRunMockContractCreator,
        // 'Create deployment scripts',
        'Get account balance',
        new inquirer.Separator(),
        inquirerFileContractsAddressDeployed,
        inquirerFileContractsAddressDeployedHistory,
        new inquirer.Separator()
    )
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What do you want to do?',
                choices: buildMainOptions
            }
        ])
        .then(async (answers: { action: string }) => {
            let command = ''

            if (answers.action === 'Run tests') {
                command = 'npx hardhat test'
                await serveTestSelector(env, command, '')
            }
            if (answers.action === 'Run scripts') {
                await serveScriptSelector(env, '')
            }
            if (answers.action === 'Flatten contracts') {
                command = 'npx hardhat flatten'
                await serveFlattenContractsSelector(env, command)
            }
            if (answers.action === 'Select scripts and tests to run') {
                await serveScriptSelector(env, serveTestSelector)
            }
            if (answers.action === 'Run coverage tests') {
                command = 'npx hardhat coverage'
                await serveTestSelector(env, command, '')
            }
            if (answers.action === 'Setup chains, RPC and accounts') {
                await serveSettingSelector(env)
            }
            if (answers.action === 'More settings') {
                await serveMoreSettingSelector()
            }

            if (answers.action === 'Create Mock contracts') {
                await serveMockContractCreatorSelector()
            }
            if (answers.action === 'Create deployment scripts') {
                await serveDeploymentContractCreatorSelector()
            }
            if (answers.action === 'Get account balance') {
                await serveAccountBalance(env)
            }
        })
}

extendConfig(async (config: HardhatConfig, userConfig: HardhatUserConfig) => {
    const userPath = userConfig.paths?.cli
    let cli: string
    if (userPath === undefined) {
        cli = path.join(config.paths.root, 'cli')
    } else {
        if (path.isAbsolute(userPath)) {
            cli = userPath
        } else {
            cli = path.normalize(path.join(config.paths.root, userPath))
        }
    }
    config.paths.cli = cli

    const getNetworkConfig = buildActivatedChainNetworkConfig()
    let buildNetworkConfig: any = {}
    if (getNetworkConfig) {
        buildNetworkConfig = `{
                "networks": [
                    {${getNetworkConfig}}
                ]
            }`
        buildNetworkConfig = JSON.parse(buildNetworkConfig)
    }
    if (buildNetworkConfig.networks !== undefined) {
        if (buildNetworkConfig.networks[0] !== undefined) {
            if (buildNetworkConfig.networks[0].ethereum !== undefined) config.networks.ethereum = buildNetworkConfig.networks[0].ethereum
            if (buildNetworkConfig.networks[0].ropsten !== undefined) config.networks.ropsten = buildNetworkConfig.networks[0].ropsten
            if (buildNetworkConfig.networks[0].rinkeby !== undefined) config.networks.rinkeby = buildNetworkConfig.networks[0].rinkeby
            if (buildNetworkConfig.networks[0].kovan !== undefined) config.networks.kovan = buildNetworkConfig.networks[0].kovan
            if (buildNetworkConfig.networks[0].polygon !== undefined) config.networks.polygon = buildNetworkConfig.networks[0].polygon
            if (buildNetworkConfig.networks[0].mumbai !== undefined) config.networks.mumbai = buildNetworkConfig.networks[0].mumbai
            if (buildNetworkConfig.networks[0].optimism !== undefined) config.networks.optimism = buildNetworkConfig.networks[0].optimism
            if (buildNetworkConfig.networks[0].optimismTestnetKovan !== undefined)
                config.networks.optimismTestnetKovan = buildNetworkConfig.networks[0].optimismTestnetKovan
            // Custom networks
            if (buildNetworkConfig.networks[0].customChain1 !== undefined) config.networks.customChain1 = buildNetworkConfig.networks[0].customChain1
            if (buildNetworkConfig.networks[0].customChain2 !== undefined) config.networks.customChain2 = buildNetworkConfig.networks[0].customChain2
            if (buildNetworkConfig.networks[0].customChain3 !== undefined) config.networks.customChain3 = buildNetworkConfig.networks[0].customChain3
            if (buildNetworkConfig.networks[0].customChain4 !== undefined) config.networks.customChain4 = buildNetworkConfig.networks[0].customChain4
            if (buildNetworkConfig.networks[0].customChain5 !== undefined) config.networks.customChain5 = buildNetworkConfig.networks[0].customChain5
            if (buildNetworkConfig.networks[0].customChain6 !== undefined) config.networks.customChain6 = buildNetworkConfig.networks[0].customChain6
            if (buildNetworkConfig.networks[0].customChain7 !== undefined) config.networks.customChain7 = buildNetworkConfig.networks[0].customChain7
            if (buildNetworkConfig.networks[0].customChain8 !== undefined) config.networks.customChain8 = buildNetworkConfig.networks[0].customChain8
        }
    }
})

extendEnvironment(async (hre: any) => {
    hre.addressBook = lazyObject(() => new AwesomeAddressBook())
})

/**
 * CLI task implementation
 * @param  {HardhatUserArgs} args
 * @param  {HardhatEnv} env
 */
task('cli', 'Easy command line interface to use hardhat').setAction(async function (args, env) {
    await serveCli(env)
})
