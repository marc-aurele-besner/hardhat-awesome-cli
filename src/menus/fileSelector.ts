import inquirer from 'inquirer'

import type { IFileList } from '../types.ts'
import type { FileSelectionAnswer } from './types.ts'

export const goBackChoice = '.. (go back)'

export type TFileSelection = IFileList | 'back' | undefined

/**
 * Prompt for a file, opening a new selection every time a directory is selected.
 *
 * Directories are listed with a trailing `/` and are browsed recursively until a
 * file (or an entry like `All tests`) is picked. Nested selections offer a
 * `.. (go back)` choice to return to the parent directory.
 *
 * Resolves to the selected file, its `filePath` being relative to the root
 * directory of the list (eg. `subDirectory/myTest.test.ts`), or `undefined`
 * when there is nothing to select.
 */
export const serveFileListSelector = async (
    message: string,
    buildList: (subPath: string) => Promise<IFileList[]>,
    subPath: string = ''
): Promise<TFileSelection> => {
    for (;;) {
        const filesObject = await buildList(subPath)
        const filesList: string[] = filesObject ? filesObject.map((file: IFileList) => file.name) : []
        if (filesList.length === 0) {
            if (!subPath) return undefined
            console.log('\x1b[33m%s\x1b[0m', 'No file found in ' + subPath + ', going back')
            return 'back'
        }
        if (subPath) filesList.push(goBackChoice)
        const fileSelected: FileSelectionAnswer = await inquirer.prompt<FileSelectionAnswer>([
            {
                type: 'list',
                name: 'file',
                message: subPath ? message + ' (' + subPath + ')' : message,
                choices: filesList
            }
        ])
        if (fileSelected.file === goBackChoice) return 'back'
        const selected = filesObject.find((file: IFileList) => file.name === fileSelected.file)
        if (!selected) return undefined
        if (selected.type !== 'directory') return selected
        const selectedInDirectory = await serveFileListSelector(message, buildList, selected.filePath.slice(0, -1))
        if (selectedInDirectory !== 'back') return selectedInDirectory
    }
}
