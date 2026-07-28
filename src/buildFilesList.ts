import fs from 'fs'

import { buildExcludedFile } from './buildExcludedFile.ts'
import { getAddressBookConfig } from './config.ts'
import type { IChain, IExcludedFiles, IFileList, IFileSetting } from './types.ts'

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

const formatFileName = (file: string, isTest: boolean) => {
    let fileName = file.replace(/\.[^/.]+$/, '')
    if (isTest) fileName = fileName.replace(/\.test/, ' - Test')
    const words = fileName.split(' ')
    for (let i = 0; i < words.length; i++) {
        if (words[i].length > 0) words[i] = words[i][0].toUpperCase() + words[i].substring(1)
    }
    return words.join(' ')
}

/**
 * List the direct content of `rootDirectory/subPath`.
 *
 * Directories are returned with a trailing `/` on both their display name and
 * their file path, and are flagged with the `directory` type so the selectors
 * can open a new selection inside of them instead of treating them as a file.
 * Directories are listed first, then files, both in alphabetical order.
 *
 * `filePath` is always relative to `rootDirectory`, so a nested file is
 * returned as `subDirectory/myFile.ts` and can be passed to a command as is.
 */
export const buildDirectoryFilesList = (rootDirectory: string, subPath: string = '', isTest: boolean = false) => {
    const filesList: IFileList[] = []
    const directoriesList: IFileList[] = []
    const currentDirectory = rootDirectory + (subPath ? '/' + subPath : '')
    if (!fs.existsSync(currentDirectory)) return filesList
    const files = fs.readdirSync(currentDirectory).sort((a, b) => a.localeCompare(b))
    files.forEach((file) => {
        const stat = fs.lstatSync(currentDirectory + '/' + file)
        if (stat.isDirectory()) {
            directoriesList.push({
                name: file + '/',
                type: 'directory',
                filePath: (subPath ? subPath + '/' : '') + file + '/'
            })
        } else {
            filesList.push({
                name: formatFileName(file, isTest),
                type: 'file',
                filePath: (subPath ? subPath + '/' : '') + file
            })
        }
    })
    return [...directoriesList, ...filesList]
}

/**
 * Recursively list every file found under `rootDirectory`, directories excluded.
 * Used where a flat list of all selectable files is needed (excluded files settings).
 */
export const buildDirectoryFilesListRecursive = (
    rootDirectory: string,
    subPath: string = '',
    isTest: boolean = false
) => {
    const filesList: IFileList[] = []
    buildDirectoryFilesList(rootDirectory, subPath, isTest).forEach((file: IFileList) => {
        if (file.type === 'directory')
            filesList.push(...buildDirectoryFilesListRecursive(rootDirectory, file.filePath.slice(0, -1), isTest))
        else filesList.push(file)
    })
    return filesList
}

export const buildAllTestsList = async (subPath: string = '') => {
    const testList: IFileList[] = []
    if (fs.existsSync('test')) {
        if (!subPath)
            testList.push({
                name: 'All tests',
                type: 'all',
                filePath: ''
            })
        testList.push(...buildDirectoryFilesList('test', subPath, true))
    }
    return testList
}

export const buildAllScriptsList = async (subPath: string = '') => {
    return buildDirectoryFilesList('scripts', subPath)
}

export const buildAllContractsList = async (subPath: string = '') => {
    return buildDirectoryFilesList('contracts', subPath)
}

export const buildAllForgeTestsList = async (subPath: string = '') => {
    const testList: IFileList[] = []
    if (fs.existsSync('contracts/test')) {
        if (!subPath)
            testList.push({
                name: 'All tests',
                type: 'all',
                filePath: ''
            })
        testList.push(...buildDirectoryFilesList('contracts/test', subPath, true))
    }
    return testList
}

const filterExcludedFiles = (allFiles: IFileList[], excludedFiles: IExcludedFiles[], directory: string) => {
    if (!excludedFiles || excludedFiles.length === 0) return allFiles
    const excludedFilePath = excludedFiles
        .filter((file: IExcludedFiles) => file.directory === directory)
        .map((file: IExcludedFiles) => file.filePath)
    if (excludedFilePath.length === 0) return allFiles
    return allFiles.filter((file: IFileList) => !excludedFilePath.includes(file.filePath))
}

export const buildTestsList = async (subPath: string = '') => {
    return filterExcludedFiles(await buildAllTestsList(subPath), await buildExcludedFile(), 'test')
}

export const buildScriptsList = async (subPath: string = '') => {
    return filterExcludedFiles(await buildAllScriptsList(subPath), await buildExcludedFile(), 'scripts')
}

export const buildContractsList = async (subPath: string = '') => {
    return filterExcludedFiles(await buildAllContractsList(subPath), await buildExcludedFile(), 'contracts')
}
