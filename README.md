[![license](https://img.shields.io/github/license/jamesisaac/react-native-background-task.svg)](https://opensource.org/licenses/MIT)

# 👷 hardhat-awesome-cli
 Hardhat made awesome with a flexible CLI to help run test, deploy and more.

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
import hardhatAwesomeCli from 'hardhat-awesome-cli'
```

### Other option
<details>
<summary>Clone this repository and create a symlink</summary>

```
git clone https://github.com/marc-aurele-besner/hardhat-awesome-cli

cd hardhat-awesome-cli

npm link
```

in the hardhat project you want to use this plugin

```
npm link hardhat-awesome-cli
```
</details>

## CLI features
- Run tests (Allow you yo run test on all files or specific files in test/)
- Run scripts (Allow you yo run script on specific files in scripts/)
- Select scripts and tests to run (Allow you to select a script to execure and all or one test to perform afterward)
- Run coverage tests (Available only if solidity-coverage is installed and available as a task)
- Setup chains, RPC and accounts 
    - Add/Remove chains from the chain selection
    - Set RPC Url, private key or mnemonic for all or one chain
    - Add a custom chain to the current chain selection)
- More settings
    - Exclude test file from the tests selection list
    - Exclude script file from the scripts selection list
    - Install/Uninstall other Hardhat plugins (Still not very stable)
- Create Mock contracts + (Deployment scripts and tests scripts (currently only for MockERC20))
    - MockERC20
    - MockERC721
    - MockERC1155
    - MockERC20Upgradeable
    - MockERC721Upgradeable
    - MockERC1155Upgradeable
- Get account balance

### Current chain support
- Hardhat local (default local network)
- Ethereum - Mainnet (chainId: 1)
- Ethereum - Ropstein (chainId 3)
- Ethereum - Rinkeby (chainId 4)
- Ethereum - Kovan (chainId 42)
- Polygon - Mainnet (chainId 137)
- Polygon - Mumbai (chainId 80001)

In 'More settings' you can also add custom chain, or create a issue or pull request to add other chains.

## Helper tools
Tools that you can use in your scripts and tests to make your life easier

### Address Book

Import:
js```
const { addressBook } = require('hardhat')
```
typescript```
import { addressBook } from 'hardhat'
```

Usage:
```
addressBook.saveContract(contractName: string, contractAddress: string, deployedNetwork: string, deployedBy: string)

addressBook.retrieveContract(contractName: string, deployedNetwork: string)
```

Example:
```
await addressBook.saveContract('MockERC20', MockERC20.address, 'ethereum', deployer.address)

await addressBook.retrieveContract('MockERC20', 'ethereum')
```

## 💪 Done
- Run test on all or single test file (from all your file in test/)
- Run scripts  on all or single scripts file (from all your file in scripts/)
- Setup chains, RPC and accounts:
    - Activate/Disable chain to show on test/scripts options
    - Build .env file with rpc url and private key (or mnemonic)
    - Add ".env.hardhat-awesome-cli" to .gitignore amd .npmignore (create .gitignore if do detected)
- More settings
    - Exclude files from, tests and scripts selection (useful for config and share helper file)
    - Add other hardhat plugins
- Create Mock contracts (ERC20, ERC721, ERC1155 + Upgradeable version) + (Deployment scripts and tests scripts (currently only for MockERC20))
    - Add @openzeppelin/contracts || @openzeppelin/contracts-upgradeable if not already installed
- Tool to log all contracts deploy on each chain (1 unique contractName/chain + full log) and retrieve them (not tested yet)
    - hre.addressBook.{ saveContract, retrieveContract }


## 🏗️ To do:
- Start working on documentation
- Inject chain settings, rpc and accounts in hardhat.config
- Create deployment and test scripts for all Mock contracts
- Deployment contract generator
- Make 'Run coverage tests' available only if task is exported by hardhat
- Setup chains, RPC and accounts:
    - See list of .env config and chains setup in a table
- More Settings:
    - Create github workflows file to run test and coverage test
    - Setup slack API or email report to receive a copy of test result and contracts list deployed
    - Add/Remove other hardhat plugins (need to add/remove in hardhat.config)
        - Need to import plugin added in hardhat.config
        - Need to list plugin installed to mark them as "check" in the plugin list
        - Need to allow to remove plugin, uninstall package via npm/yarn and remove them in hardhat config
    - Create custom command
- Add option to create Admin Proxy and Transparent proxy w/ appropriate deployment scripts