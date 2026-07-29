---
"hardhat-awesome-cli": minor
---

Expose the `Flatten contracts` menu entry as a `--flattenContract <contractName>[:renameLicense]` CLI flag. The flag accepts a contract name (bare basename, with or without the `.sol` extension, or a relative path under `contracts/` such as `utils/Helper`) or the literal `all` to flatten every contract. Append `:renameLicense` to also rewrite the `SPDX-License-Identifier` (→ `SPDX-License-DISABLED-Identifier`) and `pragma solidity` (→ `// pragma solidity`) headers in the flatten output, matching the menu's "Rename SPDX-License-Identifier" confirm. The interactive menu now delegates to the same `runFlattenContract` helper so the two surfaces stay in lock-step. Closes #165.
