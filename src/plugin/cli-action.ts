import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre'

import serveCli from '../serveInquirer.ts'

/**
 * Lazy-loaded action for the `cli` task. Builds a small adapter that mimics
 * the bits of the Hardhat 2 HRE that `serveInquirer`/`serveCli` rely on
 * (`userConfig`, `network.name`, `config`, `paths`), then hands control to
 * `serveCli`. Hardhat 3 removed HRE extension, so the adapter is the only
 * way to keep the inquirer UI working without rewriting every downstream
 * call site.
 */
export default async function cliAction(
    args: any,
    hre: HardhatRuntimeEnvironment
): Promise<void> {
    const network = await hre.network
        .connect()
        .catch(() => undefined as unknown as Awaited<ReturnType<typeof hre.network.connect>>)

    const adapter = {
        userConfig: (hre.config as any),
        network: network
            ? { name: (network as any).networkName ?? 'hardhat' }
            : { name: 'hardhat' },
        config: hre.config,
        paths: (hre.config as any).paths,
        // Hardhat 3 dropped HRE-level `ethers`/`network.provider` — leave
        // them undefined and let serveInquirer fail soft on those branches.
        ethers: undefined
    }

    await serveCli(args, adapter)
}