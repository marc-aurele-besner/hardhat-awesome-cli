---
"hardhat-awesome-cli": minor
---

Add a `Verify a contract` menu entry and matching `--verifyContract <network>:<contractNameOrAddress>[:<arg1>:<arg2>:...]` CLI flag. The interactive flow walks through network selection, contract identification (from the address book or a manually-pasted 0x-prefixed address), and optional constructor arguments before running `npx hardhat verify <address> --network <network> [args...]`. When no `@nomicfoundation/hardhat-verify` (or `hardhat-verify`) dependency is detected in `package.json`, the CLI prints a clear install hint instead of failing at the explorer API. Closes #170.
