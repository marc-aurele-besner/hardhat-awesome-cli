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
        npm/yarn/pnpm/bun (auto-detected from your lockfile), adds
        `import <plugin> from '<package>'` to your `hardhat.config`, and
        registers it in the `plugins` array of `defineConfig(...)` (Hardhat
        3 dropped side-effect plugin registration).

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

    -   Create Github test workflows (for NPM, Yarn, pnpm, or Bun and for Hardhat test&coverage and/or Foundry test)
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

-   Create Mock contracts + (Deployment scripts, tests scripts and Foundry(Forge) test contracts)
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

    Issue #167 — after picking a mock contract, the CLI now asks for a
    custom contract name (default: the registry name) plus optional
    constructor name and symbol. The contract file, the deployment script,
    the Hardhat test, and the Foundry test are all rewritten in place so
    every reference — identifier, import path, `getContractFactory` call,
    `describe(...)` title, `_TEST_NAME` literal — points at the custom
    name end-to-end. A validation step rejects invalid Solidity
    identifiers (e.g. `1Token`, `My-Token`) and names that would shadow
    the inherited contract (`ERC20`, `ERC721Upgradeable`,
    `Initializable`, …).

    The CLI prints the equivalent command for scripting — the same rename
    is reachable without prompts via:

    ```bash
    npx hardhat cli --addCustomMockContract "MockERC20:MyToken:MyToken:MOCK"
    ```

    The colon-separated value is
    `<registryName>:<customName>:<constructorName>:<constructorSymbol>`.
    Hitting Enter at every interactive prompt keeps the registry defaults
    so existing users stay on the stock `MockERC20` flow.

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

### Package manager support

The CLI picks the package manager it uses (for installing/removing plugins,
adding the `foundry-test-utility`, and printing the equivalent `npx hardhat
cli` command) by inspecting the lockfile at the project root, in this
priority order:

1. `pnpm-lock.yaml` → **pnpm** (`pnpm add -D <pkg>` / `pnpm remove <pkg>`)
2. `bun.lock` / `bun.lockb` → **bun** (`bun add -d <pkg>` / `bun remove <pkg>`)
3. `yarn.lock` → **yarn** (`yarn add <pkg> -D` / `yarn remove <pkg>`)
4. `package-lock.json` → **npm** (`npm install <pkg> --save-dev` / `npm remove <pkg>`)
5. no recognised lockfile → **npm** (default)

pnpm and bun win over npm/yarn on purpose so a project that happens to
also carry a `package-lock.json` (created when a contributor clones with
npm) still resolves to the right manager. The same lookup drives the CI
workflow generator: the `Create Github test workflows` menu and the
`--addGithubTestWorkflow` flag now offer a Hardhat + Foundry workflow
per supported package manager (`hardhat-pnpm.yml`, `foundry-pnpm.yml`,
`hardhat-bun.yml`, `foundry-bun.yml`) in addition to the existing npm
and yarn templates.

## CLI optional flags

-   --add-activated-chain Add chains from the chain selection (default: "")
-   --add-foundry Create Foundry settings, remapping and test utilities (default: "")
-   --add-foundry-test-utility Install the foundry-test-utility npm package and add its remapping (default: "")
-   --add-github-test-workflow Create Github test workflows (default: "")
-   --add-hardhat-plugin Add other Hardhat plugins (default: "")
-   --exclude-contract-file Exclude contract file from the contract selection list (default: "")
-   --exclude-contract-directory Exclude contract directory (and every nested file) from the contract selection list. Pass the path with a trailing slash, e.g. `--exclude-contract-directory helpers/`. (default: "")
-   --exclude-script-file Exclude script file from the scripts selection list (default: "")
-   --exclude-script-directory Exclude script directory (and every nested file) from the scripts selection list. Pass the path with a trailing slash, e.g. `--exclude-script-directory helpers/`. (default: "")
-   --exclude-test-file Exclude test file from the tests selection list (default: "")
-   --exclude-test-directory Exclude test directory (and every nested file) from the tests selection list. Pass the path with a trailing slash, e.g. `--exclude-test-directory helpers/`. (default: "")
-   --get-account-balance Get account balance (default: "")
-   --remove-activated-chain Remove chains from the chain selection (default: "")
-   --remove-hardhat-plugin Remove other Hardhat plugins (default: "")

### Safe Hardhat plugin configuration updates

