import { expect } from 'chai'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { DefaultHardhatPluginsList, LegacyHardhatPluginsList } from '../src/config.ts'
import {
    addPluginToHardhat3Config,
    findHardhatConfigFilePath,
    hardhatPluginImportName,
    isHardhat3Config,
    removePluginFromHardhat3Config
} from '../src/packageInstaller.ts'
import type { IHardhatPluginAvailableList } from '../src/types.ts'

const HARDHAT_3_CONFIG = `import { defineConfig } from 'hardhat/config'
import hardhatAwesomeCli from 'hardhat-awesome-cli/plugin'

export default defineConfig({
    plugins: [hardhatAwesomeCli],
    solidity: '0.8.28'
})
`

const HARDHAT_3_CONFIG_MULTILINE = `import { defineConfig } from 'hardhat/config'
import hardhatAwesomeCli from 'hardhat-awesome-cli/plugin'

export default defineConfig({
    plugins: [
        hardhatAwesomeCli
    ]
})
`

const HARDHAT_2_CONFIG = `require('hardhat-awesome-cli')

module.exports = {
    solidity: '0.8.28'
}
`

describe('packageInstaller', function () {
    describe('hardhatPluginImportName', function () {
        it('camel cases the package name and strips the scope', function () {
            expect(hardhatPluginImportName('@nomicfoundation/hardhat-ethers')).to.equal('hardhatEthers')
            expect(hardhatPluginImportName('@nomicfoundation/hardhat-toolbox-mocha-ethers')).to.equal(
                'hardhatToolboxMochaEthers'
            )
            expect(hardhatPluginImportName('hardhat-gas-reporter')).to.equal('hardhatGasReporter')
        })

        it('never produces an identifier starting with a digit', function () {
            expect(hardhatPluginImportName('3rd-party-plugin')).to.equal('plugin3rdPartyPlugin')
        })
    })

    describe('isHardhat3Config', function () {
        it('detects a defineConfig based config', function () {
            expect(isHardhat3Config(HARDHAT_3_CONFIG)).to.equal(true)
        })

        it('does not flag a Hardhat 2 module.exports config', function () {
            expect(isHardhat3Config(HARDHAT_2_CONFIG)).to.equal(false)
        })
    })

    describe('addPluginToHardhat3Config', function () {
        it('imports the plugin default export and appends it to the plugins array', function () {
            const updated = addPluginToHardhat3Config(HARDHAT_3_CONFIG, '@nomicfoundation/hardhat-ethers')

            expect(updated).to.include(`import hardhatEthers from '@nomicfoundation/hardhat-ethers'`)
            expect(updated).to.include('plugins: [hardhatAwesomeCli, hardhatEthers]')
            // The rest of the config is untouched
            expect(updated).to.include(`solidity: '0.8.28'`)
        })

        it('preserves a multi line plugins array layout', function () {
            const updated = addPluginToHardhat3Config(HARDHAT_3_CONFIG_MULTILINE, '@nomicfoundation/hardhat-verify')

            expect(updated).to.include('plugins: [\n        hardhatAwesomeCli,\n        hardhatVerify\n    ]')
        })

        it('fills an empty plugins array', function () {
            const source = `import { defineConfig } from 'hardhat/config'\n\nexport default defineConfig({\n    plugins: []\n})\n`

            const updated = addPluginToHardhat3Config(source, '@nomicfoundation/hardhat-keystore')

            expect(updated).to.include('plugins: [hardhatKeystore]')
            expect(updated).to.include(`import hardhatKeystore from '@nomicfoundation/hardhat-keystore'`)
        })

        it('is a no-op when the plugin is already registered', function () {
            const once = addPluginToHardhat3Config(HARDHAT_3_CONFIG, '@nomicfoundation/hardhat-ethers') as string

            expect(addPluginToHardhat3Config(once, '@nomicfoundation/hardhat-ethers')).to.equal(once)
        })

        it('returns undefined instead of corrupting a config without a plugins array', function () {
            const source = `import { defineConfig } from 'hardhat/config'\n\nexport default defineConfig({\n    solidity: '0.8.28'\n})\n`

            expect(addPluginToHardhat3Config(source, '@nomicfoundation/hardhat-ethers')).to.equal(undefined)
        })

        it('keeps entries that are function calls in one piece', function () {
            const source = `import { defineConfig } from 'hardhat/config'\nimport somePlugin from 'some-plugin'\n\nexport default defineConfig({\n    plugins: [somePlugin({ a: 1, b: 2 })]\n})\n`

            const updated = addPluginToHardhat3Config(source, '@nomicfoundation/hardhat-viem')

            expect(updated).to.include('plugins: [somePlugin({ a: 1, b: 2 }), hardhatViem]')
        })
    })

    describe('removePluginFromHardhat3Config', function () {
        it('removes both the plugins array entry and the import statement', function () {
            const withPlugin = addPluginToHardhat3Config(HARDHAT_3_CONFIG, '@nomicfoundation/hardhat-ethers') as string

            const removed = removePluginFromHardhat3Config(withPlugin, '@nomicfoundation/hardhat-ethers')

            expect(removed).to.equal(HARDHAT_3_CONFIG)
        })

        it('leaves the config untouched when the plugin is not registered', function () {
            expect(removePluginFromHardhat3Config(HARDHAT_3_CONFIG, '@nomicfoundation/hardhat-verify')).to.equal(
                HARDHAT_3_CONFIG
            )
        })

        it('empties the plugins array when the last plugin is removed', function () {
            const source = `import { defineConfig } from 'hardhat/config'\nimport hardhatViem from '@nomicfoundation/hardhat-viem'\n\nexport default defineConfig({\n    plugins: [hardhatViem]\n})\n`

            const removed = removePluginFromHardhat3Config(source, '@nomicfoundation/hardhat-viem')

            expect(removed).to.include('plugins: []')
            expect(removed).to.not.include('@nomicfoundation/hardhat-viem')
        })
    })

    describe('findHardhatConfigFilePath', function () {
        const initialCwd = process.cwd()
        let fixtureDirectory: string

        beforeEach(function () {
            fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-installer-'))
            process.chdir(fixtureDirectory)
        })

        afterEach(function () {
            process.chdir(initialCwd)
            fs.rmSync(fixtureDirectory, { recursive: true, force: true })
        })

        it('prefers the TypeScript config', function () {
            fs.writeFileSync('hardhat.config.ts', HARDHAT_3_CONFIG)
            fs.writeFileSync('hardhat.config.js', HARDHAT_2_CONFIG)

            expect(findHardhatConfigFilePath()).to.equal('hardhat.config.ts')
        })

        it('returns an empty string when no config exists', function () {
            expect(findHardhatConfigFilePath()).to.equal('')
        })

        it('produces a syntactically valid config for every plugin offered', function () {
            for (const plugin of DefaultHardhatPluginsList) {
                const updated = addPluginToHardhat3Config(HARDHAT_3_CONFIG, plugin.name) as string
                const configPath = path.join(fixtureDirectory, 'generated.mjs')
                fs.writeFileSync(configPath, updated)

                // `node --check` parses the module without executing it, so an
                // invalid splice (broken import, dangling comma, ...) fails here.
                expect(() => execFileSync(process.execPath, ['--check', configPath]), plugin.name).to.not.throw()
            }
        })
    })

    describe('DefaultHardhatPluginsList', function () {
        it('only offers Hardhat 3 compatible plugins', function () {
            for (const plugin of DefaultHardhatPluginsList) {
                expect(plugin.hardhat2Only, `${plugin.name} should not be flagged Hardhat 2 only`).to.not.equal(true)
                expect(plugin.name, `${plugin.name} is a Hardhat 2 era package`).to.not.match(/^@nomiclabs\//)
            }
        })

        it('does not overlap with the legacy list', function () {
            const legacyNames = LegacyHardhatPluginsList.map((plugin: IHardhatPluginAvailableList) => plugin.name)

            for (const plugin of DefaultHardhatPluginsList) expect(legacyNames).to.not.include(plugin.name)
        })

        it('maps every plugin to a unique config import identifier', function () {
            const importNames = DefaultHardhatPluginsList.map((plugin: IHardhatPluginAvailableList) =>
                hardhatPluginImportName(plugin.name)
            )

            expect(new Set(importNames).size).to.equal(importNames.length)
        })

        it('flags every legacy plugin as Hardhat 2 only', function () {
            for (const plugin of LegacyHardhatPluginsList) expect(plugin.hardhat2Only).to.equal(true)
        })
    })
})
