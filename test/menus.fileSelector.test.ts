import { expect } from 'chai'
import inquirer from 'inquirer'

import { serveFileListSelector } from '../src/menus/fileSelector.ts'
import type { IFileList } from '../src/types.ts'

/**
 * Menu-level unit tests for the extracted file selector (issue #155).
 *
 * `serveFileListSelector` used to live inside the 1500-line
 * `serveInquirer.ts` where it was unreachable from a test. Now that it is
 * its own module we can drive it by stubbing `inquirer.prompt` and feeding
 * it a scripted sequence of answers, without a human at the terminal.
 */
describe('menus/fileSelector', function () {
    const originalPrompt = inquirer.prompt

    /**
     * Replace `inquirer.prompt` with a stub that answers each call with the
     * next entry in `answers` and records the choices it was shown, so the
     * assertions can check what the menu actually offered.
     */
    const stubPrompt = (answers: string[]) => {
        const seenChoices: string[][] = []
        let call = 0
        ;(inquirer as any).prompt = async (questions: any[]) => {
            seenChoices.push(questions[0].choices)
            const answer = answers[call]
            call += 1
            if (answer === undefined) throw new Error('inquirer.prompt was called more times than expected')
            return { file: answer }
        }
        return seenChoices
    }

    afterEach(function () {
        ;(inquirer as any).prompt = originalPrompt
    })

    const file = (name: string, filePath: string): IFileList => ({ name, type: 'file', filePath })
    const directory = (name: string, filePath: string): IFileList => ({ name, type: 'directory', filePath })

    it('Returns undefined without prompting when the root listing is empty', async function () {
        const seenChoices = stubPrompt([])
        const selected = await serveFileListSelector('Select a test', async () => [])
        expect(selected).to.equal(undefined)
        expect(seenChoices).to.deep.equal([])
    })

    it('Returns the selected file from a flat listing', async function () {
        stubPrompt(['example.test'])
        const selected = await serveFileListSelector('Select a test', async () => [
            file('example.test', 'example.test.ts')
        ])
        expect(selected).to.deep.equal(file('example.test', 'example.test.ts'))
    })

    it('Descends into a directory and returns the nested file with its full path', async function () {
        stubPrompt(['nested/', 'inner.test'])
        const selected = await serveFileListSelector('Select a test', async (subPath: string) =>
            subPath === 'nested' ? [file('inner.test', 'nested/inner.test.ts')] : [directory('nested/', 'nested/')]
        )
        expect(selected).to.deep.equal(file('inner.test', 'nested/inner.test.ts'))
    })

    it('Offers a go-back entry inside a directory but not at the root', async function () {
        const seenChoices = stubPrompt(['nested/', '.. (go back)', 'top.test'])
        const selected = await serveFileListSelector('Select a test', async (subPath: string) =>
            subPath === 'nested'
                ? [file('inner.test', 'nested/inner.test.ts')]
                : [directory('nested/', 'nested/'), file('top.test', 'top.test.ts')]
        )
        expect(selected).to.deep.equal(file('top.test', 'top.test.ts'))
        expect(seenChoices[0]).to.not.include('.. (go back)')
        expect(seenChoices[1]).to.include('.. (go back)')
    })

    it('Reopens the parent listing when the chosen directory turns out to be empty', async function () {
        const seenChoices = stubPrompt(['empty/', 'top.test'])
        const selected = await serveFileListSelector('Select a test', async (subPath: string) =>
            subPath === 'empty' ? [] : [directory('empty/', 'empty/'), file('top.test', 'top.test.ts')]
        )
        expect(selected).to.deep.equal(file('top.test', 'top.test.ts'))
        // The empty directory never prompts, so the second prompt is the
        // re-rendered root listing rather than a nested one.
        expect(seenChoices).to.have.lengthOf(2)
    })
})
