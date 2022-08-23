[![license](https://img.shields.io/github/license/jamesisaac/react-native-background-task.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/hardhat-awesome-cli.svg)](https://badge.fury.io/hardhat-awesome-cli)
[![buidler](https://buidler.dev/buidler-plugin-badge.svg?1)](https://github.com/marc-aurele-besner/hardhat-awesome-cli)

# 👷 hardhat-awesome-cli
 Hardhat made awesome with a flexible CLI to help run tests, deploy and more.

## How to install this package
### 1. Install this package
With NPM
```commandline
npm install hardhat-awesome-cli
```
Or with Yarn
```commandline
yarn add hardhat-awesome-cli
```

### 2. Import/Require this package in your hardhat.config.js/.ts

Inside inside hardhat.config.js
```
require("hardhat-awesome-cli");
```
or inside hardhat.config.ts (Typescript)
```
import 'hardhat-awesome-cli'
```

### Other option
<details>
<summary>Clone this repository and create a symlink</summary>

```
git clone https://github.com/marc-aurele-besner/hardhat-awesome-cli

cd hardhat-awesome-cli

npm install

npm run build

npm link
```

in the hardhat project, you want to use this plugin

```
npm link hardhat-awesome-cli
```
</details>

## CLI features
- Run tests (Allow you you to run tests on all files or specific files in test/)
- Run scripts (Allow you you to run scripts on specific files in scripts/)
- Select scripts and tests to run (Allow you to select a script to execute and all or one test to perform afterward)
- Flatten all your contract or a specific contract
- Run Forge test on all or single test contracts if forge setting is detected
- Run coverage tests (Available only if solidity-coverage is installed and available as a task)
- Setup chains, RPC and accounts 
    - Add/Remove chains from the chain selection
    - Set RPC Url, private key or mnemonic for all or one chain
    - Add a custom chain to the current chain selection (currently these custom chains are not getting injected into hardhat networks)
    - See all config for activated chain
- More settings
    - Exclude test file from the tests selection list
    - Exclude script file from the scripts selection list
    - Exclude script or contract file from the contract selection list
    - Install/Uninstall other Hardhat plugins
    - Create Github test workflows (for NPM and/or Yarn and for Hardhat test&coverage and/or Foundry test)
    - Create Foundry settings, remapping and test utilities
        <details>
            <summary>More details on Foundry</summary>
        [Foundry Documentation](https://book.getfoundry.sh/index.html)

        Run forge test

        ```commandline
            forge test
        ```

        </details>
- Create Mock contracts + (Deployment scripts, tests scripts and Foundry(Forge) test contracts (Missing test for MockProxyAdmin and MockTransparentUpgradeableProxy))
    - MockERC20
    - MockERC721
    - MockERC1155
    - MockERC20Upgradeable
    - MockERC721Upgradeable
    - MockERC1155Upgradeable
    - MockProxyAdmin
    - MockTransparentUpgradeableProxy
- Get account balance

### Current chain support
- Hardhat local (default local network)
- Ethereum - Mainnet (chainId: 1)
- Ethereum - Ropstein (chainId 3)
- Ethereum - Rinkeby (chainId 4)
- Ethereum - Goerli (chainId 5)
- Ethereum - Kovan (chainId 42)
- Polygon - Mainnet (chainId 137)
- Polygon - Mumbai (chainId 80001)
- Binance Smart Chain - Mainnet (chainId 56)
- Binance Smart Chain - Testnet (chainId 97)
- Optimism - Mainnet (chainId 10)
- Optimism - Testnet Kovan (chainId 69)
- Avalanche - Mainnet (chainId 43114)


In 'More settings' you can also add a custom chain, create an issue or pull request to add other chains.

## CLI optional flags

- --add-activated-chain         Add chains from the chain selection (default: "")
- --add-foundry                 Create Foundry settings, remapping and test utilities (default: "")
- --add-github-test-workflow   Create Github test workflows (default: "")
- --add-hardhat-plugin          Add other Hardhat plugins (default: "")
- --exclude-contract-file       Exclude contract file from the contract selection list (default: "")
- --exclude-script-file         Exclude script file from the scripts selection list (default: "")
- --exclude-test-file           Exclude test file from the tests selection list (default: "")
- --get-account-balance         Get account balance (default: "")
- --remove-activated-chain      Remove chains from the chain selection (default: "")
- --remove-hardhat-plugin       Remove other Hardhat plugins (default: "")


## Helper tools
Tools that you can use in your scripts and tests to make your life easier

### Address Book

Create (if it does not exist) contractsAddressDeployed.json and contractsAddressDeployedHistory.json to store all the contracts you deployed, with the name of the contract, the contract address, the network name, the deployer address and the deployment date. The first file (contractsAddressDeployed.json) stores only the last contract for a given contract name and network name, while the second file (contractsAddressDeployedHistory.json) keeps a log of all the contracts deployed.

You can then retrieve your contract address in your tests scripts to run test on deployed contracts on live chains for example.

Import:
javascript
```
const { addressBook, network } = require('hardhat')
```
typescript
```
import { addressBook, network } from 'hardhat'
```

Usage:
```
addressBook.saveContract(contractName: string, contractAddress: string, deployedNetwork: string, deployedBy: string, blockHah?: string, blockNumber?: number, tag?: string, extra?: any)

addressBook.retrieveContract(contractName: string, deployedNetwork: string)
```

Example:
```
await addressBook.saveContract('MockERC20', mockERC20.address, network.name, deployer.address)

await addressBook.retrieveContract('MockERC20', network.name)
```

Return:
```
address: string
```

Retrieve a deployed contract object

Usage:
```

addressBook.retrieveContractObject(contractName: string, deployedNetwork: string)
```

Example:
```

await addressBook.retrieveContractObject('MockERC20', network.name)
```

Return:
```
{
    name: string
    address: string
    network: string
    deployer: string
    deploymentDate: Date
    blockHah?: string
    blockNumber?: number
    tag?: string
    extra?: any
}
```

Retrieve Admin Proxy contract address deployed by @openzeppelin/hardhat-upgrades library

Usage:
```

addressBook.retrieveOZAdminProxyContract(chainId: number)
```

Example:
```

await addressBook.retrieveOZAdminProxyContract(network.config.chainId)
```

Return:
```
address: string
```

Retrieve all contracts deployed for a network name

Usage:
```

addressBook.retrieveContractHistory(deployedNetwork: string)
```

Example:
```

await addressBook.retrieveContractHistory(network.name)
```

Return:
```
[
    {
        name: string
        address: string
        network: string
        deployer: string
        deploymentDate: Date
        blockHah?: string
        blockNumber?: number
    }
]
```

<details>
    <summary>## 💪 Done</summary>
- Run test on all or single test file (from all your file in test/)
- Run scripts  on all or single scripts file (from all your file in scripts/)
- Run Forge test on all or single test contracts if forge setting is detected
- Inject chain activated in settings, rpc and accounts in hardhat.config
- Inject custom chain in hardhat networks
- Setup chains, RPC and accounts:
    - Activate/Disable chain to show on test/scripts options
    - Build .env file with rpc url and private key (or mnemonic)
    - Add ".env.hardhat-awesome-cli" to .gitignore amd .npmignore (create .gitignore if do detected)
    - See all config for activated chain
    - Create Github test workflows
    - Create Foundry settings, remapping and test utilities
- More settings
    - Exclude files from, tests scripts, and contracts selection (useful for config and share helper file)
    - Add/remove other hardhat plugins (In npm/yarn and in hardhat.config)
    - Create Github workflows file to run test, coverage test and forge test
- Create Mock contracts (ERC20, ERC721, ERC1155 + Upgradeable version, AdminProxy and TransparentUpgradeableProxy) 
    - Add @openzeppelin/contracts || @openzeppelin/contracts-upgradeable if not already installed
    - Offer to create deployment scripts (use addressBook.saveContract() to save the deployed contract in contractsAddressDeployed.json and contractsAddressDeployedHistory.json)
    - Offer to create test scripts
    - Offer to create Foundry/Forge test contracts
- Tool to log all contracts deploy on each chain (1 unique contractName/chain + full log) and retrieve them (not tested yet)
    - hre.addressBook.{ saveContract, retrieveContract, retrieveContractObject, retrieveOZAdminProxyContract, retrieveContractHistory }
- Flatten your contracts (All contracts, or specific contracts) save in contractsFlatten/
- Write some test on the package using mocha
- Add optional flag to "cli" command to access some functionality
</details>

## 🏗️ To do:
- Improving documentation
- Deployment contract generator
- More Settings:
    - Handle directory for file exception
    - Setup slack API or email report to receive a copy of test result and contracts list deployed
    - Create a custom command
- Improve all the tests, to test transfer, mint, burn (all basic ERC20, ERC721, ERC1155 functions)
- Add test for AdminProxy and TransparentUpgradeableProxy
- Offer to rename the Mock contract and set all constructor input (or initialize input) via cli
    - Verify that the input name does not conflict with inheritance
    - Rename the Mock file, contract name, deployment script, test scripts (and the test values)
- Write more test with mocha to test the package functionality
- Create contracts/, test/ and scripts/ folder if they don't exist when adding mock contracts
- Remove package from hardhat config when remove