---
"hardhat-awesome-cli": minor
---

Add a `customCommands` array to `hardhat-awesome-cli.json` so users can define named shell or Hardhat task shortcuts. New menu entries (`Run a custom command` at the top level when at least one is defined, and `Manage custom commands` under `More settings` for add / list / remove) plus the matching `--runCustomCommand <name>`, `--addCustomCommand '<json>'`, and `--removeCustomCommand <name>` CLI flags. Closes #172.