[![license](https://img.shields.io/github/license/marc-aurele-besner/hardhat-awesome-cli.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/hardhat-awesome-cli.svg)](https://badge.fury.io/js/hardhat-awesome-cli)

# 👷 hardhat-awesome-cli

```txt
#    #   ##   #####  #####  #    #   ##   #####         ##   #    # ######  ####   ####  #    # ######        ####  #      #
#    #  #  #  #    # #    # #    #  #  #    #          #  #  #    # #      #      #    # ##  ## #            #    # #      #
###### #    # #    # #    # ###### #    #   #   ##### #    # #    # #####   ####  #    # # ## # #####  ##### #      #      #
#    # ###### #####  #    # #    # ######   #         ###### # ## # #           # #    # #    # #            #      #      #
#    # #    # #   #  #    # #    # #    #   #         #    # ##  ## #      #    # #    # #    # #            #    # #      #
#    # #    # #    # #####  #    # #    #   #         #    # #    # ######  ####   ####  #    # ######        ####  ###### #
```

Hardhat made awesome with a flexible CLI to help run tests, deploy and more.

## How to install this package

### 1. Install this package

With NPM

```bash
npm install hardhat-awesome-cli
```

Or with Yarn

```bash
yarn add hardhat-awesome-cli
```

### 2. Add the plugin to your `hardhat.config.ts`

> **Heads up:** Hardhat 3 dropped side-effect plugin registration. The
> `require('hardhat-awesome-cli')` / `import 'hardhat-awesome-cli'` style from
> Hardhat 2 no longer works — the plugin must be added to the `plugins` array
> of `defineConfig(...)`.

Add the plugin to the `plugins` array, importing the plugin entry exposed by
the package under the `/plugin` subpath:

```ts
import { defineConfig } from 'hardhat/config'
import hardhatAwesomeCli from 'hardhat-awesome-cli/plugin'

export default defineConfig({
    plugins: [hardhatAwesomeCli],
})
```

> **Which import path?**
>
> - `hardhat-awesome-cli/plugin` — the Hardhat 3 plugin (use this in
>   `hardhat.config.ts`).
> - `hardhat-awesome-cli` — the standalone CLI binary (`npx hardhat-awesome-cli`
>   for running outside a Hardhat project). Not a plugin entry.

### Other option

<details>
<summary>Clone this repository and create a symlink</summary>

```bash
git clone https://github.com/marc-aurele-besner/hardhat-awesome-cli

cd hardhat-awesome-cli

npm install

npm run build

npm link
```

in the hardhat project, you want to use this plugin

```bash
npm link hardhat-awesome-cli
```

then in your `hardhat.config.ts`, import the plugin from the `/plugin` subpath
the same way as for the published package:

```ts
import { defineConfig } from 'hardhat/config'
import hardhatAwesomeCli from 'hardhat-awesome-cli/plugin'

export default defineConfig({
    plugins: [hardhatAwesomeCli],
})
```

</details>

## Directories

-   [src/](./src/)
-   [test/](./test/)

-   [.mocharc.json](./.mocharc.json)
-   [.npmignore](./.npmignore)
-   [.prettierignore](./.prettierignore)
-   [.prettierrc](./.prettierrc)
-   [awesome-readme.config.js](./awesome-readme.config.js)
-   [CONTRIBUTING.md](./CONTRIBUTING.md)
-   [eslint.config.js](./eslint.config.js)
-   [LICENSE](./LICENSE)
-   [package-lock.json](./package-lock.json)
-   [package.json](./package.json)
-   [tsconfig.json](./tsconfig.json)
-   [tsconfig.prod.json](./tsconfig.prod.json)

## CLI features

-   Run tests (Allow you you to run tests on all files or specific files in test/)
-   Run scripts (Allow you you to run scripts on specific files in scripts/)
-   Select scripts and tests to run (Allow you to select a script to execute and all or one test to perform afterward)
-   Flatten all your contract or a specific contract (offer to rename SPDX-License-Identifier -> SPDX-License-Flatten-Identifier to avoid multiple license identifier issue)
-   Run Forge test on all or single test contracts if forge setting is detected
-   Run coverage tests (Available only if solidity-coverage is installed and available as a task)
-   List function selectors (Print every public and external function of a contract with its 4 bytes selector, ordered by selector)
-   Setup chains, RPC and accounts
    -   Add/Remove chains from the chain selection
    -   Set RPC Url, private key or mnemonic for all or one chain
    -   Add a custom chain to the current chain selection (currently these custom chains are not getting injected into hardhat networks)
    -   See all config for activated chain
-   More settings

    -   Exclude test file from the tests selection list
    -   Exclude script file from the scripts selection list
    -   Exclude script or contract file from the contract selection list
    -   Install/Uninstall other Hardhat plugins

        The plugin list targets Hardhat 3: the CLI installs the package with
        npm/yarn, adds `import <plugin> from '<package>'` to your
        `hardhat.config`, and registers it in the `plugins` array of
        `defineConfig(...)` (Hardhat 3 dropped side-effect plugin registration).

          <details>
              <summary>Plugins offered</summary>

        - `@nomicfoundation/hardhat-toolbox-mocha-ethers` / `@nomicfoundation/hardhat-toolbox-viem`
        - `@nomicfoundation/hardhat-ethers` / `@nomicfoundation/hardhat-ethers-chai-matchers`
        - `@nomicfoundation/hardhat-viem` / `@nomicfoundation/hardhat-viem-assertions`
        - `@nomicfoundation/hardhat-verify` (contract verification, replaces `@nomiclabs/hardhat-etherscan`)
        - `@nomicfoundation/hardhat-network-helpers`
        - `@nomicfoundation/hardhat-ignition-ethers` / `@nomicfoundation/hardhat-ignition-viem`
        - `@nomicfoundation/hardhat-keystore`
        - `@nomicfoundation/hardhat-typechain`
        - `@nomicfoundation/hardhat-mocha` / `@nomicfoundation/hardhat-node-test-runner`
        - `@nomicfoundation/hardhat-ledger`
        - `@nomicfoundation/hardhat-foundry`

        The Hardhat 2 era `@nomiclabs/*` packages (waffle, ganache, solpp,
        web3, …) do not load under Hardhat 3, so they are no longer offered
        for installation. They still show up in the uninstall menu — labelled
        `(Hardhat 2 only)` — so a project migrating to Hardhat 3 can drop them
        from both `package.json` and `hardhat.config`.

          </details>

    -   Create Github test workflows (for NPM and/or Yarn and for Hardhat test&coverage and/or Foundry test)
    -   Create Foundry settings, remapping and test utilities
          <details>
              <summary>More details on Foundry</summary>
          [Foundry Documentation](https://book.getfoundry.sh/index.html)

        Run forge test

        ```commandline
            forge test
        ```

          </details>

    -   Add foundry-test-utility (npm package for shared Forge mocks & utilities)

-   Create Mock contracts + (Deployment scripts, tests scripts and Foundry(Forge) test contracts (Missing test for MockProxyAdmin and MockTransparentUpgradeableProxy))
    -   All mock contracts (create every mock contract below, with their deployment and test scripts, at the same time)
    -   MockERC20
    -   MockERC721
    -   MockERC1155
    -   MockERC20Upgradeable
    -   MockERC721Upgradeable
    -   MockERC1155Upgradeable
    -   MockProxyAdmin
    -   MockTransparentUpgradeableProxy

    > Mock deployment and test scripts are authored as a single TypeScript
    > source of truth under `src/mockContracts/scripts/` and `src/mockContracts/test/`.
    > When the consumer project uses `hardhat.config.js`, the CLI generates the
    > CommonJS variant from the same template at write time — no duplicate files
    > to keep in sync.

-   Get account balance

### Current chain support

-   Hardhat local (default local network)
-   Ethereum - Mainnet (chainId: 1)
-   Ethereum - Sepolia (chainId: 11155111)
-   Ethereum - Holesky (chainId: 17000)
-   Polygon - Mainnet (chainId: 137)
-   Polygon - Amoy (chainId: 80002)
-   BNB Smart Chain - Mainnet (chainId: 56)
-   BNB Smart Chain - Testnet (chainId: 97)
-   Optimism - Mainnet (chainId: 10)
-   Optimism - Sepolia (chainId: 11155420)
-   Arbitrum One - Mainnet (chainId: 42161)
-   Arbitrum One - Sepolia (chainId: 421614)
-   Base - Mainnet (chainId: 8453)
-   Base - Sepolia (chainId: 84532)
-   Avalanche - C-Chain (chainId: 43114)
-   Avalanche - Fuji (chainId: 43113)

In 'More settings' you can also add a custom chain, create an issue or pull request to add other chains.

## CLI optional flags

-   --add-activated-chain Add chains from the chain selection (default: "")
-   --add-foundry Create Foundry settings, remapping and test utilities (default: "")
-   --add-foundry-test-utility Install the foundry-test-utility npm package and add its remapping (default: "")
-   --add-github-test-workflow Create Github test workflows (default: "")
-   --add-hardhat-plugin Add other Hardhat plugins (default: "")
-   --exclude-contract-file Exclude contract file from the contract selection list (default: "")
-   --exclude-script-file Exclude script file from the scripts selection list (default: "")
-   --exclude-test-file Exclude test file from the tests selection list (default: "")
-   --get-account-balance Get account balance (default: "")
-   --remove-activated-chain Remove chains from the chain selection (default: "")
-   --remove-hardhat-plugin Remove other Hardhat plugins (default: "")

### Equivalent CLI command per menu selection

When a menu selection maps to one of the CLI flags above (add/remove Hardhat plugins, add/remove activated chains, create GitHub workflows, install Foundry settings, install the Foundry test utility, …), the CLI prints the equivalent `npx hardhat cli --<flag> <value>` command line after the change is applied. This lets you skip the interactive prompts next time around, or wire the same action into a CI script.

```commandline
Equivalent CLI command:  npx hardhat cli --addHardhatPlugin @nomicfoundation/hardhat-ethers
```

Boolean flags (no value) are rendered without an argument:

```commandline
Equivalent CLI command:  npx hardhat cli --addFoundry
```

## Helper tools

Tools that you can use in your scripts and tests to make your life easier

### Address Book

Create (if it does not exist) contractsAddressDeployed.json and contractsAddressDeployedHistory.json to store all the contracts you deployed, with the name of the contract, the contract address, the network name, the deployer address and the deployment date. The first file (contractsAddressDeployed.json) stores only the last contract for a given contract name and network name, while the second file (contractsAddressDeployedHistory.json) keeps a log of all the contracts deployed.

You can then retrieve your contract address in your tests scripts to run test on deployed contracts on live chains for example.

Import:

javascript

```js
const { addressBook, network } = require('hardhat')
```

typescript

```ts
import { addressBook, network } from 'hardhat'
```

Usage:

```js
addressBook.saveContract(
        contractName: string,
        contractAddress: string,
        deployedNetwork: string,
        deployedBy: string,
        chainId: number = 0,
        blockHash?: string,
        blockNumber?: number,
        tag?: string,
        extra?: any,
        forceAdd = false as boolean
    )

addressBook.retrieveContract(contractName: string, deployedNetwork: string)
```

Example:

```js
await addressBook.saveContract(
    'MockERC20',
    mockERC20.address,
    network.name,
    deployer.address,
    network.config.chainId,
    mockERC20.deployTransaction.blockHash,
    mockERC20.deployTransaction.blockNumber,
    'Test-MockERC20'
)

await addressBook.retrieveContract('MockERC20', network.name)
```

Return:

```js
address: string
```

Retrieve a deployed contract object

Usage:

```js

addressBook.retrieveContractObject(contractName: string, deployedNetwork: string)
```

Example:

```js
await addressBook.retrieveContractObject('MockERC20', network.name)
```

Return:

```js
{
    name: string
    address: string
    network: string
    deployer: string
    deploymentDate: Date
    chainId: number
    blockHah?: string
    blockNumber?: number
    tag?: string
    extra?: any
}
```

Retrieve Admin Proxy contract address deployed by @openzeppelin/hardhat-upgrades library

Usage:

```js

addressBook.retrieveOZAdminProxyContract(chainId: number)
```

Example:

```js
await addressBook.retrieveOZAdminProxyContract(network.config.chainId)
```

Return:

```js
address: string
```

Retrieve all contracts deployed for a network name

Usage:

```js

addressBook.retrieveContractHistory(deployedNetwork: string)
```

Example:

```js
await addressBook.retrieveContractHistory(network.name)
```

Return:

```js
[
    {
        name: string
        address: string
        network: string
        deployer: string
        deploymentDate: Date
        chainId: number
        blockHah?: string
        blockNumber?: number
        tag?: string
        extra?: any
    }
]
```

Clean the contractsAddressDeployed files by filtering a field and a value and remove these entry from the file, can be apply to both files or just the primary

Usage:

```js

addressBook.cleanContractDeployed(field: TAddressBookFields, value: any, applyToPrimary: boolean = true, applyToHistory: boolean = true)
```

Example:

```js
await addressBook.cleanContractDeployed('network', 'hardhat', true, true)
```

### Function Selector List

List every public and external function of a contract with its 4 bytes function selector (the first 4 bytes of the keccak256 hash of the canonical function signature), ordered by selector. This is what you see in a transaction `data` field or in a revert trace, so it is handy to map an unknown selector back to a function, to check for selector clashes between a proxy and its implementation, or to build a low level `call`.

The contract needs to be compiled first (`npx hardhat compile`), and `hre.ethers` needs to be available (`@nomicfoundation/hardhat-ethers`).

From the CLI, select `List function selectors` in the menu, then pick a contract:

```commandline
npx hardhat cli
```

```txt
Contract:  MockERC20  has  16  public and external functions, ordered by selector
┌─────────┬──────────────────────────────────┬──────────────┐
│ (index) │ name                             │ selector     │
├─────────┼──────────────────────────────────┼──────────────┤
│ 0       │ 'allowance(address,address)'     │ '0xdd62ed3e' │
│ 1       │ 'transfer(address,uint256)'      │ '0xa9059cbb' │
└─────────┴──────────────────────────────────┴──────────────┘
```

You can also use it in your scripts and tests.

Import:

typescript

```ts
import { FunctionList } from 'hardhat-awesome-cli/plugin'
```

javascript

```js
const { FunctionList } = require('hardhat-awesome-cli/plugin')
```

Usage:

```js

new FunctionList(hre: HardhatRuntimeEnvironment)

functionList.listSelectors(contractName: string)
```

Example:

```ts
import hre from 'hardhat'
import { FunctionList } from 'hardhat-awesome-cli/plugin'

const functionList = new FunctionList(hre)

const functions = await functionList.listSelectors('MockERC20')

const transfer = functions.find((fn) => fn.name === 'transfer(address,uint256)')
```

Return (also printed as a table with `console.table`):

```js
[
    {
        name: string // canonical signature, ex: 'transfer(address,uint256)'
        selector: string // 4 bytes selector, ex: '0xa9059cbb'
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
- Flatten your contracts (All contracts, or specific contracts) save in contractsFlatten/ and offer to rename SPDX-License-Identifier -> SPDX-License-Flatten-Identifier to avoid multiple license identifier issue
- Write some test on the package using mocha
- List all public and external function selectors of a contract (from the CLI menu or with the FunctionList helper)
- Add optional flag to "cli" command to access some functionality
- Print the equivalent `npx hardhat cli --flag value` command line for each settings menu selection that maps to a CLI flag
</details>

## Directory Tree

```txt
hardhat-awesome-cli/
├── .github/
│   ├── CODEOWNERS
│   ├── FUNDING.yml
│   ├── issue_template.md
│   ├── pull_request_template.md
│   ├── renovate.json
│   └── workflows/
│       ├── ci.yml
│       └── package.yml
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── src/
│   ├── AwesomeAddressBook.ts
│   ├── buildEnv.ts
│   ├── buildExcludedFile.ts
│   ├── buildFilesList.ts
│   ├── buildFoundrySetting.ts
│   ├── buildMockContracts.ts
│   ├── buildNetworks.ts
│   ├── buildWorkflows.ts
│   ├── config.ts
│   ├── functionList.ts
│   ├── index.ts
│   ├── packageInstaller.ts
│   ├── serveInquirer.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── githubWorkflows/
│   │   ├── foundry-npm.yml
│   │   ├── foundry-yarn.yml
│   │   ├── hardhat-npm.yml
│   │   └── hardhat-yarn.yml
│   ├── mockContracts/
│   │   ├── index.ts
│   │   ├── MockERC20.sol (+ Upgradeable / ERC721 / ERC1155 variants, MockProxyAdmin, MockTransparentUpgradeableProxy)
│   │   ├── scripts/  # deploy scripts for every mock above (TS source of truth; JS is generated on the fly for hardhat.config.js projects)
│   │   ├── test/     # mocha test scripts for every mock above (TS source of truth; JS is generated on the fly for hardhat.config.js projects)
│   │   └── testForge/# Foundry/Forge test contracts + cheatcode utilities
│   └── plugin/
│       ├── cli-action.ts
│       ├── hook-handlers.ts
│       └── index.ts
├── test/
│   ├── addressBook.test.ts
│   ├── buildFilesList.test.ts
│   ├── buildFoundrySetting.test.ts
│   ├── buildNetworks.test.ts
│   ├── cli.test.ts
│   ├── functionList.test.ts
│   ├── helpers.ts
│   └── hardhat-cli/
│       └── hardhat.config.ts
├── .mocharc.json
├── .npmignore
├── .prettierignore
├── .prettierrc
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── awesome-readme.config.js
├── eslint.config.js
├── package-lock.json
├── package.json
├── tsconfig.json
└── tsconfig.prod.json
```

## 🏗️ To do:

-   Improving documentation
-   Deployment contract generator
-   More Settings:
-   Handle directory for file exception
-   Setup slack API or email report to receive a copy of test result and contracts list deployed
-   Create a custom command
-   Improve all the tests, to test transfer, mint, burn (all basic ERC20, ERC721, ERC1155 functions)
-   Add test for AdminProxy and TransparentUpgradeableProxy
-   Offer to rename the Mock contract and set all constructor input (or initialize input) via cli
-   Verify that the input name does not conflict with inheritance
-   Rename the Mock file, contract name, deployment script, test scripts (and the test values)
-   Write more test with mocha to test the package functionality
-   Create contracts/, test/ and scripts/ folder if they don't exist when adding mock contracts
-   Remove package from hardhat config when remove
