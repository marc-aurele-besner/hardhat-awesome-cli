import { IChain, IDefaultGithubWorkflowsList, IHardhatPluginAvailableList } from './types'

export const fileHardhatAwesomeCLI = 'hardhat-awesome-cli.json'
export const fileEnvHardhatAwesomeCLI = '.env.hardhat-awesome-cli'

export const fileContractsAddressDeployed = 'contractsAddressDeployed.json'
export const fileContractsAddressDeployedHistory = 'contractsAddressDeployedHistory.json'

export const DefaultChainList: IChain[] = [
    {
        name: 'Hardhat local',
        chainName: 'hardhat',
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
        name: 'Ethereum - Ropstein',
        chainName: 'ropsten',
        chainId: 3,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://ropsten.etherscan.io/'
    },
    {
        name: 'Ethereum - Rinkeby',
        chainName: 'rinkeby',
        chainId: 4,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://rinkeby.etherscan.io/'
    },
    {
        name: 'Ethereum - Goerli',
        chainName: 'goerli',
        chainId: 5,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://goerli.etherscan.io/'
    },
    {
        name: 'Ethereum - Kovan',
        chainName: 'kovan',
        chainId: 42,
        gas: 'auto',
        currency: 'ETH',
        defaultBlockExplorer: 'https://kovan.etherscan.io/'
    },
    {
        name: 'Polygon - Mainnet',
        chainName: 'polygon',
        chainId: 137,
        gas: 'auto',
        currency: 'MATIC',
        defaultRpcUrl: 'https://polygon-rpc.com',
        defaultBlockExplorer: 'https://polygonscan.com/'
    },
    {
        name: 'Polygon - Mumbai',
        chainName: 'mumbai',
        chainId: 80001,
        gas: 'auto',
        currency: 'MATIC',
        defaultRpcUrl: 'https://rpc-mumbai.maticvigil.com',
        defaultBlockExplorer: 'https://mumbai.polygonscan.com/'
    },
    {
        name: 'Binance Smart Chain - Mainnet',
        chainName: 'binance',
        chainId: 56,
        gas: 'auto',
        currency: 'BNB',
        defaultRpcUrl: 'https://bsc-dataseed.binance.org',
        defaultBlockExplorer: 'https://bscscan.com'
    },
    {
        name: 'Binance Smart Chain - Tesnet',
        chainName: 'binanceTestnet',
        chainId: 97,
        gas: 'auto',
        currency: 'BNB',
        defaultRpcUrl: 'https://rpc-mainnet.matic.network',
        defaultBlockExplorer: 'https://explorer.binance.org/smart-testnet'
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
        name: 'Optimism - Testnet Kovan',
        chainName: 'optimismTestnetKovan',
        chainId: 69,
        gas: 'auto',
        currency: 'ETH',
        defaultRpcUrl: 'https://kovan.optimism.io'
    },
    {
        name: 'Avalanche - Mainnet',
        chainName: 'optimismTestnetKovan',
        chainId: 43114,
        gas: 'auto',
        currency: 'AVAX',
        defaultRpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        defaultBlockExplorer: 'https://snowtrace.io/'
    }
]

export const DefaultHardhatPluginsList: IHardhatPluginAvailableList[] = [
    {
        title: 'Hardhat ethers',
        name: '@nomiclabs/hardhat-ethers',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat waffle',
        name: '@nomiclabs/hardhat-waffle',
        addInHardhatConfig: true
    },
    {
        title: 'Solidity coverage',
        name: 'solidity-coverage',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat etherscan',
        name: '@nomiclabs/hardhat-etherscan',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat web3',
        name: '@nomiclabs/hardhat-web3',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat solhint',
        name: '@nomiclabs/hardhat-solhint',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat gas reporter',
        name: 'hardhat-gas-reporter',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat contract sizer',
        name: 'hardhat-contract-sizer',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Ganache',
        name: '@nomiclabs/hardhat-ganache',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat solpp',
        name: '@nomiclabs/hardhat-solpp',
        addInHardhatConfig: true
    },
    {
        title: 'Hardhat Vyper',
        name: '@nomiclabs/hardhat-vyper',
        addInHardhatConfig: true
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
        group: 'npm',
        requirement: ['solidity-coverage']
    },
    {
        title: 'Yarn - Foundry - Forge Test',
        file: 'foundry-yarn',
        group: 'npm'
    }
]
