---
"hardhat-awesome-cli": patch
---

Cover the interactive menu flows that were untested before `serveInquirer.ts` was split (#155). Adds a shared `test/menus-test-helpers.ts` inquirer stub plus four new menu-level test files driven by scripted `inquirer.prompt` answers:

- `test/menus.settings.test.ts` — `serveExcludeFileSelector` (test/scripts/contracts) and the chain-activation branch of `serveSettingSelector`. Pins the resulting `hardhat-awesome-cli.json`. Also fixes a latent race in both flows where `allFiles.map(async …)` resolved before the file writes finished, so the menu returned while the settings file was still being written.
- `test/menus.mockContracts.test.ts` — `serveMockContractCreatorSelector`. Drives the contract picker, the yes/no deploy/test/Foundry questions, and the rename form, then asserts the resulting `.sol` / `scripts/` / `test/` / `contracts/test/` files.
- `test/menus.customCommands.test.ts` — `serveCustomCommandManager`. Covers Add (fresh + duplicate name + preserving other settings), Remove, and the read-only List branch.
- `test/menus.workflows.test.ts` — `serveWorkflowBuilder` plus the `buildWorkflowsFromCommand` CLI flag path. Also fixes the brittleness of `buildWorkflows.ts` which previously located the packaged YAML templates via `require.main.filename`, breaking whenever the CLI was not the entry point of the process. The templates are now resolved relative to the package's own directory via `fileURLToPath(import.meta.url)`.

Closes #162.
