import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { addExcludedFiles, buildExcludedFile, removeExcludedFiles } from '../src/buildExcludedFile.ts'
import type { IExcludedFiles } from '../src/types.ts'

describe('buildExcludedFile', function () {
    const initialCwd = process.cwd()
    let fixtureDirectory: string
    let settingsFile: string

    beforeEach(function () {
        fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-excluded-'))
        settingsFile = path.join(fixtureDirectory, 'hardhat-awesome-cli.json')
        process.chdir(fixtureDirectory)
    })

    afterEach(function () {
        process.chdir(initialCwd)
        fs.rmSync(fixtureDirectory, { recursive: true, force: true })
    })

    it('Returns an empty list when no settings file exists', async function () {
        expect(await buildExcludedFile()).to.deep.equal([])
    })

    it('Records a file exclusion with type "file" by default', async function () {
        await addExcludedFiles('test', 'Token.test.ts', 'Token.test.ts')
        const excluded = await buildExcludedFile()
        expect(excluded).to.deep.equal([
            {
                directory: 'test',
                name: 'Token.test.ts',
                filePath: 'Token.test.ts',
                type: 'file'
            }
        ])
    })

    it('Records a directory exclusion with type "directory" when requested', async function () {
        await addExcludedFiles('test', 'helpers/', 'helpers/', 'directory')
        const excluded = await buildExcludedFile()
        expect(excluded).to.deep.equal([
            {
                directory: 'test',
                name: 'helpers/',
                filePath: 'helpers/',
                type: 'directory'
            }
        ])
    })

    it('Defaults legacy file entries without a type field to "file"', async function () {
        // Older CLI versions did not write a `type` field. The loader must
        // treat those as file entries so the menu still picks them up.
        fs.writeFileSync(
            settingsFile,
            JSON.stringify({
                excludedFiles: [{ directory: 'test', name: 'Legacy.test.ts', filePath: 'Legacy.test.ts' }]
            })
        )
        const excluded = await buildExcludedFile()
        expect((excluded[0] as IExcludedFiles).type).to.equal('file')
    })

    it('Preserves a directory type when other legacy file entries are also present', async function () {
        fs.writeFileSync(
            settingsFile,
            JSON.stringify({
                excludedFiles: [
                    { directory: 'test', name: 'Legacy.test.ts', filePath: 'Legacy.test.ts' },
                    { directory: 'test', name: 'helpers/', filePath: 'helpers/', type: 'directory' }
                ]
            })
        )
        const excluded = await buildExcludedFile()
        expect(excluded).to.have.lengthOf(2)
        expect((excluded[0] as IExcludedFiles).type).to.equal('file')
        expect((excluded[1] as IExcludedFiles).type).to.equal('directory')
    })

    it('Does not duplicate an entry that already exists', async function () {
        await addExcludedFiles('test', 'Token.test.ts', 'Token.test.ts')
        await addExcludedFiles('test', 'Token.test.ts', 'Token.test.ts')
        const excluded = await buildExcludedFile()
        expect(excluded).to.have.lengthOf(1)
    })

    it('Removes a directory entry by directory+filePath', async function () {
        await addExcludedFiles('test', 'helpers/', 'helpers/', 'directory')
        await addExcludedFiles('test', 'Token.test.ts', 'Token.test.ts')
        await removeExcludedFiles('test', 'helpers/')
        const excluded = await buildExcludedFile()
        expect(excluded).to.have.lengthOf(1)
        expect((excluded[0] as IExcludedFiles).filePath).to.equal('Token.test.ts')
    })
})
