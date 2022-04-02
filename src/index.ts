#!/usr/bin/env node

import chalk from 'chalk'
import { exec, execSync, spawn, spawnSync } from 'child_process'
import fs from 'fs'
import { TASK_TEST_RUN_MOCHA_TESTS } from 'hardhat/builtin-tasks/task-names'
import { subtask, task } from 'hardhat/config'
import inquirer from 'inquirer'
import path from 'path'
import { exit } from 'process'
import MockContractsList from './mockContracts'

const fileHardhatAwesomeCLI = 'hardhat-awesome-cli.json'
const fileContractsAddressDeployed = 'contractsAddressDeployed.json'
const fileContractsAddressDeployedHistory = 'contractsAddressDeployedHistory.json'
let contractsAddressDeployed = []
let contractsAddressDeployedHistory = []

let inquirerRunTests: any = {
    name: 'Run tests',
    disabled: 'We can\'t run tests without a test/ directory'
}
if (fs.existsSync('test')) {
    inquirerRunTests = 'Run tests'
}
let inquirerRunScripts: any = {
    name: 'Run scripts',
    disabled: 'We can\'t run scripts without a scripts/ directory'
}
if (fs.existsSync('scripts')) {
    inquirerRunScripts = 'Run scripts'
}
let inquirerRunMockContractCreator: any = {
    name: 'Create Mock contracts',
    disabled: 'We can\'t create Mock contracts without a contracts/ directory'
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const runCommand = async (command: string, commandFlags: string) => {
    console.log(chalk.yellow('Command to run: '), command + commandFlags)
    console.log(`Please wait...
`)
    const runSpawn = spawn(command + commandFlags, {
        stdio: 'inherit',
        shell: true
    })
    // runSpawn.on('close', (code) => {
    //     exit()
    // });
    runSpawn.on('exit', (code) => {
        exit()
    });
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
            gas: 'auto'
        },
        {
            name: 'Polygon - Mumbai',
            chainName: 'mumbai',
            chainId: 80001,
            gas: 'auto'
        },
    ]
    return chainList
}

const buildActivatedChainList = async () => {
    const FullChainList = await buildFullChainList()
    let chainList = FullChainList.filter(chain => chain.chainName === 'hardhat')
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
    }
    if(fileSetting && fileSetting.activatedChain) {
        if(fileSetting.activatedChain.length > 0) {
            fileSetting.activatedChain.forEach((chain: any) => {
                chainList.push(chain)
            })
        }
    }
    return chainList
}

const buildTestsList = async () => {
    const testList = []
    if (fs.existsSync('test')) {
        testList.push({
            name: 'All tests',
            type: 'all'
        })
        const files = fs.readdirSync('test')
        files.map((file) => {
            let fileName = file.replace(/\.[^/.]+$/, "").replace(/\.test/, " - Test")
            const words = fileName.split(" ");
            for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].substr(1);
            }
            fileName = words.join(" ");
            testList.push({
                name: fileName,
                type: 'file',
                filePath: file
            })
        })
    }
    return testList
}

const buildScriptsList = async () => {
    const testList = []
    if (fs.existsSync('scripts')) {
        const files = fs.readdirSync('scripts')
        files.map((file) => {
            let fileName = file.replace(/\.[^/.]+$/, "").replace(/\.test/, " - Test")
            const words = fileName.split(" ");
            for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].substr(1);
            }
            fileName = words.join(" ");
            testList.push({
                name: fileName,
                type: 'file',
                filePath: file
            })
        })
    }
    return testList
}

const buildMockContract = async (contractName) => {
    let packageRootPath = path.join(path.dirname(require.main.filename), '../../../hardhat-easy-cli/src/mockContracts');
    if (fs.existsSync('scripts')) {
        if (fs.existsSync('contracts')) {
            if(MockContractsList) {
                if(MockContractsList.find(contract => contract.name === contractName)) {
                    if(fs.existsSync('contracts/' + contractName + '.sol')) {
                        console.log(chalk.yellow('Mock contract already exists'))
                    } else {
                        if(fs.existsSync('contracts/' + contractName + '.sol')) {
                            console.log(chalk.yellow('Can\'t locate the mock contract'))
                        } else {
                            console.log(chalk.green('Creating '), contractName, ' in contracts/')
                            fs.copyFileSync(packageRootPath + '/' + contractName + '.sol', 'contracts/' + contractName + '.sol')
                        }
                    }
                }
            }
        }
    }
}

