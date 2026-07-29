import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
    PACKAGE_MANAGER_COMMANDS,
    detectPackageManager,
    getPackageManagerCommands,
    lockfileDetectionLabel
} from '../src/packageManager.ts'

describe('packageManager', function () {
    describe('detectPackageManager', function () {
        const initialCwd = process.cwd()
        let fixtureDirectory: string

        beforeEach(function () {
            fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-pm-'))
            process.chdir(fixtureDirectory)
        })

        afterEach(function () {
            process.chdir(initialCwd)
            fs.rmSync(fixtureDirectory, { recursive: true, force: true })
        })

        it('returns npm when only package-lock.json is present', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'package-lock.json'), '{}')

            expect(detectPackageManager()).to.equal('npm')
        })

        it('returns yarn when only yarn.lock is present', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'yarn.lock'), '')

            expect(detectPackageManager()).to.equal('yarn')
        })

        it('returns pnpm when only pnpm-lock.yaml is present', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'pnpm-lock.yaml'), '')

            expect(detectPackageManager()).to.equal('pnpm')
        })

        it('returns bun when bun.lock is present', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'bun.lock'), '')

            expect(detectPackageManager()).to.equal('bun')
        })

        it('returns bun when the binary bun.lockb is present', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'bun.lockb'), Buffer.from([]))

            expect(detectPackageManager()).to.equal('bun')
        })

        it('prefers pnpm over yarn / npm when both lockfiles are present', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'pnpm-lock.yaml'), '')
            fs.writeFileSync(path.join(fixtureDirectory, 'yarn.lock'), '')
            fs.writeFileSync(path.join(fixtureDirectory, 'package-lock.json'), '{}')

            expect(detectPackageManager()).to.equal('pnpm')
        })

        it('prefers bun over yarn / npm when both lockfiles are present', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'bun.lock'), '')
            fs.writeFileSync(path.join(fixtureDirectory, 'yarn.lock'), '')
            fs.writeFileSync(path.join(fixtureDirectory, 'package-lock.json'), '{}')

            expect(detectPackageManager()).to.equal('bun')
        })

        it('falls back to npm when no recognised lockfile is present', function () {
            expect(detectPackageManager()).to.equal('npm')
        })

        it('accepts an explicit directory and ignores the live cwd', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'yarn.lock'), '')
            const otherDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-pm-other-'))
            try {
                fs.writeFileSync(path.join(otherDirectory, 'pnpm-lock.yaml'), '')
                expect(detectPackageManager(otherDirectory)).to.equal('pnpm')
                expect(detectPackageManager(fixtureDirectory)).to.equal('yarn')
            } finally {
                fs.rmSync(otherDirectory, { recursive: true, force: true })
            }
        })
    })

    describe('PACKAGE_MANAGER_COMMANDS', function () {
        it('uses --save-dev for npm and -D for yarn / pnpm / bun', function () {
            expect(PACKAGE_MANAGER_COMMANDS.npm.installDev('foo')).to.equal('npm install foo --save-dev')
            expect(PACKAGE_MANAGER_COMMANDS.yarn.installDev('foo')).to.equal('yarn add foo -D')
            expect(PACKAGE_MANAGER_COMMANDS.pnpm.installDev('foo')).to.equal('pnpm add -D foo')
            expect(PACKAGE_MANAGER_COMMANDS.bun.installDev('foo')).to.equal('bun add -d foo')
        })

        it('uses an fpm-compatible frozen install for every manager', function () {
            for (const commands of Object.values(PACKAGE_MANAGER_COMMANDS)) {
                expect(commands.installFrozen, 'frozen install must be defined').to.be.a('string')
                expect(commands.installFrozen.length).to.be.greaterThan(0)
            }
        })

        it('quotes the remove command without any save flag', function () {
            expect(PACKAGE_MANAGER_COMMANDS.npm.remove('foo')).to.equal('npm remove foo')
            expect(PACKAGE_MANAGER_COMMANDS.yarn.remove('foo')).to.equal('yarn remove foo')
            expect(PACKAGE_MANAGER_COMMANDS.pnpm.remove('foo')).to.equal('pnpm remove foo')
            expect(PACKAGE_MANAGER_COMMANDS.bun.remove('foo')).to.equal('bun remove foo')
        })
    })

    describe('getPackageManagerCommands', function () {
        const initialCwd = process.cwd()
        let fixtureDirectory: string

        beforeEach(function () {
            fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-awesome-cli-pm-'))
            process.chdir(fixtureDirectory)
        })

        afterEach(function () {
            process.chdir(initialCwd)
            fs.rmSync(fixtureDirectory, { recursive: true, force: true })
        })

        it('returns a matching command bundle for a pnpm project', function () {
            fs.writeFileSync(path.join(fixtureDirectory, 'pnpm-lock.yaml'), '')

            const result = getPackageManagerCommands()

            expect(result.manager).to.equal('pnpm')
            expect(result.commands.installDev('foo')).to.equal('pnpm add -D foo')
        })
    })

    describe('lockfileDetectionLabel', function () {
        it('uses the lockfile name that triggered the detection', function () {
            expect(lockfileDetectionLabel('npm')).to.equal('Detected package-lock.json, installing with npm')
            expect(lockfileDetectionLabel('yarn')).to.equal('Detected yarn.lock, installing with yarn')
            expect(lockfileDetectionLabel('pnpm')).to.equal('Detected pnpm-lock.yaml, installing with pnpm')
            expect(lockfileDetectionLabel('bun')).to.equal('Detected bun.lock, installing with bun')
        })
    })
})
