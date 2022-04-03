[![license](https://img.shields.io/github/license/jamesisaac/react-native-background-task.svg)](https://opensource.org/licenses/MIT)

# 👷 hardhat-awesome-cli
 Hardhat made awesome with a flexible CLI to help run test, deploy and more.

# This package is not yet published on npmjs, for now

## 1. Clone repo
```commandline
git clone https://github.com/marc-aurele-besner/hardhat-awesome-cli.git
```

## 2. Move in directory
```commandline
cd hardhat-awesome-cli
```

## 3. Create a NPM symbolic link
```commandline
npm link
```

## 4. NPM Link in the Hardhat project of your choice

Inside the root of the Hardhat project of your choice
```commandline
npm link hardhat-awesome-cli
```

## 5. Import/Require this package in your hardhat.config.js/.ts

Inside inside hardhat.config.js
```
require("hardhat-awesome-cli");
```
or inside hardhat.config.ts
```
import hardhatAwesomeCli from 'hardhat-awesome-cli'
```

## 💪 Done
- Run test on all or sigle test file (from all your file in test/)
- Run scripts  on all or sigle scripts file (from all your file in scripts/)
- Settings:
    - Activate/Disable chain to show on test/scripts options
    - Build .env file with rpc url and private key (or mnemonic)
- More settings
    - Exclude files from, tests and scripts selection (useful for config and share helper file)
- Create Mock contracts (ERC20, ERC721, ERC1155 + Upgradeable version)

## 🏗️ To do:
- Inject chain settings, rpc and accounts in hardhat.config
- Offer to generate deployment script and test script for Mock contract created
- Deployment contract generator
- More Settings:
    - Create github workflows file to run test and coverage test
    - Setup slack API or email report to receive a copy of test result and contracts list deployed
- Add tool to log all contracts deploy on each chain (1 unique contractName/chain + full log)
- Add option to create Admin Proxy and Transparent proxy w/ appropriate deployment scripts