import { IMockContractsList } from '../types'

const MockContractsList: IMockContractsList[] = [
    {
        name: 'MockERC20',
        desc: 'Basic ERC20 Token contract.',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScriptJs: 'scripts/deploy-mock-erc20.js',
        deploymentScriptTs: 'scripts/deploy-mock-erc20.ts',
        testScriptJs: 'test/test-mock-erc20.js',
        testScriptTs: 'test/test-mock-erc20.ts',
        testContractFoundry: 'testForge/MockERC20.t.sol'
    },
    {
        name: 'MockERC721',
        desc: 'Basic ERC721 NFT Token contract (unique nft).',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScriptJs: 'scripts/deploy-mock-erc721.js',
        deploymentScriptTs: 'scripts/deploy-mock-erc721.ts',
        testScriptJs: 'test/test-mock-erc721.js',
        testScriptTs: 'test/test-mock-erc721.ts'
    },
    {
        name: 'MockERC1155',
        desc: 'Basic ERC1155 NFT Token contract (multiple nfts).',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScriptJs: 'scripts/deploy-mock-erc1155.js',
        deploymentScriptTs: 'scripts/deploy-mock-erc1155.ts',
        testScriptJs: 'test/test-mock-erc1155.js',
        testScriptTs: 'test/test-mock-erc1155.ts'
    },
    // Upgradeable contracts
    {
        name: 'MockERC20Upgradeable',
        desc: 'Basic Upgradeable ERC20 Token contract.',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        deploymentScriptJs: 'scripts/deploy-mock-erc20upgradeable.js',
        deploymentScriptTs: 'scripts/deploy-mock-erc20upgradeable.ts',
        testScriptJs: 'test/test-mock-erc20upgradeable.js',
        testScriptTs: 'test/test-mock-erc20upgradeable.ts',
        testContractFoundry: 'testForge/MockERC20Upgradeable.t.sol',
        upgradeable: true
    },
    {
        name: 'MockERC721Upgradeable',
        desc: 'Basic Upgradeable ERC721 NFT Token contract (unique nft).',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        deploymentScriptJs: 'scripts/deploy-mock-erc721upgradeable.js',
        deploymentScriptTs: 'scripts/deploy-mock-erc721upgradeable.ts',
        testScriptJs: 'test/test-mock-erc721upgradeable.js',
        testScriptTs: 'test/test-mock-erc721upgradeable.ts',
        upgradeable: true
    },
    {
        name: 'MockERC1155Upgradeable',
        desc: 'Basic Upgradeable ERC1155 NFT Token contract (multiple nfts).',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        deploymentScriptJs: 'scripts/deploy-mock-erc1155upgradeable.js',
        deploymentScriptTs: 'scripts/deploy-mock-erc1155upgradeable.ts',
        testScriptJs: 'test/test-mock-erc1155upgradeable.js',
        testScriptTs: 'test/test-mock-erc1155upgradeable.ts',
        upgradeable: true
    },
    {
        name: 'MockProxyAdmin',
        desc: 'Setup a Mock Proxy Admin contract to interact with the Proxy contract.',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScriptJs: 'scripts/deploy-mock-proxy-admin.js',
        deploymentScriptTs: 'scripts/deploy-mock-proxy-admin.ts'
    },
    {
        name: 'MockTransparentUpgradeableProxy',
        desc: 'Setup a Mock Transparent Upgradeable Proxy contract to implement your contract logic using delegatecall.',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScriptJs: 'scripts/deploy-mock-transparent-upgradeable-proxy.js',
        deploymentScriptTs: 'scripts/deploy-mock-transparent-upgradeable-proxy.ts'
    }
]

export default MockContractsList
