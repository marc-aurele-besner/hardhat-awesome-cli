import { assert, expect } from 'chai'

import { buildCommand } from '../src/utils.ts'
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

describe('Command builder', function () {
    it('builds a command with flags', function () {
        expect(buildCommand('npx hardhat test test/example.ts', '', ' --network sepolia')).to.equal(
            'npx hardhat test test/example.ts --network sepolia'
        )
    })

    it('builds a chained command with flags on both commands', function () {
        expect(buildCommand('npm run deploy', 'npm install', ' --network sepolia')).to.equal(
            'npm install --network sepolia && npm run deploy --network sepolia'
        )
    })
})
