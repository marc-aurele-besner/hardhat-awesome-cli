import path from 'path'

import type {
    ConfigurationVariableResolver,
    HardhatConfig,
    HardhatUserConfig
} from 'hardhat/types/config'
import type { ConfigHooks } from 'hardhat/types/hooks'

/**
 * `resolveUserConfig` handler that injects a `paths.cli` field into the
 * resolved HardhatConfig based on the user's `paths.cli` (if any) or
 * `<project-root>/cli` by default. This is the Hardhat 3 equivalent of the
 * `extendConfig` callback that the Hardhat 2 plugin used.
 */
export async function resolveUserConfigHandler(
    userConfig: HardhatUserConfig,
    resolveConfigurationVariable: ConfigurationVariableResolver,
    next: (
        nextUserConfig: HardhatUserConfig,
        nextResolveConfigurationVariable: ConfigurationVariableResolver
    ) => Promise<HardhatConfig>
): Promise<HardhatConfig> {
    const resolved = await next(userConfig, resolveConfigurationVariable)

    // The user may declare `paths.cli` either at the top level or under
    // `paths`. We accept both shapes — top level is preferred.
    const declaredPath = (userConfig as any).paths?.cli ?? (userConfig as any).cli
    const cliPath =
        declaredPath === undefined
            ? path.join(resolved.paths.root, 'cli')
            : path.isAbsolute(declaredPath)
              ? declaredPath
              : path.normalize(path.join(resolved.paths.root, declaredPath))

    ;(resolved.paths as any).cli = cliPath

    return resolved
}

const handlers: Partial<ConfigHooks> = {
    resolveUserConfig: resolveUserConfigHandler
}

/**
 * Hardhat 3 expects each `hookHandlers[category]` entry to be a factory
 * that returns a *function* returning the handlers object (i.e.
 * `() => Promise<{ ...handlers }>`). Returning the handlers object directly
 * trips the `Plugin X doesn't export a hook factory for category Y`
 * invariant.
 */
export default async function configHookHandlerFactory(): Promise<Partial<ConfigHooks>> {
    return handlers
}