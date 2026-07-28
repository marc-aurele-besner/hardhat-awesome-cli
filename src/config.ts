import type { IChain, IDefaultGithubWorkflowsList, IHardhatPluginAvailableList } from './types.ts'

export const fileHardhatAwesomeCLI = 'hardhat-awesome-cli.json'
export const fileEnvHardhatAwesomeCLI = '.env.hardhat-awesome-cli'

export const DefaultChainList: IChain[] = [
    {
        name: 'Hardhat (Temporary instance)',
        chainName: 'hardhat',
        chainId: 31337,
        gas: 'auto',
        currency: 'ETH'
    },
    {
        name: 'Hardhat (Localhost node)',
        chainName: 'localhost',
        chainId: 31337,
        gas: 'auto',
        currency: 'ETH'
    },
    {
        name: 'Ethereum - Mainnet',
        chainName: 'ethereum',
        chainId: 1,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://etherscan.io/'
    },
    {
        name: 'Ethereum - Sepolia',
        chainName: 'ethereumSepolia',
        chainId: 11155111,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://sepolia.etherscan.io/'
    },
    {
        name: 'Ethereum - Holesky',
        chainName: 'holesky',
        chainId: 17000,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://holesky.etherscan.io/'
    },
    {
        name: 'Polygon - Mainnet',
        chainName: 'polygon',
        chainId: 137,
        gas: 'auto',
        currency: 'POL',
        defaultRpcUrl: 'https://polygon-rpc.com',
        defaultBlockExplorer: 'https://polygonscan.com/'
    },
    {
        name: 'Polygon - Amoy',
        chainName: 'polygonAmoy',
        chainId: 80002,
        gas: 'auto',
        currency: 'POL',
        defaultBlockExplorer: 'https://amoy.polygonscan.com/'
    },
    {
        name: 'BNB Smart Chain - Mainnet',
        chainName: 'binance',
        chainId: 56,
        gas: 'auto',
        currency: 'BNB',
        defaultRpcUrl: 'https://bsc-dataseed.binance.org',
        defaultBlockExplorer: 'https://bscscan.com'
    },
    {
        name: 'BNB Smart Chain - Testnet',
        chainName: 'binanceTestnet',
        chainId: 97,
        gas: 'auto',
        currency: 'BNB',
        defaultBlockExplorer: 'https://testnet.bscscan.com'
    },
    {
        name: 'Optimism - Mainnet',
        chainName: 'optimism',
        chainId: 10,
        gas: 'auto',
        currency: 'ETH',
        defaultRpcUrl: 'https://mainnet.optimism.io',
        defaultBlockExplorer: 'https://optimistic.etherscan.io/'
    },
    {
        name: 'Optimism - Sepolia',
        chainName: 'optimismSepolia',
        chainId: 11155420,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://sepolia-optimism.etherscan.io/'
    },
    {
        name: 'Arbitrum One - Mainnet',
        chainName: 'arbitrum',
        chainId: 42161,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://arbiscan.io/'
    },
    {
        name: 'Arbitrum One - Sepolia',
        chainName: 'arbitrumSepolia',
        chainId: 421614,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://sepolia.arbiscan.io/'
    },
    {
        name: 'Base - Mainnet',
        chainName: 'base',
        chainId: 8453,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://basescan.org/'
    },
    {
        name: 'Base - Sepolia',
        chainName: 'baseSepolia',
        chainId: 84532,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://sepolia.basescan.org/'
    },
    {
        name: 'Avalanche - C-Chain',
        chainName: 'avalanche',
        chainId: 43114,
        gas: 'auto',
        currency: 'AVAX',
        defaultRpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        defaultBlockExplorer: 'https://snowtrace.io/'
    },
    {
        name: 'Avalanche - Fuji',
        chainName: 'avalancheFuji',
        chainId: 43113,
        gas: 'auto',
        currency: 'AVAX',
        defaultBlockExplorer: 'https://testnet.snowtrace.io/'
    }
]

/**
 * Plugins offered by the "Add other Hardhat plugins" menu.
 *
 * Every entry here installs and loads under Hardhat 3: it ships a
 * `HardhatPlugin` as its default export and is registered through the
 * `plugins` array of `defineConfig(...)`. The Hardhat 2 era `@nomiclabs/*`
 * packages moved to `LegacyHardhatPluginsList` — they are no longer offered
 * for installation, only for removal.
 */
export const DefaultHardhatPluginsList: IHardhatPluginAvailableList[] = [
    {
        title: 'Hardhat Toolbox (Mocha + Ethers)',
        name: '@nomicfoundation/hardhat-toolbox-mocha-ethers',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Toolbox (node:test + Viem)',
        name: '@nomicfoundation/hardhat-toolbox-viem',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Ethers',
        name: '@nomicfoundation/hardhat-ethers',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Ethers Chai matchers',
        name: '@nomicfoundation/hardhat-ethers-chai-matchers',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Viem',
        name: '@nomicfoundation/hardhat-viem',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Viem assertions',
        name: '@nomicfoundation/hardhat-viem-assertions',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Verify (contract verification, replaces hardhat-etherscan)',
        name: '@nomicfoundation/hardhat-verify',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Network helpers',
        name: '@nomicfoundation/hardhat-network-helpers',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Ignition (Ethers)',
        name: '@nomicfoundation/hardhat-ignition-ethers',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Ignition (Viem)',
        name: '@nomicfoundation/hardhat-ignition-viem',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Keystore (encrypted secrets)',
        name: '@nomicfoundation/hardhat-keystore',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Typechain',
        name: '@nomicfoundation/hardhat-typechain',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Mocha test runner',
        name: '@nomicfoundation/hardhat-mocha',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat node:test test runner',
        name: '@nomicfoundation/hardhat-node-test-runner',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Foundry',
        name: '@nomicfoundation/hardhat-foundry',
        addInHardhatConfig: true
    }
]

