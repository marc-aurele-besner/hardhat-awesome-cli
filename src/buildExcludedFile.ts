import fs from 'fs'

import { buildAllScriptsList, buildAllTestsList } from './buildFilesList'
import { getAddressBookConfig } from './config'
import { IExcludedFiles, IFileList } from './types'

export const buildExcludedFile = async () => {
    let fileSetting: any = []
    const addressBookConfig = getAddressBookConfig()
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.excludedFiles && fileSetting.excludedFiles.length > 0)
            return fileSetting.excludedFiles
    }
    return []
}

export const addExcludedFiles = async (directory: string, name: string, filePath: string) => {
    let fileSetting: any = []
    const addressBookConfig = getAddressBookConfig()
    const fileToAdd = {
        directory,
        name,
        filePath
    }
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
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
                !fileSetting.excludedFiles.find(
                    (file: { directory: string; name: string; filePath: string }) =>
                        file.directory === directory && file.filePath === filePath
                )
            )
                fileSetting.excludedFiles.push(fileToAdd)
        } else fileSetting.excludedFiles.push(fileToAdd)
    } else {
        fileSetting.push({
            excludedFiles: [fileToAdd]
        })
    }
    try {
        fs.writeFileSync(addressBookConfig.fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
    } catch {
        console.log(
            '\x1b[31m%s\x1b[0m',
            'Error adding file: ' + directory + '/' + filePath + ' to your excluded files settings!'
        )
    }
}

export const removeExcludedFiles = async (directory: string, filePath: string) => {
    let allFiles: any = []
    const addressBookConfig = getAddressBookConfig()
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
    const fileToRemove = allFiles.find(
        (file: IExcludedFiles) => file.directory === directory && file.filePath === filePath
    )
    let fileSetting: any = []
    if (fs.existsSync(addressBookConfig.fileHardhatAwesomeCLI)) {
        const rawdata: any = fs.readFileSync(addressBookConfig.fileHardhatAwesomeCLI)
        fileSetting = JSON.parse(rawdata)
        if (fileSetting && fileSetting.excludedFiles) {
            if (fileSetting.excludedFiles.length > 0) {
                fileSetting.excludedFiles
                    .filter((file: IExcludedFiles) => file.directory === directory && file.filePath === filePath)
                    .forEach(() => {
                        fileSetting.excludedFiles.pop(fileToRemove)
                        fs.writeFileSync(addressBookConfig.fileHardhatAwesomeCLI, JSON.stringify(fileSetting, null, 2))
                    })
            }
        }
    }
}
