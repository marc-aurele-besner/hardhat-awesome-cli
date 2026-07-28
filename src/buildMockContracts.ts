import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import MockContractsList from './mockContracts/index.ts'
import detectPackage from './packageInstaller.ts'
import { transformTsToJs } from './utils.ts'
import type { IMockContractsList } from './types.ts'

/**
 * Locate the packaged `mockContracts` directory holding the Solidity, deployment
 * script and test templates.
 *
 * Only the source tree carries those templates: `package.json` ships both `src/`
 * and `dist/`, but `tsc` merely compiles `.ts` files, it never copies the `.sol`
 * assets into `dist/`. So `dist/src/mockContracts` exists yet is incomplete,
 * which is why the candidates below are validated against a marker file instead
 * of a plain directory check.
 *
 * Hardhat 2 resolved this from `require.main.filename`; `require` does not exist
 * in an ES module, so we resolve relative to this file instead.
 */
const resolveMockContractsPath = (): string | undefined => {
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const candidates = [
        path.join(currentDir, 'mockContracts'), // running from src/
        path.join(currentDir, '../../src/mockContracts') // running from dist/src/
    ]
    return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'MockERC20.sol')))
}

const buildMockContract = async (contractName: string) => {
    const packageRootPath = resolveMockContractsPath()
    if (!packageRootPath) return

    // Ensure `contracts/` exists before writing any artifacts. `recursive: true`
    // makes this a no-op when the directory is already present, so projects that
    // already ship a `contracts/` folder are not touched (closes #168).
    fs.mkdirSync('contracts', { recursive: true })

    if (!MockContractsList) return

    const contractToMock: IMockContractsList[] = MockContractsList.filter(
        (contract) => contract.name === contractName
    )
    if (contractToMock.length === 0) return

    const contractFile = `contracts/${contractName}.sol`
    if (fs.existsSync(contractFile)) {
        console.log('\x1b[33m%s\x1b[0m', 'Mock contract already exists')
        return
    }

    console.log('\x1b[32m%s\x1b[0m', 'Creating ', contractName, ' in contracts/')
    fs.copyFileSync(path.join(packageRootPath, `${contractName}.sol`), contractFile)

    if (contractToMock[0].dependencies && contractToMock[0].dependencies.length > 0) {
        for (const dependency of contractToMock[0].dependencies) {
            // `detectPackage` now awaits the underlying `npm install`
            // itself, so there is no need for a fixed post-install sleep.
            await detectPackage(dependency, true, false, false)
        }
    }
}

/**
 * Pick the file extension that matches the consumer project's Hardhat config.
 *
 * Templates ship as TypeScript (the single source of truth, see #159). When
 * the consumer uses `hardhat.config.js` we still want to write a `.js` file,
 * so the JS variant is generated from the TS template at write time.
 */
const pickArtifactExtension = (): 'ts' | 'js' => {
    if (fs.existsSync('hardhat.config.ts')) return 'ts'
    if (fs.existsSync('hardhat.config.js')) return 'js'
    // No Hardhat config present — fall back to TS, which is the canonical
    // template language and what Hardhat 3 expects.
    return 'ts'
}

const swapExtension = (filePath: string, target: 'ts' | 'js' | 'sol'): string => {
    if (target === 'ts') return filePath.replace(/\.js$/, '.ts')
    if (target === 'sol') return filePath
    return filePath.replace(/\.ts$/, '.js')
}

export const buildMockDeploymentScriptOrTest = async (contractName: string, type: string) => {
    const packageRootPath = resolveMockContractsPath()
    if (!packageRootPath) return
    if (!MockContractsList) return

    let templatePath: string = ''
    let finalPath: string = ''
    let scriptOrTestDir: string = ''
    const contractToMock: IMockContractsList[] = MockContractsList.filter(
        (contract) => contract.name === contractName
    )
    if (contractToMock.length === 0) return

    if (type === 'deployment') {
        scriptOrTestDir = 'scripts'
        if (contractToMock[0].deploymentScript === undefined) return
        templatePath = contractToMock[0].deploymentScript
    } else if (type === 'test') {
        scriptOrTestDir = 'test'
        if (contractToMock[0].testScript === undefined) return
        templatePath = contractToMock[0].testScript
    } else if (type === 'testForge') {
        scriptOrTestDir = 'contracts/test'
        if (contractToMock[0]?.testContractFoundry === undefined) return
        templatePath = contractToMock[0].testContractFoundry
        finalPath = templatePath.replace('testForge/', 'contracts/test/')
    }

    if (!templatePath) return

    const targetExtension = pickArtifactExtension()
    // Foundry test contracts are Solidity (`.sol`) — never affected by the
    // TS/JS choice. Everything else follows the user's Hardhat config.
    const writeExtension: 'ts' | 'js' | 'sol' = type === 'testForge' ? 'sol' : targetExtension
    finalPath = swapExtension(finalPath || templatePath, writeExtension)

    // Ensure the destination directory exists before writing. `recursive: true`
    // is a no-op when the directory is already there, so this is safe to run
    // unconditionally — projects with an existing `scripts/`, `test/`, or
    // `contracts/test/` folder are left untouched (closes #168).
    fs.mkdirSync(scriptOrTestDir, { recursive: true })

    if (fs.existsSync(finalPath)) {
        console.log('\x1b[33m%s\x1b[0m', 'The ' + type + ' in ' + scriptOrTestDir + '/ already exists')
        return
    }

    console.log('\x1b[32m%s\x1b[0m', 'Creating ' + type + ' for ', contractName, ' in ' + scriptOrTestDir + '/')
    const rawData: string = fs.readFileSync(path.join(packageRootPath, templatePath), 'utf8')
    const rendered = writeExtension === 'js' ? transformTsToJs(rawData) : rawData
    fs.writeFileSync(finalPath, rendered)
}

export default buildMockContract