/**
 * Hardhat 2 only plugins. They do not load under Hardhat 3 — either because
 * the package was renamed (`@nomiclabs/hardhat-etherscan` became
 * `@nomicfoundation/hardhat-verify`), superseded (Hardhat 3 has a built-in
 * network and test runners), or simply unmaintained (waffle, ganache, solpp).
 *
 * They are kept out of the install menu but still listed by the uninstall
 * menu, so a project migrating from Hardhat 2 can clean them up from the CLI.
 */
export const LegacyHardhatPluginsList: IHardhatPluginAvailableList[] = [
    {
        title: 'Hardhat ethers',
        name: '@nomiclabs/hardhat-ethers',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat waffle',
        name: '@nomiclabs/hardhat-waffle',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Solidity coverage',
        name: 'solidity-coverage',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat etherscan',
        name: '@nomiclabs/hardhat-etherscan',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat web3',
        name: '@nomiclabs/hardhat-web3',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat solhint',
        name: '@nomiclabs/hardhat-solhint',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat gas reporter',
        name: 'hardhat-gas-reporter',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat contract sizer',
        name: 'hardhat-contract-sizer',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat Ganache',
        name: '@nomiclabs/hardhat-ganache',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat solpp',
        name: '@nomiclabs/hardhat-solpp',
        addInHardhatConfig: true,
        hardhat2Only: true
    },
    {
        title: 'Hardhat Vyper',
        name: '@nomiclabs/hardhat-vyper',
        addInHardhatConfig: true,
        hardhat2Only: true
    }
]

export const DefaultFoundryTestUtilsList: string[] = [
    'utils/cheatcodes.sol',
    'utils/console.sol',
    'utils/stdlib.sol',
    'utils/test.sol',
    'utils/Vm.sol'
]

export const DefaultGithubWorkflowsGroup: string[] = ['npm', 'yarn']

export const DefaultGithubWorkflowsList: IDefaultGithubWorkflowsList[] = [
    {
        title: 'NPM - Hardhat - Test & Coverage',
        file: 'hardhat-npm',
        group: 'npm',
        requirement: ['solidity-coverage']
    },
    {
        title: 'NPM - Foundry - Forge Test',
        file: 'foundry-npm',
        group: 'npm'
    },
    {
        title: 'Yarn - Hardhat - Test & Coverage',
        file: 'hardhat-yarn',
        group: 'yarn',
        requirement: ['solidity-coverage']
    },
    {
        title: 'Yarn - Foundry - Forge Test',
        file: 'foundry-yarn',
        group: 'yarn'
    }
]

export const addressBookDefaultConfig = {
    savePath: './',
    openzeppelinPath: '.openzeppelin',
    contractsFlattenPath: 'contractsFlatten',
    contractsFlattenPrefix: 'flat_',
    fileHardhatAwesomeCLI: 'hardhat-awesome-cli.json',
    fileEnvHardhatAwesomeCLI: '.env.hardhat-awesome-cli',
    fileContractsAddressDeployed: 'contractsAddressDeployed.json',
    fileContractsAddressDeployedHistory: 'contractsAddressDeployedHistory.json'
}

export const getAddressBookConfig = (
    userConfig = {
        addressBook: addressBookDefaultConfig
    } as any
) => {
    if (userConfig.addressBook)
        return {
            savePath: userConfig.addressBook.savePath || addressBookDefaultConfig.savePath,
            openzeppelinPath: userConfig.addressBook.openzeppelinPath || addressBookDefaultConfig.openzeppelinPath,
            contractsFlattenPath:
                userConfig.addressBook.contractsFlattenPath || addressBookDefaultConfig.contractsFlattenPath,
            contractsFlattenPrefix:
                userConfig.addressBook.contractsFlattenPrefix || addressBookDefaultConfig.contractsFlattenPrefix,
            fileHardhatAwesomeCLI:
                userConfig.addressBook.fileHardhatAwesomeCLI || addressBookDefaultConfig.fileHardhatAwesomeCLI,
            fileEnvHardhatAwesomeCLI:
                userConfig.addressBook.fileEnvHardhatAwesomeCLI || addressBookDefaultConfig.fileEnvHardhatAwesomeCLI,
            fileContractsAddressDeployed:
                userConfig.addressBook.fileContractsAddressDeployed ||
                addressBookDefaultConfig.fileContractsAddressDeployed,
            fileContractsAddressDeployedHistory:
                userConfig.addressBook.fileContractsAddressDeployedHistory ||
                addressBookDefaultConfig.fileContractsAddressDeployedHistory
        }
    return addressBookDefaultConfig
}
