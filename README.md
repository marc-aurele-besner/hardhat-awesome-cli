# hardhat-awesome-cli
 Hardhat made awesome with a flexible CLI to help run test, deploy and more.

# This package is not yet published, simply git clone + npm link

## Done
- Run test on all or sigle test file (from all your file in test/)
- Run scripts  on all or sigle scripts file (from all your file in scripts/)
- Setting:
    - Activate/Disable chain to show on test/scripts options
- Create Mock contracts (ERC20, ERC721, ERC1155 + Upgradeable version)

## To do:
- Settings:
    - Build .env file with rpc url and private key (inject both chain and .env info in hardhat.config)
    - Select or exclude file from the test&script directory (to generate a list of different test&scripts to be run and not show these files)
- Add tool to log all contracts deploy on each chain (1 unique contractName/chain + full log)