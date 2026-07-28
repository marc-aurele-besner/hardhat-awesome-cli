#!/usr/bin/env node

import serveInquirer from './serveInquirer.js'

/**
 * Standalone CLI entry. In Hardhat 2 this file also registered the plugin as
 * a side-effect (`task('cli', ...)`), so running the binary inside a Hardhat
 * project would surface the `cli` task. Hardhat 3 dropped side-effect
 * registration — the plugin must be added to `hardhat.config.ts` explicitly
 * (see `src/plugin/index.ts`). This entry now only handles the standalone
 * case where the user runs `npx hardhat-awesome-cli` outside a Hardhat
 * project.
 */
async function main(): Promise<void> {
    const adapter = {
        userConfig: { addressBook: undefined },
        network: { name: 'hardhat' },
        config: { paths: { root: process.cwd() } },
        paths: {},
        ethers: undefined
    }
    await serveInquirer(adapter)
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exitCode = 1
})