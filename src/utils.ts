import { spawn } from 'child_process'
import fs from 'fs'
import { exit } from 'process'

import { getAddressBookConfig } from './config.ts'
import type { FunctionSelector, IContractAddressDeployed, IInquirerListField } from './types.ts'

let contractsAddressDeployed: IContractAddressDeployed[] = []
let contractsAddressDeployedHistory: IContractAddressDeployed[] = []

const addressBookConfig = getAddressBookConfig()

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
if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)) {
    const rawdata: any = fs.readFileSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployed)
    try {
        contractsAddressDeployed = JSON.parse(rawdata)
        inquirerFileContractsAddressDeployed = 'Get the previously deployed contracts address'
    } catch {}
}
export let inquirerFileContractsAddressDeployedHistory: IInquirerListField | string = {
    name: 'Get all the previously deployed contracts address',
    disabled: 'Please deploy the contracts first'
}
if (fs.existsSync(addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory)) {
    try {
        const rawdata: any = fs.readFileSync(
            addressBookConfig.savePath + addressBookConfig.fileContractsAddressDeployedHistory
        )
        contractsAddressDeployedHistory = JSON.parse(rawdata)
        inquirerFileContractsAddressDeployedHistory = 'Get all the previously deployed contracts address'
    } catch {}
}

export const buildCommand = (command: string, firstCommand: string, commandFlags: string) => {
    let commandToRun = command + commandFlags
    if (firstCommand) {
        commandToRun = firstCommand + commandFlags + ' && ' + commandToRun
    }
    return commandToRun
}

export const runCommand = async (
    command: string,
    firstCommand: string,
    commandFlags: string,
    thenExit: boolean = true
) => {
    const commandToRun = buildCommand(command, firstCommand, commandFlags)
    console.log('\x1b[33m%s\x1b[0m', 'Command to run: ', '\x1b[97m\x1b[0m', commandToRun)
    console.log(`Please wait...
`)
    const runSpawn = spawn(commandToRun, {
        stdio: 'inherit',
        shell: true
    })
    runSpawn.on('exit', (code) => {
        if (thenExit) exit()
    })
}

/**
 * List every public and external function of a compiled contract with its
 * 4 bytes function selector, sorted by selector (ascending).
 *
 * Requires `hre.ethers` (`@nomicfoundation/hardhat-ethers`) to be available,
 * and the contract to be compiled. Both ethers v6 (`fragment.selector`) and
 * ethers v5 (`ethers.utils.id(signature)`) are supported.
 *
 * @param hre Hardhat Runtime Environment
 * @param contractName Name of the contract to inspect (e.g. `MockERC20`)
 * @returns `{ name, selector }` for each function, ordered by selector
 */
export const listAllFunctionSelectors = async (hre: any, contractName: string) => {
    const factory = await hre.ethers.getContractFactory(contractName)

    const functions: FunctionSelector[] = []
    for (const fragment of factory.interface.fragments) {
        if (fragment.type !== 'function') continue
        // `sighash` is the canonical signature (`transfer(address,uint256)`)
        // in both ethers v5 and v6.
        const name = fragment.format('sighash')
        functions.push({
            name,
            // ethers v6 computes the selector on the fragment, ethers v5 does not.
            selector: fragment.selector ?? hre.ethers.utils.id(name).substring(0, 10)
        })
    }
    functions.sort((a, b) => {
        return a.selector.localeCompare(b.selector)
    })
    return functions
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