For a typical Hardhat 3 `defineConfig({ plugins: [...] })` configuration, adding or removing a plugin updates both its ESM import and the `plugins` array. The generated plugin-array structure is checked before it replaces the original file. If the configuration shape is missing, ambiguous, or malformed, the CLI leaves the file untouched and prints the exact import and plugin entry to add manually. Legacy side-effect `require` and `import` configurations remain supported.

### Equivalent CLI command per menu selection

When a menu selection maps to one of the CLI flags above (add/remove Hardhat plugins, add/remove activated chains, create GitHub workflows, install Foundry settings, install the Foundry test utility, …), the CLI prints the equivalent `npx hardhat cli --<flag> <value>` command line after the change is applied. This lets you skip the interactive prompts next time around, or wire the same action into a CI script.

```commandline
Equivalent CLI command:  npx hardhat cli --addHardhatPlugin @nomicfoundation/hardhat-ethers
```

Boolean flags (no value) are rendered without an argument:

```commandline
Equivalent CLI command:  npx hardhat cli --addFoundry
```

### Skipping or shortening UI pauses

The CLI uses two environment variables to control the brief readability pauses that sit between menu steps:

-   `AWESOME_CLI_NO_PAUSE=1` — skip every short pause entirely. Recommended in CI or any non-interactive run where the menu would otherwise redraw over the previous output.
-   `AWESOME_CLI_PAUSE_MS=<ms>` — set the default pause length (default `250`, capped at `5000`). Useful when you want a quicker menu without disabling pauses outright.

```commandline
# Quiet CI run — never pause, never block on a sleep
AWESOME_CLI_NO_PAUSE=1 npx hardhat cli --addHardhatPlugin @nomicfoundation/hardhat-ethers

# Speed up a local session — keep pauses, but cut them in half
AWESOME_CLI_PAUSE_MS=120 npx hardhat cli
```

Long-running work (running tests, installing or removing a plugin, flattening a contract, …) does **not** rely on these variables — it already awaits the child process exit, so the menu never resumes before the command has finished.

### Secrets and `.env.hardhat-awesome-cli`

The setup menu (`Setup chains, RPC and accounts` → `Set RPC Url, private key or mnemonic ...`) writes RPC URLs, private keys and mnemonics to a local file named **`.env.hardhat-awesome-cli`** at the project root. The CLI does the following to keep that file out of harm's way:

-   Pre-adds `.env.hardhat-awesome-cli` to the project's `.gitignore` and `.npmignore`. If either file does not exist when the first secret is written, the CLI creates / updates it. This protects projects that copy the file in by hand before the CLI has run.
-   Prints a yellow `Warning: writing a private key in plaintext to .env.hardhat-awesome-cli` line every time a private key or mnemonic is appended. The plaintext value is recoverable from the file, so it must never end up in version control, logs, screenshots, or chat.
-   Masks private keys and mnemonics in the **See all config for activated chain** view — a key like `0xfeed...beef` becomes `****beef` so it never reaches the terminal, a bug report, or a screen-share. Set the environment variable `AWESOME_CLI_SHOW_SECRETS=1` to opt in to the previous unredacted behaviour.

For production signers we recommend `@nomicfoundation/hardhat-ledger` (offered in the install menu) or `@nomicfoundation/hardhat-keystore` (encrypted, Hardhat-native) instead of dropping a raw private key into the env file.

```commandline
# Default: secrets are masked with `****abcd` in the rendered config
npx hardhat cli

# Reveal secrets in the rendered config for the current session only
AWESOME_CLI_SHOW_SECRETS=1 npx hardhat cli
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

## Tests & coverage

Run the mocha suite locally with `npm test`. To see what is and is not exercised, use `npm run test:coverage`, which wraps the suite with [c8](https://github.com/bcoe/c8) and writes a coverage report to `coverage/` (an `lcov.info` file plus a browsable `coverage/index.html`). The `coverage/` directory is git-ignored — each CI run on `main` and on pull requests also produces a `coverage-report` artifact, so you can download the latest run from the workflow summary page without checking anything in.

Coverage is intentionally informational for now: thresholds have not been set in the npm script, so a missing test does not yet fail CI. The intent is to make gaps visible first, then tighten the floor once the menu code in `src/serveInquirer.ts` is split (see issue #155) and interactive flows gain unit tests (see issue #162).

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
│   ├── packageManager.ts
│   ├── serveInquirer.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── githubWorkflows/
│   │   ├── foundry-bun.yml
│   │   ├── foundry-npm.yml
│   │   ├── foundry-pnpm.yml
│   │   ├── foundry-yarn.yml
│   │   ├── hardhat-bun.yml
│   │   ├── hardhat-npm.yml
│   │   ├── hardhat-pnpm.yml
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
