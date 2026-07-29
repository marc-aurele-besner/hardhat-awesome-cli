// Hardhat 3 module augmentation: declare the `cli` path the plugin manages so
// `paths: { cli: '...' }` is accepted by `defineConfig` without `as any` casts.
// Keep this file in sync with `hook-handlers.ts`, where the field is actually
// injected into the resolved config.
import 'hardhat/types/config'

declare module 'hardhat/types/config' {
    export interface ProjectPathsUserConfig {
        cli?: string
    }
}
