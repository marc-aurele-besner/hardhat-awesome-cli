import { assert, expect } from 'chai'

import { buildCommand, buildFinalCliCommand, displayFinalCliCommand } from '../src/utils.ts'
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

describe('Final CLI command builder', function () {
    it('builds a single-flag command with one value', function () {
        expect(buildFinalCliCommand('addHardhatPlugin', '@nomicfoundation/hardhat-ethers')).to.equal(
            'npx hardhat cli --addHardhatPlugin @nomicfoundation/hardhat-ethers'
        )
    })

    it('builds a single-flag command with multiple values', function () {
        expect(buildFinalCliCommand('addActivatedChain', ['ethereum', 'polygon'])).to.equal(
            'npx hardhat cli --addActivatedChain ethereum --addActivatedChain polygon'
        )
    })

    it('renders a boolean flag when no value is supplied', function () {
        const command = displayFinalCliCommand('addFoundry')
        expect(command).to.equal('npx hardhat cli --addFoundry')
    })

    it('renders a flag with a value when one is supplied', function () {
        const command = displayFinalCliCommand('addGithubTestWorkflow', 'hardhat-npm')
        expect(command).to.equal('npx hardhat cli --addGithubTestWorkflow hardhat-npm')
    })
})
