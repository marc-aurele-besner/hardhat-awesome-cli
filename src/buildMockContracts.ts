import fs from 'fs'
import path from 'path'

import MockContractsList from './mockContracts'
import detectPackage from './packageInstaller'
import { IMockContractsList } from './types'
import { sleep } from './utils'

const buildMockContract = async (contractName: string) => {
    if (require && require.main) {
        const packageRootPath = path.join(
            path.dirname(require.main.filename),
            '../../../hardhat-awesome-cli/src/mockContracts'
        )
        if (fs.existsSync(packageRootPath)) {
            if (fs.existsSync('contracts')) {
                if (MockContractsList) {
                    const contractToMock: IMockContractsList[] = MockContractsList.filter(
                        (contract) => contract.name === contractName
                    )
                    if (contractToMock) {
                        if (fs.existsSync('contracts/' + contractName + '.sol'))
                            console.log('\x1b[33m%s\x1b[0m', 'Mock contract already exists')
                        else {
                            if (fs.existsSync('contracts/' + contractName + '.sol'))
                                console.log('\x1b[33m%s\x1b[0m', "Can't locate the mock contract")
                            else {
                                console.log('\x1b[32m%s\x1b[0m', 'Creating ', contractName, ' in contracts/')
                                fs.copyFileSync(
                                    packageRootPath + '/' + contractName + '.sol',
                                    'contracts/' + contractName + '.sol'
                                )
                            }
                        }
                        if (contractToMock[0].dependencies && contractToMock[0].dependencies.length > 0) {
                            contractToMock[0].dependencies.forEach(async (dependency: string) => {
                                await detectPackage(dependency, true, false, false)
                            })
                            await sleep(3000)
                        }
                    }
                }
            } else console.log('\x1b[33m%s\x1b[0m', 'Error creating mock contract')
        }
    }
}

export const buildMockDeploymentScriptOrTest = async (contractName: string, type: string) => {
    if (require && require.main) {
        const packageRootPath = path.join(
            path.dirname(require.main.filename),
            '../../../hardhat-awesome-cli/src/mockContracts'
        )
        if (fs.existsSync(packageRootPath)) {
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
                            console.log(
                                '\x1b[33m%s\x1b[0m',
                                'The ' + type + ' in ' + scriptOrTestDir + '/ already exists'
                            )
                        else {
                            if (fs.existsSync(deploymentScriptOrTestPath))
                                console.log('\x1b[33m%s\x1b[0m', "Can't locate the " + type + ' ' + scriptOrTestDir)
                            else {
                                console.log(
                                    '\x1b[32m%s\x1b[0m',
                                    'Creating ' + type + ' for ',
                                    contractName,
                                    ' in ' + scriptOrTestDir + '/'
                                )
                                if (!fs.existsSync(scriptOrTestDir + '/')) fs.mkdirSync(scriptOrTestDir + '/')
                                const rawData: any = fs.readFileSync(packageRootPath + '/' + deploymentScriptOrTestPath)
                                await sleep(500)
                                fs.writeFileSync(finalPath, rawData)
                            }
                        }
                    }
                }
            } else console.log('\x1b[33m%s\x1b[0m', 'Error creating ' + type + ' script')
        }
    }
}

export default buildMockContract
