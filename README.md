[![license](https://img.shields.io/github/license/jamesisaac/react-native-background-task.svg)](https://opensource.org/licenses/MIT)

# 👷 hardhat-awesome-cli
 Hardhat made awesome with a flexible CLI to help run test, deploy and more.

## 1. Install this package
With NPM
```commandline
npm install hardhat-awesome-cli
```
Or with Yarn
```commandline
yarn add hardhat-awesome-cli
```

## 1. Import/Require this package in your hardhat.config.js/.ts

Inside inside hardhat.config.js
```
require("hardhat-awesome-cli");
```
or inside hardhat.config.ts (Typescript)
```
import hardhatAwesomeCli from 'hardhat-awesome-cli'
```

## 💪 Done
- Run test on all or single test file (from all your file in test/)
- Run scripts  on all or single scripts file (from all your file in scripts/)
- Setup chains, RPC and accounts:
    - Activate/Disable chain to show on test/scripts options
    - Build .env file with rpc url and private key (or mnemonic)
- More settings
    - Exclude files from, tests and scripts selection (useful for config and share helper file)
- Create Mock contracts (ERC20, ERC721, ERC1155 + Upgradeable version)
    - Add @openzeppelin/contracts || @openzeppelin/contracts-upgradeable if not already installed

## 🏗️ To do:
- Inject chain settings, rpc and accounts in hardhat.config
- Offer to generate deployment script and test script for Mock contract created
- Deployment contract generator
- Run coverage test (if solidity-coverage is installed)
- Setup chains, RPC and accounts:
    - Disabling chains seams to be broken
- More Settings:
    - Create github workflows file to run test and coverage test
    - Setup slack API or email report to receive a copy of test result and contracts list deployed
    - Add other hardhat plugins
- Add tool to log all contracts deploy on each chain (1 unique contractName/chain + full log)
- Add option to create Admin Proxy and Transparent proxy w/ appropriate deployment scripts