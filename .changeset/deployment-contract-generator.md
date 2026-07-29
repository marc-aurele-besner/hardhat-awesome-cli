---
"hardhat-awesome-cli": minor
---

Add a `Create deployment scripts` menu and matching `--addDeploymentScript <ContractName>[:arg1:arg2:...]` flag that scaffold `scripts/deploy-<Name>.{ts,js}` for any contract in `contracts/`. The generated script imports `addressBook` from `hardhat`, deploys the contract (forwarding any constructor arguments) and writes the deployed address to `contractsAddressDeployed.json`. The `scripts/` directory is created on demand and the generator refuses to overwrite an existing `deploy-<Name>.{ts,js}`. Closes #166.