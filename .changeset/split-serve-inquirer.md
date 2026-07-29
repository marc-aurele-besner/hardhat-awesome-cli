---
"hardhat-awesome-cli": patch
---

Split `src/serveInquirer.ts` (~1500 lines) into focused menu modules under `src/menus/`: `mainMenu` (banner + top-level dispatch), `runners` (tests, scripts, forge, flatten, function list), `network` (chain selector, env builder, account balance), `settings` (chains, RPC/keys, exclusions), `moreSettings` (workflows, Foundry, plugin entries), `plugins`, `mockContracts`, `deploymentScripts`, `verifyContract`, `customCommands`, plus shared `fileSelector` and prompt-answer `types`. `serveInquirer.ts` is now a thin CLI-flag dispatcher that re-exports `formatAddCustomMockContractFlag` / `parseAddCustomMockContractFlag` so its public surface is unchanged. No CLI behaviour changes. Adds `test/menus.fileSelector.test.ts`, the first menu-level unit test made possible by the split. Closes #155.
