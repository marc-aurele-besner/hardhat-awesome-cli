#!/usr/bin/env node

import { spawn } from 'child_process'
import fs from 'fs'
import { TASK_TEST_RUN_MOCHA_TESTS } from 'hardhat/builtin-tasks/task-names'
import { extendConfig, extendEnvironment, subtask, task } from 'hardhat/config'
import { lazyObject } from 'hardhat/plugins'
import { HardhatConfig, HardhatUserConfig } from 'hardhat/types'
import inquirer from 'inquirer'
import path from 'path'
import { exit, hrtime } from 'process'

import { AwesomeCliEnvironmentField } from './AwesomeCliEnvironmentField'
import MockContractsList from './mockContracts'
import './type-extensions'

const fileHardhatAwesomeCLI = 'hardhat-awesome-cli.json'
const fileEnvHardhatAwesomeCLI = '.env.hardhat-awesome-cli'
const fileContractsAddressDeployed = 'contractsAddressDeployed.json'
const fileContractsAddressDeployedHistory = 'contractsAddressDeployedHistory.json'
let contractsAddressDeployed = []
let contractsAddressDeployedHistory = []

let inquirerRunTests: any = {
    name: 'Run tests',
    disabled: "We can't run tests without a test/ directory"
}
if (fs.existsSync('test')) {
    inquirerRunTests = 'Run tests'
}
let inquirerRunScripts: any = {
    name: 'Run scripts',
    disabled: "We can't run scripts without a scripts/ directory"
}
if (fs.existsSync('scripts')) {
    inquirerRunScripts = 'Run scripts'
}
let inquirerRunMockContractCreator: any = {
    name: 'Create Mock contracts',
    disabled: "We can't create Mock contracts without a contracts/ directory"
}
if (fs.existsSync('contracts')) {
    inquirerRunMockContractCreator = 'Create Mock contracts'
}
let inquirerFileContractsAddressDeployed: any = {
    name: 'Get the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if (fs.existsSync(fileContractsAddressDeployed)) {
    const rawdata: any = fs.readFileSync(fileContractsAddressDeployed)
    contractsAddressDeployed = JSON.parse(rawdata)
    inquirerFileContractsAddressDeployed = 'Get the previously deployed contracts address'
}
let inquirerFileContractsAddressDeployedHistory: any = {
    name: 'Get all the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if (fs.existsSync(fileContractsAddressDeployedHistory)) {
    const rawdata: any = fs.readFileSync(fileContractsAddressDeployedHistory)
    contractsAddressDeployedHistory = JSON.parse(rawdata)
    inquirerFileContractsAddressDeployedHistory = 'Get all the previously deployed contracts address'
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const runCommand = async (command: string, commandFlags: string) => {
    console.log('\x1b[33m%s\x1b[0m', 'Command to run: ', '\x1b[97m%s\x1b[0m', command + commandFlags)
    console.log(`Please wait...
`)
    const runSpawn = spawn(command + commandFlags, {
        stdio: 'inherit',
        shell: true
    })
    runSpawn.on('exit', (code) => {
        exit()
    })
}

const buildFullChainList = async () => {
    const chainList: any = [
        {
            name: 'Hardhat local',
            chainName: 'hardhat',
            chainId: 31337,
            gas: 'auto'
        },
        {
            name: 'Ethereum - Mainnet',
            chainName: 'ethereum',
            chainId: 1,
            gas: 'auto'
        },
        {
            name: 'Ethereum - Ropstein',
            chainName: 'ropsten',
            chainId: 3,
            gas: 'auto'
        },
        {
            name: 'Ethereum - Rinkeby',
            chainName: 'rinkeby',
            chainId: 4,
            gas: 'auto'
        },
        {
            name: 'Ethereum - Kovan',
            chainName: 'kovan',
            chainId: 42,
            gas: 'auto'
        },
        {
            name: 'Polygon - Mainnet',
            chainName: 'polygon',
            chainId: 137,
            gas: 'auto',
            defaultRpcUrl: 'https://polygon-rpc.com'
        },
        {
            name: 'Polygon - Mumbai',
            chainName: 'mumbai',
            chainId: 80001,
            gas: 'auto',
            defaultRpcUrl: 'https://rpc-mumbai.maticvigil.com'
        }
    ]
    return chainList
}

const buildActivatedChainNetworkConfig = async () => {
    let chainConfig: string = ''
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
    }
    if (fileSetting && fileSetting.activatedChain) {
        if (fileSetting.activatedChain.length > 0) {
            await fileSetting.activatedChain.forEach(async (chain: any) => {
                const defaultRpcUrl = await getEnvValue('rpcUrl'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                const defaultPrivateKey = await getEnvValue('privateKey'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                const defaultMnemonic = await getEnvValue('mnemonic'.toUpperCase() + '_' + chain.chainName.toUpperCase())
                let buildAccounts = ''
                if (defaultPrivateKey) {
                    buildAccounts = `"accounts": ["${defaultPrivateKey}"],`
                } else if (defaultMnemonic) {
                    buildAccounts = `"accounts": {
                        "mnemonic": "${defaultMnemonic}"
                    },`
                }
                if (buildAccounts) {
                    if (defaultRpcUrl || chain.defaultRpcUrl) {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "url": "${defaultRpcUrl || chain.defaultRpcUrl || ''}",
                                "chainId": ${chain.chainId},
                                ${buildAccounts}
                                "gas": "${chain.gas}"
                            },`
                    } else {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                ${buildAccounts}
                                "gas": "${chain.gas}"
                            },`
                    }
                } else {
                    if (defaultRpcUrl || chain.defaultRpcUrl) {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "url": "${defaultRpcUrl || chain.defaultRpcUrl || ''}",
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas}"
                            },`
                    } else {
                        chainConfig =
                            chainConfig +
                            `
                            "${chain.chainName}": {
                                "chainId": ${chain.chainId},
                                "gas": "${chain.gas}"
                            },`
                    }
                }
                return chainConfig
            })
            await sleep(100)
            const fihainConfig = `${chainConfig.slice(0, -1)}`
            return fihainConfig
        }
    }
    return []
}

const buildActivatedChainList = async () => {
    const chainList: any = []
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
    }
    if (fileSetting && fileSetting.activatedChain) {
        if (fileSetting.activatedChain.length > 0) {
            fileSetting.activatedChain.forEach((chain: any) => {
                chainList.push(chain)
            })
        }
    }
    return chainList
}

const buildAllTestsList = async () => {
    const testList = []
    if (fs.existsSync('test')) {
        testList.push({
            name: 'All tests',
            type: 'all'
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
    const testList: any = []
    if (fs.existsSync('scripts')) {
        const files = fs.readdirSync('scripts')
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

const buildTestsList = async () => {
    let allTestList = await buildAllTestsList()
    let excludedFiles = await buildExcludedFile()
    if (excludedFiles && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: any) => test.directory === 'test')
        if (excludedFiles && excludedFiles.length > 0) {
            excludedFiles = excludedFiles.map((file: any) => {
                return file.filePath
            })
            allTestList = allTestList.filter((script: any) => {
                return !excludedFiles.includes(script.filePath)
            })
            return allTestList
        }
    } else {
        return allTestList
    }
}

const buildScriptsList = async () => {
    let allScriptList = await buildAllScriptsList()
    let excludedFiles = await buildExcludedFile()
    if (excludedFiles && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: any) => test.directory === 'scripts')
        if (excludedFiles && excludedFiles.length > 0) {
            excludedFiles = excludedFiles.map((file: any) => {
                return file.filePath
            })
            allScriptList = allScriptList.filter((script: any) => {
                return !excludedFiles.includes(script.filePath)
            })
            return allScriptList
        }
    } else {
        return allScriptList
    }
}

const buildMockContract = async (contractName: string) => {
    if (require && require.main) {
        const packageRootPath = path.join(path.dirname(require.main.filename), '../../../hardhat-awesome-cli/src/mockContracts')
        if (fs.existsSync(packageRootPath)) {
            if (fs.existsSync('contracts')) {
                if (MockContractsList) {
                    const contractToMock = MockContractsList.filter((contract) => contract.name === contractName)
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
                            contractToMock[0].dependencies.forEach(async (dependency) => {
                                await detectPackage(dependency, true)
                            })
                            await sleep(5000)
                        }
                    }
                }
            } else console.log('\x1b[33m%s\x1b[0m', 'Error creating mock contract')
        }
    }
}

const buildExcludedFile = async () => {
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.excludedFiles) {
            return fileSetting.excludedFiles
        }
    }
    return []
}

const addChain = async (chainName: string, chainToAdd: any) => {
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && !fileSetting.activatedChain) {
            fileSetting = {
                ...fileSetting
            }
        }
    } else {
        fileSetting = {
            activatedChain: []
        }
    }
    if (fileSetting && fileSetting.activatedChain) {
        if (fileSetting.activatedChain.length > 0) {
            if (!fileSetting.activatedChain.find((chain: any) => chain.name === chainName)) {
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
    const FullChainList = await buildFullChainList()
    const chainToAdd = FullChainList.find((chain: any) => chain.name === chainName)
    await addChain(chainName, chainToAdd)
}

const removeActivatedChain = async (chainName: string) => {
    const FullChainList = await buildFullChainList()
    const chainToRemove = FullChainList.find((chain: any) => chain.name === chainName)
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.activatedChain) {
            if (fileSetting.activatedChain.length > 0) {
                fileSetting.activatedChain
                    .filter((chain: any) => chain.chainName === chainToRemove.chainName)
                    .forEach((chain: any) => {
                        console.log('chainName2remive: ', chainName, chainToRemove)
                        fileSetting.activatedChain.pop(chain)
                        console.log('fileSetting.activatedChain ', fileSetting.activatedChain)
                        fs.writeFileSync(fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
                    })
            }
        }
    }
}

const addCustomChain = async (chainDetails: any) => {
    const FullChainList = await buildFullChainList()
    const ActivatedChainList = await buildActivatedChainList()
    // Verify if the chain already exists in regular full chain list
    if (FullChainList.find((chain: any) => chain.chainName === chainDetails.chainName)) {
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same Short-Name already exists in regular chain selection')
    } else if (FullChainList.find((chain: any) => chain.chainId === chainDetails.chainId)) {
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same chainId already exists in regular chain selection')
    }
    // Verify if the chain already exists in user setting activated chain list
    else if (ActivatedChainList.find((chain: any) => chain.chainName === chainDetails.chainName)) {
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same Short-Name already exists in your settings activated chain list')
    } else if (ActivatedChainList.find((chain: any) => chain.chainId === chainDetails.chainId)) {
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

const removeExcludedFiles = async (directory: string, filePath: any) => {
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
            .filter((script: any) => script.type === 'file')
            .map((file: any) => {
                return file.filePath
            })
    }
    const fileToRemove = allFiles.find((file: any) => file.directory === directory && file.filePath === filePath)
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.excludedFiles) {
            if (fileSetting.excludedFiles.length > 0) {
                fileSetting.excludedFiles
                    .filter((file: any) => file.directory === directory && file.filePath === filePath)
                    .forEach(() => {
                        fileSetting.excludedFiles.pop(fileToRemove)
                        fs.writeFileSync(fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
                    })
            }
        }
    }
}

const getEnvValue = async (envName: string) => {
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
}

const detectPackage = async (packageName: string, install: boolean) => {
    if (require && require.main) {
        const nodeModulesPath = path.join(path.dirname(require.main.filename), '../../../')
        if (fs.existsSync(nodeModulesPath + packageName)) return true
        else {
            if (install) {
                console.log('\x1b[34m%s\x1b[0m', 'Installing package: ', '\x1b[97m\x1b[0m', packageName)
                if (fs.existsSync('package-lock.json')) {
                    console.log('Detected package-lock.json, installing with npm')
                    const command = 'npm install ' + packageName + ' --save-dev'
                    const runSpawn = spawn(command, {
                        stdio: 'inherit',
                        shell: true
                    })
                    runSpawn.on('exit', (code) => {
                        console.log('\x1b[32m%s\x1b[0m', 'Package installed!')
                        exit()
                    })
                } else if (fs.existsSync('yarn-lock.json')) {
                    console.log('Detected yarn-lock.json, installing with yarn')
                    const command = 'yarn add ' + packageName + ' --D'
                    const runSpawn = spawn(command, {
                        stdio: 'inherit',
                        shell: true
                    })
                    runSpawn.on('exit', (code) => {
                        console.log('\x1b[32m%s\x1b[0m', 'Package installed!')
                        exit()
                    })
                }
                await sleep(5000)
            }
            return false
        }
    }
}

const serveNetworkSelector = async (env: any, command: string, GetAccountBalance: any, ServeEnvBuilder: any, noLocalNetwork: boolean) => {
    const ActivatedChainList = await buildActivatedChainList()
    const activatedChainList: string[] = []
    ActivatedChainList.map((chain: any) => {
        if (noLocalNetwork && chain.chainName !== 'hardhat') {
            activatedChainList.push(chain.name)
        } else if (!noLocalNetwork) {
            activatedChainList.push(chain.name)
        }
    })
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
            ActivatedChainList.map((chain: any) => {
                if (chain.name === networkSelected.network) {
                    commandFlags = ' --network ' + chain.chainName
                }
            })
            if (command) {
                await runCommand(command, commandFlags)
            } else if (GetAccountBalance) {
                await GetAccountBalance(env)
            } else if (ServeEnvBuilder) {
                await ServeEnvBuilder(env, networkSelected.network)
            }
            await sleep(5000)
        })
}

const serveTestSelector = async (env: any, command: string) => {
    const testFilesObject = await buildTestsList()
    let testFilesList: any = []
    if (testFilesObject) {
        testFilesList = testFilesObject.map((file) => {
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
                    testFilesObject.forEach((file: any) => {
                        if (file.name === testSelected.test) {
                            if (file.type === 'file') {
                                command = command + ' test/' + file.filePath
                            }
                        }
                    })
                    await serveNetworkSelector(env, command, '', '', false)
                    await sleep(5000)
                })
        }
    }
}

const serveScriptSelector = async (env: any) => {
    const scriptFilesObject = await buildScriptsList()
    const scriptFilesList: any = []
    if (scriptFilesObject) {
        scriptFilesObject.map((file: any) => {
            return file.name
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
                    scriptFilesObject.forEach((file: any) => {
                        if (file.name === scriptSelected.script) {
                            if (file.type === 'file') {
                                command = command + ' scripts/' + file.filePath
                            }
                        }
                    })
                    await serveNetworkSelector(env, command, '', '', false)
                    await sleep(5000)
                })
        }
    }
}

const serveEnvBuilder = async (env: any, chainSelected: string) => {
    const ActivatedChainList = await buildActivatedChainList()
    const selectedChain = ActivatedChainList.find((chain: any) => chain.name === chainSelected)
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
    await sleep(5000)
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
                    'Set RPC Url and private key for all or one chain',
                    'Add a custom chain to the current chain selection'
                ]
            }
        ])
        .then(async (settingSelected: { settings: string }) => {
            const ActivatedChainList = await buildActivatedChainList()
            const activatedChainList: string[] = []
            ActivatedChainList.map((chain: any) => {
                activatedChainList.push(chain.name)
            })
            const FullChainList = await buildFullChainList()
            const fullChainList: string[] = []
            FullChainList.map((chain: any) => {
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
                    .then(async (chainListSelected: any) => {
                        fullChainList.map(async (chain: any) => {
                            if (chainListSelected.chainList.includes(chain)) {
                                await addActivatedChain(chain)
                            } else {
                                await removeActivatedChain(chain)
                            }
                        })
                        console.log('\x1b[32m%s\x1b[0m', 'Settings updated!')
                    })
            }
            if (settingSelected.settings === 'Set RPC Url and private key for all or one chain') {
                await serveNetworkSelector(env, '', '', serveEnvBuilder, true)
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
                            name: 'chainName',
                            message: 'Chain Short-Name (used in the settings file)'
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
                    .then(async (chainSelected: { name: string; chainName: string; chainId: number; gas: string | number; defaultRpcUrl: string }) => {
                        chainSelected.chainName = chainSelected.chainName.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
                            return index === 0 ? match.toLowerCase() : match.toUpperCase()
                        })
                        await addCustomChain(chainSelected)
                    })
            }
        })
}

const serveExcludeFileSelector = async (option: string) => {
    let allFiles: any = []
    let excludedFiles: any = await buildExcludedFile()
    if (option === 'test') {
        allFiles = await buildAllTestsList()
    } else if (option === 'scripts') {
        allFiles = await buildAllScriptsList()
    }
    if (allFiles && allFiles.length > 0) {
        allFiles = allFiles
            .filter((test: any) => test.type === 'file')
            .map((file: any) => {
                return file.filePath
            })
    }
    if (excludedFiles && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: { directory: string; filePath: string }) => test.directory === option)
        if (excludedFiles && excludedFiles.length > 0) {
            excludedFiles = excludedFiles.map((file: any) => {
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
                choices: allFiles,
                default: excludedFiles
            }
        ])
        .then(async (activateFilesSelected: { allFiles: string[] }) => {
            allFiles.map(async (file: any) => {
                if (activateFilesSelected.allFiles.includes(file)) {
                    await addExcludedFiles(option, file)
                } else {
                    await removeExcludedFiles(option, file)
                }
            })
            console.log('\x1b[32m%s\x1b[0m', 'Settings updated!')
        })
}

const serveMoreSettingSelector = async () => {
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'moreSettings',
                message: 'Select a mock contract',
                choices: ['Exclude test file from the tests selection list', 'Exclude script file from the scripts selection list']
            }
        ])
        .then(async (moreSettingsSelected: { moreSettings: string }) => {
            if (moreSettingsSelected.moreSettings === 'Exclude test file from the tests selection list') {
                await serveExcludeFileSelector('test')
            }
            if (moreSettingsSelected.moreSettings === 'Exclude script file from the scripts selection list') {
                await serveExcludeFileSelector('scripts')
            }
        })
}

const serveMockContractCreatorSelector = async () => {
    if (MockContractsList) {
        const mockContractsList = MockContractsList.map((file) => {
            return file.name
        })
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
                await buildMockContract(mockContractSelected.mockContract)
            })
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

    await serveNetworkSelector(env, '', getAccountBalance, '', false)
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
    const buildMainOptions = [inquirerRunTests, inquirerRunScripts]
    const solidityCoverageDetected = await detectPackage('solidity-coverage', false)
    if (solidityCoverageDetected) buildMainOptions.push('Run coverage tests')
    buildMainOptions.push(
        'Setup chains, RPC and accounts',
        'More settings',
        new inquirer.Separator(),
        // 'Deploy all contracts and run tests',
        // 'Upgrade all contracts and run tests',
        // new inquirer.Separator(),
        inquirerRunMockContractCreator,
        'Create deployment scripts',
        'Get account balance',
        new inquirer.Separator(),
        inquirerFileContractsAddressDeployed,
        inquirerFileContractsAddressDeployedHistory
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
                await serveTestSelector(env, command)
            }
            if (answers.action === 'Run scripts') {
                await serveScriptSelector(env)
            }
            if (answers.action === 'Run coverage tests') {
                command = 'npx hardhat coverage'
                await serveTestSelector(env, command)
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

/**
 * CLI task implementation
 * @param  {HardhatUserArgs} args
 * @param  {HardhatEnv} env
 */
task('cli', 'Easy command line interface to use hardhat').setAction(async function (args, env) {
    await serveCli(env)
})
