import fs from 'fs'

import { getEnvValue } from './buildEnv'
import { buildActivatedChainList } from './buildFilesList'
import { DefaultChainList, getAddressBookConfig } from './config'
import { IChain } from './types'

export const buildActivatedChainNetworkConfig = () => {
    let chainConfig: string = ''
    let fileSetting: any = []
    const addressBookConfig = getAddressBookConfig()
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
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

const addChain = async (chainName: string, chainToAdd: IChain) => {
    let fileSetting: any = []
    const addressBookConfig = getAddressBookConfig()
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
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
        } else fileSetting.activatedChain.push(chainToAdd)
    } else {
        fileSetting.push({
            activatedChain: [chainToAdd]
        })
    }
    try {
        fs.writeFileSync(addressBookConfig.fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
    } catch {
        console.log('\x1b[31m%s\x1b[0m', 'Error adding chain: ' + chainName + ' to your settings!')
    }
}

export const addActivatedChain = async (chainName: string) => {
    const FullChainList: IChain[] = DefaultChainList
    const chainToAdd: IChain | undefined = FullChainList.find((chain: IChain) => chain.name === chainName)
    if (chainToAdd !== undefined) await addChain(chainName, chainToAdd)
}

export const removeActivatedChain = async (chainName: string) => {
    const FullChainList: IChain[] = DefaultChainList
    const chainToRemove: IChain | undefined = FullChainList.find((chain: IChain) => chain.name === chainName)
    let fileSetting: any = []
    const addressBookConfig = getAddressBookConfig()
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI) && chainToRemove) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.activatedChain) {
            if (fileSetting.activatedChain.length > 0) {
                fileSetting.activatedChain
                    .filter((chain: IChain) => chain.chainName === chainToRemove.chainName)
                    .forEach((chain: IChain) => {
                        fileSetting.activatedChain.pop(chain)
                        fs.writeFileSync(addressBookConfig.fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
                    })
            }
        }
    }
}

export const addCustomChain = async (chainDetails: IChain) => {
    const FullChainList = DefaultChainList
    const ActivatedChainList = await buildActivatedChainList()
    // Verify if the chain already exists in regular full chain list
    if (FullChainList.find((chain: IChain) => chain.chainName === chainDetails.chainName))
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same Short-Name already exists in regular chain selection')
    else if (FullChainList.find((chain: IChain) => chain.chainId === chainDetails.chainId))
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same chainId already exists in regular chain selection')
    // Verify if the chain already exists in user setting activated chain list
    else if (ActivatedChainList.find((chain: IChain) => chain.chainName === chainDetails.chainName))
        console.log(
            '\x1b[33m%s\x1b[0m',
            'Chain with same Short-Name already exists in your settings activated chain list'
        )
    else if (ActivatedChainList.find((chain: IChain) => chain.chainId === chainDetails.chainId))
        console.log('\x1b[33m%s\x1b[0m', 'Chain with same chainId already exists in your settings activated chain list')
    else await addChain(chainDetails.chainName, chainDetails)
}
