#!/usr/bin/env node

import serveCli from './serveInquirer.ts'

/**
 * Standalone CLI entry. In Hardhat 2 this file also registered the plugin as
 * a side-effect (`task('cli', ...)`), so running the binary inside a Hardhat
 * project would surface the `cli` task. Hardhat 3 dropped side-effect
 * registration — the plugin must be added to `hardhat.config.ts` explicitly
 * (see `src/plugin/index.ts`). This entry now only handles the standalone
 * case where the user runs `npx hardhat-awesome-cli` outside a Hardhat
 * project.
 *
 * `serveCli` requires `(args, env)` — we hand it an empty `args` object so
 * the function falls through to `serveInquirer(env)` and shows the main
 * menu, matching the Hardhat 2 behaviour for an unconfigured invocation.
 */
async function main(): Promise<void> {
    const args: Record<string, string> = {}
    const adapter = {
        userConfig: { addressBook: undefined },
        network: { name: 'hardhat' },
        config: { paths: { root: process.cwd() } },
        paths: {},
        ethers: undefined
    }
    await serveCli(args, adapter)
}

main().catch((err) => {
    console.error(err)
    process.exitCode = 1
})