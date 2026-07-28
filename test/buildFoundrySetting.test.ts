import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
    FOUNDRY_TEST_UTILITY_REMAPPING,
    addFoundryTestUtilityRemapping
} from '../src/buildFoundrySetting.ts'

describe('buildFoundrySetting', function () {
    describe('addFoundryTestUtilityRemapping', function () {
        const initialCwd = process.cwd()
        let fixtureDirectory: string

        beforeEach(function () {
            fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-foundry-'))
            process.chdir(fixtureDirectory)
        })

        afterEach(function () {
            process.chdir(initialCwd)
            fs.rmSync(fixtureDirectory, { recursive: true, force: true })
        })

        it('appends the remapping when remappings.txt exists', function () {
            fs.writeFileSync('remappings.txt', 'hardhat/=node_modules/hardhat/\n')

            addFoundryTestUtilityRemapping()

            const contents = fs.readFileSync('remappings.txt', 'utf8')
            expect(contents).to.include(FOUNDRY_TEST_UTILITY_REMAPPING)
        })

        it('does nothing when remappings.txt is missing', function () {
            // Should silently bail without creating remappings.txt
            addFoundryTestUtilityRemapping()
            expect(fs.existsSync('remappings.txt')).to.equal(false)
        })

        it('does not duplicate the remapping when it already exists', function () {
            const original = `hardhat/=node_modules/hardhat/\n${FOUNDRY_TEST_UTILITY_REMAPPING}\n`
            fs.writeFileSync('remappings.txt', original)

            addFoundryTestUtilityRemapping()

            const contents = fs.readFileSync('remappings.txt', 'utf8')
            const matches = contents.match(new RegExp(FOUNDRY_TEST_UTILITY_REMAPPING.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
            expect(matches?.length).to.equal(1)
        })

        it('adds a leading newline when remappings.txt does not end with one', function () {
            fs.writeFileSync('remappings.txt', 'hardhat/=node_modules/hardhat/')

            addFoundryTestUtilityRemapping()

            const contents = fs.readFileSync('remappings.txt', 'utf8')
            expect(contents).to.equal(`hardhat/=node_modules/hardhat/\n${FOUNDRY_TEST_UTILITY_REMAPPING}\n`)
        })
    })
})