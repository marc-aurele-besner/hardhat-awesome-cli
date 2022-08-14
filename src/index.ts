#!/usr/bin/env node

import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from 'hardhat/builtin-tasks/task-names'
import { extendConfig, extendEnvironment, subtask, task } from 'hardhat/config'
import { lazyObject } from 'hardhat/plugins'
import { HardhatConfig, HardhatUserConfig } from 'hardhat/types'
import path from 'path'

import { AwesomeAddressBook } from './AwesomeAddressBook'
import { buildActivatedChainNetworkConfig } from './buildNetworks'
import serveCli from './serveInquirer'
import './type-extensions'

extendConfig(async (config: HardhatConfig, userConfig: HardhatUserConfig) => {
    const userPath = userConfig.paths?.cli
    let cli: string
    if (userPath === undefined) cli = path.join(config.paths.root, 'cli')
    else {
        if (path.isAbsolute(userPath)) cli = userPath
        else cli = path.normalize(path.join(config.paths.root, userPath))
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
            if (buildNetworkConfig.networks[0].ethereum !== undefined)
                config.networks.ethereum = buildNetworkConfig.networks[0].ethereum
            if (buildNetworkConfig.networks[0].ropsten !== undefined)
                config.networks.ropsten = buildNetworkConfig.networks[0].ropsten
            if (buildNetworkConfig.networks[0].rinkeby !== undefined)
                config.networks.rinkeby = buildNetworkConfig.networks[0].rinkeby
            if (buildNetworkConfig.networks[0].kovan !== undefined)
                config.networks.kovan = buildNetworkConfig.networks[0].kovan
            if (buildNetworkConfig.networks[0].polygon !== undefined)
                config.networks.polygon = buildNetworkConfig.networks[0].polygon
            if (buildNetworkConfig.networks[0].mumbai !== undefined)
                config.networks.mumbai = buildNetworkConfig.networks[0].mumbai
            if (buildNetworkConfig.networks[0].optimism !== undefined)
                config.networks.optimism = buildNetworkConfig.networks[0].optimism
            if (buildNetworkConfig.networks[0].optimismTestnetKovan !== undefined)
                config.networks.optimismTestnetKovan = buildNetworkConfig.networks[0].optimismTestnetKovan
            // Custom networks
            if (buildNetworkConfig.networks[0].customChain1 !== undefined)
                config.networks.customChain1 = buildNetworkConfig.networks[0].customChain1
            if (buildNetworkConfig.networks[0].customChain2 !== undefined)
                config.networks.customChain2 = buildNetworkConfig.networks[0].customChain2
            if (buildNetworkConfig.networks[0].customChain3 !== undefined)
                config.networks.customChain3 = buildNetworkConfig.networks[0].customChain3
            if (buildNetworkConfig.networks[0].customChain4 !== undefined)
                config.networks.customChain4 = buildNetworkConfig.networks[0].customChain4
            if (buildNetworkConfig.networks[0].customChain5 !== undefined)
                config.networks.customChain5 = buildNetworkConfig.networks[0].customChain5
            if (buildNetworkConfig.networks[0].customChain6 !== undefined)
                config.networks.customChain6 = buildNetworkConfig.networks[0].customChain6
            if (buildNetworkConfig.networks[0].customChain7 !== undefined)
                config.networks.customChain7 = buildNetworkConfig.networks[0].customChain7
            if (buildNetworkConfig.networks[0].customChain8 !== undefined)
                config.networks.customChain8 = buildNetworkConfig.networks[0].customChain8
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
task('cli', 'Easy command line interface to use hardhat')
    .addOptionalParam('excludeTestFile', 'Exclude test file from the tests selection list', '')
    .addOptionalParam('excludeScriptFile', 'Exclude script file from the scripts selection list', '')
    .addOptionalParam('excludeContractFile', 'Exclude contract file from the contract selection list', '')
    .addOptionalParam('addHardhatPlugin', 'Add other Hardhat plugins', '')
    .addOptionalParam('removeHardhatPlugin', 'Remove other Hardhat plugins', '')
    .addOptionalParam('addGithubTestWorkflow', 'Create Github test workflows', '')
    .addOptionalParam('addFoundry', 'Create Foundry settings, remapping and test utilities', '')
    .addOptionalParam('addActivatedChain', 'Add chains from the chain selection', '')
    .addOptionalParam('removeActivatedChain', 'Remove chains from the chain selection', '')
    .addOptionalParam('getAccountBalance', 'Get account balance', '')
    .setAction(async function (args, env) {
        await serveCli(args, env)
    })

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(async (_, __, runSuper: any) => {
    const paths = await runSuper()
    return paths.filter((p: any) => !p.endsWith('.t.sol'))
})