const addActivatedChain = async (chainName) => {
    const FullChainList = await buildFullChainList()
    const chainToAdd = FullChainList.find(chain => chain.chainName === chainName)
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if(fileSetting && !fileSetting.activatedChain) {
            fileSetting = {
                activatedChain: []
            }
        }
    } else {
        fileSetting = {
            activatedChain: []
        }
    }
    if(fileSetting && fileSetting.activatedChain) {
        if(fileSetting.activatedChain.length > 0) {
            if(!fileSetting.activatedChain.find(chain => chain.chainName === chainName)) {
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
    } catch (error) {
        console.log(chalk.red('Error adding chain: ' + chainName + ' to your settings!'))
        console.log(chalk.red(error))
    }
}

const removeActivatedChain = async (chainName) => {
    const FullChainList = await buildFullChainList()
    const chainToRemove = FullChainList.find(chain => chain.chainName === chainName)
    let fileSetting: any = []
    if (fs.existsSync(fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if(fileSetting && fileSetting.activatedChain) {
            if(fileSetting.activatedChain.length > 0) {
                fileSetting.activatedChain.filter(chain => chain.chainName === chainName).forEach((chain: any) => {
                    fileSetting.activatedChain.pop(chainToRemove)
                    fs.writeFileSync(fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
                })
            }
        }
    }
}

const serveNetworkSelector = async (env: any, command: string, getAccountBalance: any) => {
    const ActivatedChainList = await buildActivatedChainList()
    const activatedChainList: string[] = []
    ActivatedChainList.map((chain: any) => {
        activatedChainList.push(chain.name)
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
        .then(async (networkSelected) => {
            ActivatedChainList.map((chain: any) => {
                if (chain.name === networkSelected.network) {
                    commandFlags = ' --network ' + chain.chainName
                }
            })
            if(command) {
                await runCommand(command, commandFlags)
            } else if(run) {
                getAccountBalance(env)
            }
            await sleep(5000)
        })
}

const serveTestSelector = async (env, command: string) => {
    const testFilesObject = await buildTestsList()
    const testFilesList = testFilesObject.map((file) => {
        return file.name
    })
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'test',
                message: 'Select a test',
                choices: testFilesList
            }
        ])
        .then(async (testSelected) => {
            testFilesObject.forEach((file) => {
                if (file.name === testSelected.test) {
                    if (file.type === 'file') {
                        command = command + ' test/' + file.filePath
                    }
                }
            })
            await serveNetworkSelector(env, command, '')
            await sleep(5000)
        })
}

const serveScriptSelector = async (env) => {
    const scriptFilesObject = await buildScriptsList()
    const scriptFilesList = scriptFilesObject.map((file) => {
        return file.name
    })
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'script',
                message: 'Select a script',
                choices: scriptFilesList
            }
        ])
        .then(async (scriptSelected) => {
            let command = 'npx hardhat run'
            scriptFilesObject.forEach((file) => {
                if (file.name === scriptSelected.script) {
                    if (file.type === 'file') {
                        command = command + ' scripts/' + file.filePath
                    }
                }
            })
            await serveNetworkSelector(env, command, '')
            await sleep(5000)
        })
}

const serveSettingSelector = async () => {
    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'settings',
                message: 'Select a setting',
                choices: [
                    'Chain selection',
                    'Setup RPC Url and private key',
                    'Add a chain to the current chain selection',
                    'Remove a chain from the current chain selection'
                ]
            }
        ])
        .then(async (settingSelected) => {
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
            if(settingSelected.settings === 'Chain selection') {
                const fullChainList = await buildFullChainList()
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
                    .then(async (settingSelected) => {
                        FullChainList.map(async (chain: any) => {
                            if (settingSelected.chainList.includes(chain.name)) {
                                await addActivatedChain(chain.chainName)
                            } else {
                                await removeActivatedChain(chain.chainName)
                            }
                        })
                        console.log(chalk.green('Settings updated!'))
                    })
            }
        })
}

const serveMoreSettingSelector = async () => {

}

const serveMockContractCreatorSelector = async () => {
    if(MockContractsList) {
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
            .then(async (mockContractSelected) => {
                await buildMockContract(mockContractSelected.mockContract)
            })
    }
}

const serveDeploymentContractCreatorSelector = async () => {

}

const serveAccountBalance = async (env) => {
    const getAccountBalance = async (env) => {
        const [deployer] = await env.ethers.getSigners();
        const network = await env.network;
    
        // Get account balance
        const balance = await deployer.getBalance();
        console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
        console.log('\x1b[32m%s\x1b[0m', 'Account address: ', deployer.address);
        console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', balance.toString());
    }

    await serveNetworkSelector(env, '', getAccountBalance)
}


const serveCli = async (env) => {
    console.log(
        `
`,
        chalk.blue('Welcome to'),
        chalk.green(`
d88888b  .d8b.  .d8888. db    db     .o88b. db      d888888b 
88'     d8' '8b 88'  YP '8b  d8'    d8P  Y8 88        '88'   
88ooooo 88ooo88 '8bo.    '8bd8'     8P      88         88    
88~~~~~ 88~~~88   'Y8b.    88       8b      88         88    
88.     88   88 db   8D    88       Y8b  d8 88booo.   .88.   
Y88888P YP   YP '8888Y'    YP        'Y88P' Y88888P Y888888P
`)
    )

    await inquirer
        .prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What do you want to do?',
                choices: [
                    inquirerRunTests,
                    inquirerRunScripts,
                    'Setup chains, RPC and accounts',
                    'More settings',
                    new inquirer.Separator(),
                    // 'Deploy all contracts and run tests',
                    // 'Upgrade all contracts and run tests',
                    new inquirer.Separator(),
                    inquirerRunMockContractCreator,
                    'Create deployment scripts',
                    'Get account balance',
                    new inquirer.Separator(),
                    inquirerFileContractsAddressDeployed,
                    inquirerFileContractsAddressDeployedHistory
                ]
            }
        ])
        .then(async (answers) => {
            let command = ''

            if (answers.action === 'Run tests') {
                command = 'npx hardhat test'
                await serveTestSelector(env, command)
            }
            if (answers.action === 'Run scripts') {
                await serveScriptSelector(env)
            }
            if (answers.action === 'Setup chains, RPC and accounts') {
                await serveSettingSelector()
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

// subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(async (args: any, hre, runSuper) => {
//     const result = await runSuper()
//     return result
// })

/**
 * CLI task implementation
 * @param  {HardhatUserArgs} args
 * @param  {HardhatEnv} env
 */
task('cli', 'Easy command line interface to use hardhat').setAction(async function (args, env) {
    await serveCli(env)
})
