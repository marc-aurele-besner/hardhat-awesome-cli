# Changelog

## 0.7.0

### Minor Changes

- 5cde857: Expose the "Add a custom chain to the current chain selection" sub-flow as a `--addCustomChain` CLI flag. The flag accepts a JSON object with `name` (string), `chainId` (positive integer), optional `gas` (defaults to `"auto"`), and optional `defaultRpcUrl`. The internal `chainName` slot (`customChain1`..`customChain8`) is picked automatically by `buildCustomChainEntry` so both the menu and the CLI stay in lock-step. The interactive "Add a custom chain" sub-flow now delegates to the same `runAddCustomChain` helper that backs the flag, picking the next free slot instead of the previous (broken) "first already-used" lookup. Closes #165.

## 0.6.0

### Minor Changes

- 7b4d17a: Expose the `Flatten contracts` menu entry as a `--flattenContract <contractName>[:renameLicense]` CLI flag. The flag accepts a contract name (bare basename, with or without the `.sol` extension, or a relative path under `contracts/` such as `utils/Helper`) or the literal `all` to flatten every contract. Append `:renameLicense` to also rewrite the `SPDX-License-Identifier` (→ `SPDX-License-DISABLED-Identifier`) and `pragma solidity` (→ `// pragma solidity`) headers in the flatten output, matching the menu's "Rename SPDX-License-Identifier" confirm. The interactive menu now delegates to the same `runFlattenContract` helper so the two surfaces stay in lock-step. Closes #165.

## 0.5.0

### Minor Changes

- 047d122: Add a `Verify a contract` menu entry and matching `--verifyContract <network>:<contractNameOrAddress>[:<arg1>:<arg2>:...]` CLI flag. The interactive flow walks through network selection, contract identification (from the address book or a manually-pasted 0x-prefixed address), and optional constructor arguments before running `npx hardhat verify <address> --network <network> [args...]`. When no `@nomicfoundation/hardhat-verify` (or `hardhat-verify`) dependency is detected in `package.json`, the CLI prints a clear install hint instead of failing at the explorer API. Closes #170.

## 0.4.0

### Minor Changes

- 3b1325c: Add a `customCommands` array to `hardhat-awesome-cli.json` so users can define named shell or Hardhat task shortcuts. New menu entries (`Run a custom command` at the top level when at least one is defined, and `Manage custom commands` under `More settings` for add / list / remove) plus the matching `--runCustomCommand <name>`, `--addCustomCommand '<json>'`, and `--removeCustomCommand <name>` CLI flags. Closes #172.

## 0.3.0

### Minor Changes

- 35a10b0: Add a `Create deployment scripts` menu and matching `--addDeploymentScript <ContractName>[:arg1:arg2:...]` flag that scaffold `scripts/deploy-<Name>.{ts,js}` for any contract in `contracts/`. The generated script imports `addressBook` from `hardhat`, deploys the contract (forwarding any constructor arguments) and writes the deployed address to `contractsAddressDeployed.json`. The `scripts/` directory is created on demand and the generator refuses to overwrite an existing `deploy-<Name>.{ts,js}`. Closes #166.

## 0.2.0

### Minor Changes

- 8021ec7: Add a `CHANGELOG.md` and adopt [Changesets](https://github.com/changesets/changesets) for version bumps, GitHub Releases, and npm publishing. Contributors now ship a `.changeset/*.md` entry on each PR; the release workflow opens a "Version Packages" PR automatically and publishes on merge to `main`. See `CONTRIBUTING.md` for the new flow.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- CHANGELOG and release automation via [Changesets](https://github.com/changesets/changesets).
  Contributors now add a `.changeset/*.md` entry on each PR; the Version Packages
  PR opens automatically and a GitHub Release + npm publish happen on merge to
  `main`. `CONTRIBUTING.md` no longer requires manual `package.json` version bumps.
- New GitHub Actions workflow `.github/workflows/release.yml` that runs the
  Changesets publish action on every push to `main`.

## [0.1.6] - 2026-07-28

### Changed

- Mock contract generator: dropped the `MockProxyAdmin` / `TransparentUpgradeableProxy`
  TODO items now that the templates are in place.
- Reformat plugin and test fixtures with Prettier.

### Added

- Foundry tests for `MockProxyAdmin` and `MockTransparentUpgradeableProxy`.
- Generator test that iterates `MockContractsList` and asserts every entry's
  artifacts exist on disk.
- Extended ERC20 / ERC721 / ERC1155 template tests with mint, burn, transfer,
  and approval coverage.
- Coverage reporting via `c8`, surfaced as a CI artifact.

## [0.1.5] - 2026-07-13

### Added

- Hardhat 3 support: typed plugin entry, augmented `paths.cli`, and a
  consumer smoke test (`npm run smoke`) that packs the package, installs
  it into a clean HH3 fixture, and asserts the `cli` task loads.
- Discrete TypeScript types across the inquirer flows (`IAddressBookConfig`,
  `IHreContext`, tightened `config` and `address-book` typing).
- CI lint and build jobs running on every push to `main` and on pull requests.
- Renamed `Mock-VRFCoordinatorV2Mock` to `MockVRFCoordinatorV2Mock` for
  naming consistency.
- Mock contract rename flow: prompt for a custom name + constructor args and
  expose it as the `--addCustomMockContract` CLI flag.

### Fixed

- Hardhat config mutation is now safe across plugin re-runs.
- `getEnvValue` returns the parsed env value, not the function itself.
- `addressBook` access is qualified in the Transparent Upgradeable Proxy
  deploy script.
- Published `bin` points at the compiled `dist` entry instead of the source.
- Removed a stub `fs` dependency that was no longer needed.
- Dropped `tslint` in favour of ESLint across the project.
- Secrets hygiene: private keys and mnemonics are masked when the active
  config is displayed.
- Removed fixed multi-second `sleep()` calls in favour of the
  `AWESOME_CLI_NO_PAUSE` / `AWESOME_CLI_PAUSE_MS` env knobs.

## [0.1.4] - 2026-06-29

### Added

- Mock-proxy Admin and Transparent Upgradeable Proxy templates.
- Function selector listing for contracts.

### Fixed

- Hardhat 3 plugin list and registration.

## [0.1.3] - 2026-05-20

### Changed

- Pinned peer dependency to Hardhat `^3.0.0`.
- Migrated tooling to TypeScript 7 and Node 24.

### Fixed

- Resolved `inquirer` v14 type breaks and `eslint` v10 config migration.

## [0.1.2] - 2026-04-12

### Added

- Directory-level exclusions in the settings file and the matching
  `--exclude-*-directory` CLI flags.

### Fixed

- Address-book imports honour the saved network name.

## [0.1.1] - 2026-03-04

### Added

- `package.json` `pnpm` and `bun` install detection with the matching
  workflow YAMLs.

### Fixed

- Allow `--addAllMockContracts` to skip prompts when all defaults are accepted.

## [0.1.0] - 2026-02-08

### Added

- First public release of the interactive CLI plugin: environment builder,
  networks, mock contracts, workflows, plugins, and an address book.

[Unreleased]: https://github.com/marc-aurele-besner/hardhat-awesome-cli/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/marc-aurele-besner/hardhat-awesome-cli/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/marc-aurele-besner/hardhat-awesome-cli/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/marc-aurele-besner/hardhat-awesome-cli/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/marc-aurele-besner/hardhat-awesome-cli/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/marc-aurele-besner/hardhat-awesome-cli/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/marc-aurele-besner/hardhat-awesome-cli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/marc-aurele-besner/hardhat-awesome-cli/releases/tag/v0.1.0
