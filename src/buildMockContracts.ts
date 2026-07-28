import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import MockContractsList from './mockContracts/index.ts'
import detectPackage from './packageInstaller.ts'
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

export const buildMockDeploymentScriptOrTest = async (contractName: string, type: string) => {
    const packageRootPath = resolveMockContractsPath()
    if (!packageRootPath) return
    if (!MockContractsList) return

    let deploymentScriptOrTestPath: string = ''
    let finalPath: string = ''
    let scriptOrTestDir: string = ''
    const contractToMock: IMockContractsList[] = MockContractsList.filter(
        (contract) => contract.name === contractName
    )
    if (contractToMock.length === 0) return

    if (type === 'deployment') {
        scriptOrTestDir = 'scripts'
        if (fs.existsSync('hardhat.config.js')) {
            if (contractToMock[0].deploymentScriptJs !== undefined)
                deploymentScriptOrTestPath = contractToMock[0].deploymentScriptJs
        } else if (fs.existsSync('hardhat.config.ts')) {
            if (contractToMock[0].deploymentScriptTs !== undefined)
                deploymentScriptOrTestPath = contractToMock[0].deploymentScriptTs
            else if (contractToMock[0].deploymentScriptJs !== undefined)
                deploymentScriptOrTestPath = contractToMock[0].deploymentScriptJs
        }
        finalPath = deploymentScriptOrTestPath
    } else if (type === 'test') {
        scriptOrTestDir = 'test'
        if (fs.existsSync('hardhat.config.js')) {
            if (contractToMock[0].testScriptJs !== undefined)
                deploymentScriptOrTestPath = contractToMock[0].testScriptJs
        } else if (fs.existsSync('hardhat.config.ts')) {
            if (contractToMock[0].testScriptTs !== undefined)
                deploymentScriptOrTestPath = contractToMock[0].testScriptTs
            else if (contractToMock[0].testScriptJs !== undefined)
                deploymentScriptOrTestPath = contractToMock[0].testScriptJs
        }
        finalPath = deploymentScriptOrTestPath
    } else if (type === 'testForge') {
        scriptOrTestDir = 'contracts/test'
        if (contractToMock[0]?.testContractFoundry !== undefined)
            deploymentScriptOrTestPath = contractToMock[0].testContractFoundry
        finalPath = deploymentScriptOrTestPath.replace('testForge/', 'contracts/test/')
    }

    if (!deploymentScriptOrTestPath || !finalPath) return

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
    const rawData: any = fs.readFileSync(path.join(packageRootPath, deploymentScriptOrTestPath))
    fs.writeFileSync(finalPath, rawData)
}

export default buildMockContract
