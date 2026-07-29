---
"hardhat-awesome-cli": minor
---

Expose the "Add a custom chain to the current chain selection" sub-flow as a `--addCustomChain` CLI flag. The flag accepts a JSON object with `name` (string), `chainId` (positive integer), optional `gas` (defaults to `"auto"`), and optional `defaultRpcUrl`. The internal `chainName` slot (`customChain1`..`customChain8`) is picked automatically by `buildCustomChainEntry` so both the menu and the CLI stay in lock-step. The interactive "Add a custom chain" sub-flow now delegates to the same `runAddCustomChain` helper that backs the flag, picking the next free slot instead of the previous (broken) "first already-used" lookup. Closes #165.
