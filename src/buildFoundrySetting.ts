import fs from 'fs'
import path from 'path'

import { DefaultFoundryTestUtilsList } from './config'

const buildFoundrySetting = async () => {
    if (!fs.existsSync('foundry.toml')) {
        fs.writeFileSync(
            'foundry.toml',
            `
[default]
src = 'contracts/test'                                        # the source directory
test = 'contracts/test'                                       # the test directory
out = 'artifacts/contracts'                                   # the output directory (for artifacts)
libs = []                                                     # a list of library directories
remappings = []                                               # a list of remappings
libraries = []                                                # a list of deployed libraries to link against
cache = true                                                  # whether to cache builds or not
force = true                                                  # whether to ignore the cache (clean build)
evm_version = 'london'                                        # the evm version (by hardfork name)
#solc_version = '0.8.3'                                       # override for the solc version (setting this ignores auto_detect_solc)
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
            `
hardhat/=node_modules/hardhat/
@openzeppelin/contracts/=node_modules/@openzeppelin/contracts
@openzeppelin/contracts-upgradeable/=node_modules\@openzeppelin\contracts-upgradeable`
        )
        console.log('\x1b[32m%s\x1b[0m', 'Creating Foundry settings in remappings.txt')
    } else console.log('\x1b[33m%s\x1b[0m', 'The Foundry settings already exists at remappings.txt')
    if (fs.existsSync('contracts')) {
        if (!fs.existsSync('contracts/test')) {
            fs.mkdirSync('contracts/test')
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
        const packageRootPath = path.join(path.dirname(require.main.filename), '../../../hardhat-awesome-cli/src/mockContracts')
        if (fs.existsSync(packageRootPath)) {
            DefaultFoundryTestUtilsList.map((testUtils: string) => {
                if (!fs.existsSync('contracts/test/' + testUtils)) {
                    fs.copyFileSync(packageRootPath + '/testForge/' + testUtils, 'contracts/test/' + testUtils)
                }
            })
        }
    }
}

export default buildFoundrySetting
