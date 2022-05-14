import { spawn } from 'child_process'
import fs from 'fs'
import { exit } from 'process'

import { fileContractsAddressDeployed, fileContractsAddressDeployedHistory } from './config'
import { IContractAddressDeployed, IInquirerListField } from './types'

let contractsAddressDeployed: IContractAddressDeployed[] = []
let contractsAddressDeployedHistory: IContractAddressDeployed[] = []

export const inquirerRunTests: IInquirerListField = { name: 'Run tests' }
if (!fs.existsSync('test')) inquirerRunTests.disabled = "We can't run tests without a test/ directory"
export const inquirerRunScripts: IInquirerListField = { name: 'Run scripts' }
if (!fs.existsSync('scripts')) inquirerRunScripts.disabled = "We can't run scripts without a scripts/ directory"
export const inquirerFlattenContracts: IInquirerListField = { name: 'Flatten contracts' }
export const inquirerRunMockContractCreator: IInquirerListField = { name: 'Create Mock contracts' }
export let inquirerRunFoundryTest: string = ''
if (!fs.existsSync('contracts')) {
    inquirerFlattenContracts.disabled = "We can't flatten contracts without a contracts/ directory"
    inquirerRunMockContractCreator.disabled = "We can't create Mock contracts without a contracts/ directory"
}
if (fs.existsSync('contracts/test') && fs.existsSync('foundry.toml')) {
    inquirerRunFoundryTest = 'Run Foundry Forge tests'
}
export let inquirerFileContractsAddressDeployed: IInquirerListField | string = {
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
export let inquirerFileContractsAddressDeployedHistory: IInquirerListField | string = {
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

export const runCommand = async (command: string, firstCommand: string, commandFlags: string) => {
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

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
