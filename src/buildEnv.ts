import fs from 'fs'

import { fileEnvHardhatAwesomeCLI } from './config'

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

export const getEnvValue = (envName: string) => {
    if (fs.existsSync(fileEnvHardhatAwesomeCLI)) {
        const allEnv = require('dotenv').config({ path: fileEnvHardhatAwesomeCLI })
        const oldEnv = Object.entries(allEnv.parsed)
        for (const [key, value] of oldEnv) {
            if (key && value && key === envName) return getEnvValue
        }
    }
    return ''
}

const writeToEnv = async (env: any, chainName: string, envToBuild: { rpcUrl: string; privateKeyOrMnemonic: any }) => {
    let isRpcUrl = false
    let isPrivateKey = false
    let isMnemonic = false
    const rpcUrlEnv = 'rpcUrl'.toUpperCase() + '_' + chainName.toUpperCase() + ' = ' + '"' + envToBuild.rpcUrl + '"'
    const privateKeyEnv =
        'privateKey'.toUpperCase() + '_' + chainName.toUpperCase() + ' = ' + '"' + envToBuild.privateKeyOrMnemonic + '"'
    const mnemonicEnv =
        'mnemonic'.toUpperCase() + '_' + chainName.toUpperCase() + ' = ' + '"' + envToBuild.privateKeyOrMnemonic + '"'
    if (envToBuild.rpcUrl) isRpcUrl = true
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
                } else if (
                    key &&
                    value &&
                    isPrivateKey &&
                    key === 'privateKey'.toUpperCase() + '_' + chainName.toUpperCase()
                ) {
                    newEnv += key + ' = "' + envToBuild.privateKeyOrMnemonic + '"\n'
                    isPrivateKeyEnvExist = true
                } else if (
                    key &&
                    value &&
                    isMnemonic &&
                    key === 'mnemonic'.toUpperCase() + '_' + chainName.toUpperCase()
                ) {
                    newEnv += key + ' = "' + envToBuild.privateKeyOrMnemonic + '"\n'
                    isMnemoniclEnvExist = true
                } else newEnv += key + ' = "' + value + '"\n'
            }
        }
        if (isRpcUrl && !isRpcUrlEnvExist) newEnv += rpcUrlEnv + '\n'
        if (isPrivateKey && !isPrivateKeyEnvExist) newEnv += privateKeyEnv + '\n'
        if (isMnemonic && !isMnemoniclEnvExist) newEnv += mnemonicEnv + '\n'
        fs.writeFileSync(fileEnvHardhatAwesomeCLI, newEnv)
    } else fs.writeFileSync(fileEnvHardhatAwesomeCLI, envToWrite)
    console.log('\x1b[32m%s\x1b[0m', 'Env file updated')
    await addEnvFileInGitiignore('.gitignore', fileEnvHardhatAwesomeCLI, true)
    await addEnvFileInGitiignore('.npmignore', fileEnvHardhatAwesomeCLI, false)
}

export default writeToEnv
