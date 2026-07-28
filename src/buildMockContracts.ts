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
    if (packageRootPath) {
        if (fs.existsSync('contracts')) {
            if (MockContractsList) {
                const contractToMock: IMockContractsList[] = MockContractsList.filter(
                    (contract) => contract.name === contractName
                )
                if (contractToMock) {
                    if (fs.existsSync('contracts/' + contractName + '.sol'))
                        console.log('\x1b[33m%s\x1b[0m', 'Mock contract already exists')
                    else {
                        console.log('\x1b[32m%s\x1b[0m', 'Creating ', contractName, ' in contracts/')
                        fs.copyFileSync(
                            packageRootPath + '/' + contractName + '.sol',
                            'contracts/' + contractName + '.sol'
                        )
                    }
                    if (contractToMock[0].dependencies && contractToMock[0].dependencies.length > 0) {
                        for (const dependency of contractToMock[0].dependencies) {
                            // `detectPackage` now awaits the underlying `npm install`
                            // itself, so there is no need for a fixed post-install sleep.
                            await detectPackage(dependency, true, false, false)
                        }
                    }
                }
            }
        } else console.log('\x1b[33m%s\x1b[0m', 'Error creating mock contract')
    }
}

export const buildMockDeploymentScriptOrTest = async (contractName: string, type: string) => {
    const packageRootPath = resolveMockContractsPath()
    if (packageRootPath) {
        if (fs.existsSync('contracts')) {
            if (MockContractsList) {
                let deploymentScriptOrTestPath: string = ''
                let finalPath: string = ''
                let scriptOrTestDir: string = ''
                const contractToMock: IMockContractsList[] = MockContractsList.filter(
                    (contract) => contract.name === contractName
                )
                if (contractToMock && type === 'deployment') {
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
                }
                if (contractToMock && type === 'test') {
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
                }
                if (contractToMock && type === 'testForge') {
                    scriptOrTestDir = 'contracts/test'
                    if (contractToMock[0]?.testContractFoundry !== undefined)
                        deploymentScriptOrTestPath = contractToMock[0].testContractFoundry
                    finalPath = deploymentScriptOrTestPath.replace('testForge/', 'contracts/test/')
                }
                if (contractToMock && deploymentScriptOrTestPath && finalPath) {
                    if (fs.existsSync(finalPath))
                        console.log('\x1b[33m%s\x1b[0m', 'The ' + type + ' in ' + scriptOrTestDir + '/ already exists')
                    else {
                        console.log(
                            '\x1b[32m%s\x1b[0m',
                            'Creating ' + type + ' for ',
                            contractName,
                            ' in ' + scriptOrTestDir + '/'
                        )
                        if (!fs.existsSync(scriptOrTestDir + '/'))
                            fs.mkdirSync(scriptOrTestDir + '/', { recursive: true })
                        const rawData: any = fs.readFileSync(packageRootPath + '/' + deploymentScriptOrTestPath)
                        fs.writeFileSync(finalPath, rawData)
                    }
                }
            }
        } else console.log('\x1b[33m%s\x1b[0m', 'Error creating ' + type + ' script')
    }
}

export default buildMockContract
