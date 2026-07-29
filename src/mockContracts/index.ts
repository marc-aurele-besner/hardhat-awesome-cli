import type { IMockContractsList } from '../types.ts'

const MockContractsList: IMockContractsList[] = [
    {
        name: 'MockERC20',
        desc: 'Basic ERC20 Token contract.',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScript: 'scripts/deploy-Mock-ERC20.ts',
        testScript: 'test/test-Mock-ERC20.ts',
        testContractFoundry: 'testForge/MockERC20.t.sol'
    },
    {
        name: 'MockERC721',
        desc: 'Basic ERC721 NFT Token contract (unique nft).',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScript: 'scripts/deploy-Mock-ERC721.ts',
        testScript: 'test/test-Mock-ERC721.ts',
        testContractFoundry: 'testForge/MockERC721.t.sol'
    },
    {
        name: 'MockERC1155',
        desc: 'Basic ERC1155 NFT Token contract (multiple nfts).',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScript: 'scripts/deploy-Mock-ERC1155.ts',
        testScript: 'test/test-Mock-ERC1155.ts',
        testContractFoundry: 'testForge/MockERC1155.t.sol'
    },
    // Upgradeable contracts
    {
        name: 'MockERC20Upgradeable',
        desc: 'Basic Upgradeable ERC20 Token contract.',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        deploymentScript: 'scripts/deploy-Mock-ERC20Upgradeable.ts',
        testScript: 'test/test-Mock-ERC20Upgradeable.ts',
        testContractFoundry: 'testForge/MockERC20Upgradeable.t.sol',
        upgradeable: true
    },
    {
        name: 'MockERC721Upgradeable',
        desc: 'Basic Upgradeable ERC721 NFT Token contract (unique nft).',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        deploymentScript: 'scripts/deploy-Mock-ERC721Upgradeable.ts',
        testScript: 'test/test-Mock-ERC721Upgradeable.ts',
        testContractFoundry: 'testForge/MockERC721Upgradeable.t.sol',
        upgradeable: true
    },
    {
        name: 'MockERC1155Upgradeable',
        desc: 'Basic Upgradeable ERC1155 NFT Token contract (multiple nfts).',
        dependencies: ['@openzeppelin/contracts-upgradeable'],
        deploymentScript: 'scripts/deploy-Mock-ERC1155Upgradeable.ts',
        testScript: 'test/test-Mock-ERC1155Upgradeable.ts',
        testContractFoundry: 'testForge/MockERC1155Upgradeable.t.sol',
        upgradeable: true
    },
    {
        name: 'MockProxyAdmin',
        desc: 'Setup a Mock Proxy Admin contract to interact with the Proxy contract.',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScript: 'scripts/deploy-Mock-Proxy-Admin.ts',
        testScript: 'test/test-Mock-Proxy-Admin.ts',
        testContractFoundry: 'testForge/MockProxyAdmin.t.sol'
    },
    {
        name: 'MockTransparentUpgradeableProxy',
        desc: 'Setup a Mock Transparent Upgradeable Proxy contract to implement your contract logic using delegatecall.',
        dependencies: ['@openzeppelin/contracts'],
        deploymentScript: 'scripts/deploy-Mock-Transparent-Upgradeable-Proxy.ts',
        testContractFoundry: 'testForge/MockTransparentUpgradeableProxy.t.sol'
    }
]

export default MockContractsList
