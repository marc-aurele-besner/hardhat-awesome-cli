import { IChain, IHardhatPluginAvailableList } from './types'

export const DefaultChainList: IChain[] = [
    {
        name: 'Hardhat local',
        chainName: 'hardhat',
        chainId: 31337,
        gas: 'auto'
    },
    {
        name: 'Ethereum - Mainnet',
        chainName: 'ethereum',
        chainId: 1,
        gas: 'auto'
    },
    {
        name: 'Ethereum - Ropstein',
        chainName: 'ropsten',
        chainId: 3,
        gas: 'auto'
    },
    {
        name: 'Ethereum - Rinkeby',
        chainName: 'rinkeby',
        chainId: 4,
        gas: 'auto'
    },
    {
        name: 'Ethereum - Kovan',
        chainName: 'kovan',
        chainId: 42,
        gas: 'auto'
    },
    {
        name: 'Polygon - Mainnet',
        chainName: 'polygon',
        chainId: 137,
        gas: 'auto',
        defaultRpcUrl: 'https://polygon-rpc.com'
    },
    {
        name: 'Polygon - Mumbai',
        chainName: 'mumbai',
        chainId: 80001,
        gas: 'auto',
        defaultRpcUrl: 'https://rpc-mumbai.maticvigil.com'
    }
]

export const DefaultHardhatPluginsList: IHardhatPluginAvailableList[] = [
    {
        title: 'Hardhat ethers',
        name: '@nomiclabs/hardhat-ethers'
    },
    {
        title: 'Hardhat waffle',
        name: '@nomiclabs/hardhat-waffle'
    },
    {
        title: 'Solidity coverage',
        name: 'solidity-coverage'
    },
    {
        title: 'Hardhat etherscan',
        name: '@nomiclabs/hardhat-etherscan '
    },
    {
        title: 'Hardhat web3',
        name: '@nomiclabs/hardhat-web3'
    },
    {
        title: 'Hardhat solhint',
        name: '@nomiclabs/hardhat-solhint'
    },
    {
        title: 'Hardhat gas reporter',
        name: 'hardhat-gas-reporter'
    },
    {
        title: 'Hardhat contract sizer',
        name: 'hardhat-contract-sizer'
    }
]
