import { assert, expect } from 'chai'

import { usePathsEnvironment } from './helpers'

describe('Integration tests', function () {
    describe('Hardhat CLI task', function () {
        usePathsEnvironment('hardhat-cli')

        it('The task CLI is available', function () {
            const cliTask = this.env.tasks.getTask('cli')
            assert.equal(cliTask.id.join(':'), 'cli')
        })
    })

    describe('HardhatConfig extension', function () {
        usePathsEnvironment('hardhat-cli')

        it('The path CLI is injected in paths', function () {
            expect((this.env.config.paths as any).cli).to.not.equal(undefined)
        })
    })
})