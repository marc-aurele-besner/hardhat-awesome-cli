import fs from 'fs'
import path from 'path'

import { DefaultFoundryTestUtilsList } from './config.ts'
import detectPackage from './packageInstaller.ts'

// Name of the companion npm package providing shared Forge test utilities and
// mocks. See https://github.com/marc-aurele-besner/foundry-test-utility.
export const FOUNDRY_TEST_UTILITY_PACKAGE = 'foundry-test-utility'

/**
 * Remapping used by Foundry to locate the `foundry-test-utility` package when
 * it is installed via npm/yarn (vs. `forge install`, which lands under `libs/`).
 */
export const FOUNDRY_TEST_UTILITY_REMAPPING = `foundry-test-utility/contracts/=node_modules/${FOUNDRY_TEST_UTILITY_PACKAGE}/contracts`

/**
 * Append the npm-installed `foundry-test-utility` remapping to `remappings.txt`
 * if it isn't already there. `remappings.txt` is created by `buildFoundrySetting`
 * but the file may have been edited by hand, so we only append the new line.
 */
export const addFoundryTestUtilityRemapping = () => {
    const remappingsPath = 'remappings.txt'
    if (!fs.existsSync(remappingsPath)) return
    const currentRemappings = fs.readFileSync(remappingsPath, 'utf8')
    if (currentRemappings.includes(FOUNDRY_TEST_UTILITY_REMAPPING)) {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'The foundry-test-utility remapping already exists in remappings.txt'
        )
        return
    }
    const separator = currentRemappings.endsWith('\n') || currentRemappings.length === 0 ? '' : '\n'
    fs.appendFileSync(remappingsPath, separator + FOUNDRY_TEST_UTILITY_REMAPPING + '\n')
    console.log('\x1b[32m%s\x1b[0m', 'Adding foundry-test-utility remapping to remappings.txt')
}

/**
 * Install the `foundry-test-utility` npm package as a dev dependency and add
 * its remapping to `remappings.txt`. Safe to call repeatedly — the package
 * installer is a no-op when the package is already present, and the remapping
 * helper refuses to duplicate the line.
 */
export const installFoundryTestUtility = async () => {
    await detectPackage(FOUNDRY_TEST_UTILITY_PACKAGE, true, false, false)
    addFoundryTestUtilityRemapping()
}

const buildFoundrySetting = async () => {
    if (!fs.existsSync('foundry.toml')) {
        fs.writeFileSync(
            'foundry.toml',
            `[profile.default]
src = 'contracts/test'                                        # the source directory
test = 'contracts/test'                                       # the test directory
out = 'artifacts/contracts'                                   # the output directory (for artifacts)
libs = []                                                     # a list of library directories
remappings = []                                               # a list of remappings
libraries = []                                                # a list of deployed libraries to link against
cache = true                                                  # whether to cache builds or not
force = true                                                  # whether to ignore the cache (clean build)
evm_version = 'london'                                        # the evm version (by hardfork name)
auto_detect_solc = true                                       # enable auto-detection of the appropriate solc version to use
optimizer = true                                              # enable or disable the solc optimizer
optimizer_runs = 200                                          # the number of optimizer runs
verbosity = 2                                                 # the verbosity of tests
ignored_error_codes = []                                      # a list of ignored solc error codes
fuzz_runs = 256                                               # the number of fuzz runs for tests
ffi = false                                                   # whether to enable ffi or not
sender = '0x00a329c0648769a73afac7f9381e08fb43dbea72'         # the address of msg.sender in tests
tx_origin = '0x00a329c0648769a73afac7f9381e08fb43dbea72'      # the address of tx.origin in tests
initial_balance = '0xffffffffffffffffffffffff'                # the initial balance of the test contract
block_number = 0                                              # the block number we are at in tests
chain_id = 99                                                 # the chain id we are on in tests
gas_limit = 9223372036854775807                               # the gas limit in tests
gas_price = 0                                                 # the gas price (in wei) in tests
block_base_fee_per_gas = 0                                    # the base fee (in wei) in tests
block_coinbase = '0x0000000000000000000000000000000000000000' # the address of block.coinbase in tests
block_timestamp = 0                                           # the value of block.timestamp in tests
block_difficulty = 0                                          # the value of block.difficulty in tests`
        )
        console.log('\x1b[32m%s\x1b[0m', 'Creating Foundry settings in foundry.toml')
    } else console.log('\x1b[33m%s\x1b[0m', 'The Foundry settings already exists at foundry.toml')

    if (!fs.existsSync('remappings.txt')) {
        fs.writeFileSync(
            'remappings.txt',
            `hardhat/=node_modules/hardhat/
@openzeppelin/contracts/=node_modules/@openzeppelin/contracts
@openzeppelin/contracts-upgradeable/=node_modules/@openzeppelin/contracts-upgradeable`
        )
        console.log('\x1b[32m%s\x1b[0m', 'Creating Foundry settings in remappings.txt')
    } else console.log('\x1b[33m%s\x1b[0m', 'The Foundry settings already exists at remappings.txt')
    if (fs.existsSync('contracts')) {
        if (!fs.existsSync('contracts/test')) {
            fs.mkdirSync('contracts/test')
            if (!fs.existsSync('contracts/test/utils')) {
                fs.mkdirSync('contracts/test/utils')
            }
        } else {
            if (!fs.existsSync('contracts/test/utils')) {
                fs.mkdirSync('contracts/test/utils')
            }
        }
    } else {
        fs.mkdirSync('contracts')
        fs.mkdirSync('contracts/test')
        fs.mkdirSync('contracts/test/utils')
    }
    if (require && require.main) {
        const packageRootPath = path.join(
            path.dirname(require.main.filename),
            '../../../hardhat-awesome-cli/src/mockContracts'
        )
        if (fs.existsSync(packageRootPath)) {
            DefaultFoundryTestUtilsList.map((testUtils: string) => {
                if (!fs.existsSync('contracts/test/' + testUtils)) {
                    fs.copyFileSync(packageRootPath + '/testForge/' + testUtils, 'contracts/test/' + testUtils)
                    console.log('\x1b[32m%s\x1b[0m', 'Creating Foundry test utilities in contracts/test/' + testUtils)
                } else
                    console.log(
                        '\x1b[33m%s\x1b[0m',
                        'The Foundry test utilities already exists in contracts/test/' + testUtils
                    )
            })
        }
    }
    // Pull in the shared `foundry-test-utility` package (issue #88) so users
    // have access to the mock contracts / utilities shipped there in addition
    // to the bundled cheatcodes copied above.
    await installFoundryTestUtility()
}

export default buildFoundrySetting
