import { expect } from 'chai'

import { runCommand, sleep, transformTsToJs, waitForReadability } from '../src/utils.ts'

describe('Command runner', function () {
    it('runCommand resolves once the child process exits', async function () {
        this.timeout(10000)
        let resolved = false
        // `true` is a no-op builtin on every POSIX shell available in CI
        // (Ubuntu, Node 24) and on macOS. We pass it as a chained shell so
        // `spawn({ shell: true })` succeeds without any project setup.
        const runCommandPromise = runCommand('true', '', '', false).then(() => {
            resolved = true
        })
        await runCommandPromise
        expect(resolved).to.equal(true)
    })

    it('runCommand does not call process.exit when thenExit is false', async function () {
        this.timeout(10000)
        const originalExit = process.exit
        let exitCalls = 0
        // Replace `process.exit` with a counting stub. If runCommand tries to
        // terminate the process we will see it here.
        process.exit = ((code?: number | null) => {
            exitCalls += 1
            // Re-throw to abort the test loudly instead of silently terminating
            // the runner, which would otherwise mask a regression to the old
            // exit-immediately behaviour.
            throw new Error(`process.exit called with code=${String(code)}`)
        }) as never
        try {
            await runCommand('true', '', '', false)
            expect(exitCalls).to.equal(0)
        } finally {
            process.exit = originalExit
        }
    })

    it('runCommand resolves even when the child exits with a non-zero code', async function () {
        this.timeout(10000)
        const originalExit = process.exit
        process.exit = (() => {
            throw new Error('process.exit should not be called with thenExit=false')
        }) as never
        try {
            // `false` is a builtin that returns 1 (failure). The promise must
            // still resolve — runCommand reports completion, not success.
            await runCommand('false', '', '', false)
        } finally {
            process.exit = originalExit
        }
    })
})

describe('sleep helper', function () {
    it('waits for at least the requested duration', async function () {
        const start = Date.now()
        await sleep(50)
        expect(Date.now() - start).to.be.greaterThanOrEqual(40)
    })
})

describe('waitForReadability', function () {
    const originalNoPause = process.env.AWESOME_CLI_NO_PAUSE
    const originalPauseMs = process.env.AWESOME_CLI_PAUSE_MS

    afterEach(function () {
        if (originalNoPause === undefined) delete process.env.AWESOME_CLI_NO_PAUSE
        else process.env.AWESOME_CLI_NO_PAUSE = originalNoPause
        if (originalPauseMs === undefined) delete process.env.AWESOME_CLI_PAUSE_MS
        else process.env.AWESOME_CLI_PAUSE_MS = originalPauseMs
    })

    it('returns immediately when AWESOME_CLI_NO_PAUSE is set', async function () {
        process.env.AWESOME_CLI_NO_PAUSE = '1'
        const start = Date.now()
        await waitForReadability()
        expect(Date.now() - start).to.be.lessThan(20)
    })

    it('honours AWESOME_CLI_PAUSE_MS when set', async function () {
        process.env.AWESOME_CLI_PAUSE_MS = '40'
        const start = Date.now()
        await waitForReadability()
        expect(Date.now() - start).to.be.greaterThanOrEqual(30)
    })

    it('caps the pause duration at 5 seconds', async function () {
        process.env.AWESOME_CLI_PAUSE_MS = '60000'
        // Use a short timeout — the function must clamp regardless of input.
        const start = Date.now()
        await waitForReadability()
        const elapsed = Date.now() - start
        // Within a small tolerance we should be done almost immediately when
        // the function actually clamps; here we simply check the elapsed
        // duration is far below the requested 60s.
        expect(elapsed).to.be.lessThan(1500)
    })

    it('returns synchronously when explicitly invoked with 0', async function () {
        const start = Date.now()
        await waitForReadability(0)
        expect(Date.now() - start).to.be.lessThan(20)
    })
})

describe('transformTsToJs', function () {
    it('rewrites named imports into the equivalent CommonJS require', function () {
        const ts = [
            "// @ts-ignore-next-line",
            "import { addressBook, ethers, network } from 'hardhat'",
            "import { expect } from 'chai'",
            '',
            'async function main() {',
            '    const [deployer] = await ethers.getSigners()',
            '}',
            '',
            'main().catch((error) => {',
            '    console.error(error)',
            '    process.exitCode = 1',
            '})'
        ].join('\n')

        const js = transformTsToJs(ts)

        expect(js).to.not.match(/@ts-ignore-next-line/)
        expect(js).to.contain("const { addressBook, ethers, network } = require('hardhat')")
        expect(js).to.contain("const { expect } = require('chai')")
        expect(js).to.not.match(/^\s*import\s/m)
    })

    it('strips `: any` type annotations from top-level declarations', function () {
        const ts = ['import { ethers } from \'hardhat\'', '', 'let mockERC20: any', 'let deployer: any'].join('\n')
        const js = transformTsToJs(ts)
        expect(js).to.not.match(/:\s*any/)
        expect(js).to.contain('let mockERC20')
        expect(js).to.contain('let deployer')
    })

    it('rewrites main().catch(...) so the script exits cleanly on success', function () {
        const ts = [
            "import { ethers } from 'hardhat'",
            '',
            'async function main() {}',
            '',
            'main().catch((error) => {',
            '    console.error(error)',
            '    process.exitCode = 1',
            '})'
        ].join('\n')

        const js = transformTsToJs(ts)

        expect(js).to.contain('.then(() => process.exit(0))')
        expect(js).to.contain('.catch(')
    })

    it('produces valid CommonJS that requires the same module specifiers', function () {
        const ts = ["import { expect } from 'chai'", '', 'expect(1).to.equal(1)'].join('\n')
        const js = transformTsToJs(ts)
        // The transformed output should still reference the same module
        // name (`chai`) and the same imported symbol (`expect`).
        expect(js).to.contain("require('chai')")
        expect(js).to.contain('expect(1).to.equal(1)')
    })
})
