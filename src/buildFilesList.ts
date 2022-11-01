import fs from 'fs'

import { buildExcludedFile } from './buildExcludedFile'
import { getAddressBookConfig } from './config'
import { IChain, IExcludedFiles, IFileList, IFileSetting } from './types'

export const buildActivatedChainList = async () => {
    const chainList: IChain[] = []
    let fileSetting: IFileSetting = {}
    const addressBookConfig = getAddressBookConfig()
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
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

export const buildAllTestsList = async () => {
    const testList: IFileList[] = []
    if (fs.existsSync('test')) {
        testList.push({
            name: 'All tests',
            type: 'all',
            filePath: ''
        })
        const files = fs.readdirSync('test')
        files.map((file) => {
            let fileName
            if (fs.lstatSync('test/' + file).isFile()) {
                fileName = file.replace(/\.[^/.]+$/, '').replace(/\.test/, ' - Test')
            } else if (fs.lstatSync('test/' + file).isDirectory()) {
                fileName = file + '/'
                file = file + '/'
            } else {
                fileName = file
            }
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

export const buildAllScriptsList = async () => {
    const scriptsList: IFileList[] = []
    if (fs.existsSync('scripts')) {
        const files = fs.readdirSync('scripts')
        files.map((file) => {
            let fileName
            if (fs.lstatSync('scripts/' + file).isFile()) {
                fileName = file.replace(/\.[^/.]+$/, '').replace(/\.test/, ' - Test')
            } else if (fs.lstatSync('scripts/' + file).isDirectory()) {
                fileName = file + '/'
                file = file + '/'
            } else {
                fileName = file
            }
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

export const buildAllContractsList = async () => {
    const scontractsList: IFileList[] = []
    if (fs.existsSync('contracts')) {
        const files = fs.readdirSync('contracts')
        files.map((file) => {
            let fileName
            if (fs.lstatSync('contracts/' + file).isFile()) {
                fileName = file.replace(/\.[^/.]+$/, '')
            } else if (fs.lstatSync('contracts/' + file).isDirectory()) {
                fileName = file + '/'
                file = file + '/'
            } else {
                fileName = file
            }
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

export const buildAllForgeTestsList = async () => {
    const testList: IFileList[] = []
    if (fs.existsSync('test')) {
        testList.push({
            name: 'All tests',
            type: 'all',
            filePath: ''
        })
        const files = fs.readdirSync('contracts/test')
        files.map((file) => {
            let fileName
            if (fs.lstatSync('contracts/test/' + file).isFile()) {
                fileName = file.replace(/\.[^/.]+$/, '').replace(/\.test/, ' - Test')
            } else if (fs.lstatSync('contracts/test/' + file).isDirectory()) {
                fileName = file + '/'
            } else {
                fileName = file
            }
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

export const buildTestsList = async () => {
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
        } else return allTestList
    } else return allTestList
}

export const buildScriptsList = async () => {
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
        } else return allScriptList
    } else return allScriptList
}

export const buildContractsList = async () => {
    let allContractsList: IFileList[] = await buildAllContractsList()
    let excludedFiles: IExcludedFiles[] = await buildExcludedFile()
    const buildFilePath: string[] = []
    if (excludedFiles !== undefined && excludedFiles.length > 0) {
        excludedFiles = excludedFiles.filter((test: any) => test.directory === 'contracts')
        if (excludedFiles !== undefined && excludedFiles.length > 0) {
            excludedFiles.map((file: any) => {
                buildFilePath.push(file.filePath)
            })
            allContractsList = allContractsList.filter((script: IFileList) => {
                return !buildFilePath.includes(script.filePath)
            })
            return allContractsList
        } else return allContractsList
    } else return allContractsList
}
