import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
    buildAllContractsList,
    buildAllTestsList,
    buildDirectoryFilesList,
    buildDirectoryFilesListRecursive,
    filterExcludedFiles
} from '../src/buildFilesList.ts'
import type { IExcludedFiles, IFileList } from '../src/types.ts'

describe('buildFilesList', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string

    before(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-'))
        fs.mkdirSync(path.join(fixtureDirectory, 'test/nested/deeper'), { recursive: true })
        fs.mkdirSync(path.join(fixtureDirectory, 'contracts/interfaces'), { recursive: true })
        fs.writeFileSync(path.join(fixtureDirectory, 'test/Token.test.ts'), '')
        fs.writeFileSync(path.join(fixtureDirectory, 'test/nested/Nested.test.ts'), '')
        fs.writeFileSync(path.join(fixtureDirectory, 'test/nested/deeper/Deeper.test.ts'), '')
        fs.writeFileSync(path.join(fixtureDirectory, 'contracts/Token.sol'), '')
        fs.writeFileSync(path.join(fixtureDirectory, 'contracts/interfaces/IToken.sol'), '')
        process.chdir(fixtureDirectory)
    })

    after(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
    })

    it('Mark directories with a trailing / and flag them as directory', async function () {
        const testList = await buildAllTestsList()
        const nested = testList.find((file: IFileList) => file.type === 'directory')
        expect(nested).to.not.equal(undefined)
        expect((nested as IFileList).name).to.equal('nested/')
        expect((nested as IFileList).filePath).to.equal('nested/')
    })

    it('List directories before files', async function () {
        const contractsList = await buildAllContractsList()
        expect(contractsList.map((file: IFileList) => file.type)).to.deep.equal(['directory', 'file'])
    })

    it('Only add the All tests entry at the root of the test directory', async function () {
        expect((await buildAllTestsList()).filter((file: IFileList) => file.type === 'all').length).to.equal(1)
        expect((await buildAllTestsList('nested')).filter((file: IFileList) => file.type === 'all').length).to.equal(0)
    })

    it('List the content of a sub directory with a path relative to the root directory', async function () {
        const nestedList = await buildAllTestsList('nested')
        expect(nestedList.map((file: IFileList) => file.filePath)).to.deep.equal([
            'nested/deeper/',
            'nested/Nested.test.ts'
        ])
        const deeperList = await buildAllTestsList('nested/deeper')
        expect(deeperList.map((file: IFileList) => file.filePath)).to.deep.equal(['nested/deeper/Deeper.test.ts'])
    })

    it('Format file names and keep the extension out of the display name', async function () {
        const testList = await buildAllTestsList()
        const file = testList.find((entry: IFileList) => entry.filePath === 'Token.test.ts')
        expect((file as IFileList).name).to.equal('Token - Test')
    })

    it('Return an empty list for a directory that does not exist', function () {
        expect(buildDirectoryFilesList('doesNotExist')).to.deep.equal([])
    })

    it('Recursively list every file, directories excluded', function () {
        const allFiles = buildDirectoryFilesListRecursive('test', '', true)
        expect(allFiles.map((file: IFileList) => file.filePath).sort()).to.deep.equal([
            'Token.test.ts',
            'nested/Nested.test.ts',
            'nested/deeper/Deeper.test.ts'
        ])
        expect(allFiles.every((file: IFileList) => file.type === 'file')).to.equal(true)
    })
})

describe('filterExcludedFiles', function () {
    const sampleList: IFileList[] = [
        { name: 'Token.test.ts', type: 'file', filePath: 'Token.test.ts' },
        { name: 'helpers/', type: 'directory', filePath: 'helpers/' },
        { name: 'Helper.test.ts', type: 'file', filePath: 'helpers/Helper.test.ts' },
        { name: 'deeper/', type: 'directory', filePath: 'helpers/deeper/' },
        { name: 'Deep.test.ts', type: 'file', filePath: 'helpers/deeper/Deep.test.ts' },
        { name: 'other/', type: 'directory', filePath: 'other/' },
        { name: 'Other.test.ts', type: 'file', filePath: 'other/Other.test.ts' }
    ]

    it('Returns the input unchanged when there are no exclusions', function () {
        expect(filterExcludedFiles(sampleList, [], 'test')).to.deep.equal(sampleList)
    })

    it('Returns the input unchanged when no exclusion targets this directory', function () {
        const excluded: IExcludedFiles[] = [{ directory: 'scripts', name: 'foo.js', filePath: 'foo.js', type: 'file' }]
        expect(filterExcludedFiles(sampleList, excluded, 'test')).to.deep.equal(sampleList)
    })

    it('Removes a single file entry that matches an excluded file path', function () {
        const excluded: IExcludedFiles[] = [
            { directory: 'test', name: 'Token.test.ts', filePath: 'Token.test.ts', type: 'file' }
        ]
        const filtered = filterExcludedFiles(sampleList, excluded, 'test')
        expect(filtered.map((file: IFileList) => file.filePath)).to.deep.equal([
            'helpers/',
            'helpers/Helper.test.ts',
            'helpers/deeper/',
            'helpers/deeper/Deep.test.ts',
            'other/',
            'other/Other.test.ts'
        ])
    })

    it('Removes every nested file under an excluded directory', function () {
        const excluded: IExcludedFiles[] = [
            { directory: 'test', name: 'helpers/', filePath: 'helpers/', type: 'directory' }
        ]
        const filtered = filterExcludedFiles(sampleList, excluded, 'test')
        expect(filtered.map((file: IFileList) => file.filePath)).to.deep.equal([
            'Token.test.ts',
            'other/',
            'other/Other.test.ts'
        ])
    })

    it('Hides a directory entry that itself is excluded as a directory', function () {
        const excluded: IExcludedFiles[] = [
            { directory: 'test', name: 'other/', filePath: 'other/', type: 'directory' }
        ]
        const filtered = filterExcludedFiles(sampleList, excluded, 'test')
        expect(filtered.map((file: IFileList) => file.filePath)).to.deep.equal([
            'Token.test.ts',
            'helpers/',
            'helpers/Helper.test.ts',
            'helpers/deeper/',
            'helpers/deeper/Deep.test.ts'
        ])
    })

    it('Treats legacy entries without a `type` field as file entries', function () {
        const excluded: IExcludedFiles[] = [{ directory: 'test', name: 'Token.test.ts', filePath: 'Token.test.ts' }]
        const filtered = filterExcludedFiles(sampleList, excluded, 'test')
        expect(filtered.map((file: IFileList) => file.filePath)).to.not.include('Token.test.ts')
    })

    it('Combines file and directory exclusions in one pass', function () {
        const excluded: IExcludedFiles[] = [
            { directory: 'test', name: 'Token.test.ts', filePath: 'Token.test.ts', type: 'file' },
            { directory: 'test', name: 'helpers/', filePath: 'helpers/', type: 'directory' }
        ]
        const filtered = filterExcludedFiles(sampleList, excluded, 'test')
        expect(filtered.map((file: IFileList) => file.filePath)).to.deep.equal(['other/', 'other/Other.test.ts'])
    })
})
