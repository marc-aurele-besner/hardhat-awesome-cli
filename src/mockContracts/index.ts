import { IMockContractsList } from '../types'

const MockContractsList: IMockContractsList[] = [
    {
        name: 'MockERC20',
        desc: 'Basic ERC20 Token contract',
        dependencies: ['@openzeppelin/contracts']
    },
    {
        name: 'MockERC721',
        desc: 'Basic ERC721 NFT Token contract (unique nft)',
        dependencies: ['@openzeppelin/contracts']
    },
    {
        name: 'MockERC1155',
        desc: 'Basic ERC1155 NFT Token contract (multiple nfts)',
        dependencies: ['@openzeppelin/contracts']
    },
    // Upgradeable contracts
    {
        name: 'MockERC20Upgradeable',
        desc: 'Basic Upgradeable ERC20 Token contract',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        upgradeable: true
    },
    {
        name: 'MockERC721Upgradeable',
        desc: 'Basic Upgradeable ERC721 NFT Token contract (unique nft)',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        upgradeable: true
    },
    {
        name: 'MockERC1155Upgradeable',
        desc: 'Basic Upgradeable ERC1155 NFT Token contract (multiple nfts)',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        upgradeable: true
    }
]

export default MockContractsList
