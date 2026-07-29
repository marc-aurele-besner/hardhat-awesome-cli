import fs from 'fs'
import path from 'path'

/**
 * Package manager supported by the installer and CI workflow generator.
 *
 * The CLI picks one per invocation by looking at the lockfile at the project
 * root, in this priority order:
 *
 *   pnpm-lock.yaml → pnpm
 *   bun.lock / bun.lockb → bun
 *   yarn.lock → yarn
 *   package-lock.json → npm
 *   (no recognised lockfile) → npm (default)
 *
 * The order matters: a project can ship both `package-lock.json` (for example,
 * created when contributors clone with npm) and `yarn.lock` (the file the team
 * actually uses). pnpm / bun win because their lockfile is a stronger signal
 * than the npm / yarn pair; npm wins over yarn because it is the historic
 * fallback and is the default when nothing matches.
 */
export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

/**
 * Lockfile marker for each supported package manager. The runtime check is
 * `fs.existsSync` against `path.join(cwd, file)` — the working directory the
 * CLI was invoked from. The CLI is already cwd-based elsewhere (see
 * `packageInstaller.ts`), so we do not have to walk parents to find the
 * project root.
 */
const PACKAGE_MANAGER_LOCKFILES: Record<PackageManager, string[]> = {
    npm: ['package-lock.json'],
    yarn: ['yarn.lock'],
    pnpm: ['pnpm-lock.yaml'],
    bun: ['bun.lock', 'bun.lockb']
}

/**
 * Priority used by `detectPackageManager`: a package manager earlier in the
 * list always wins when more than one lockfile is present. pnpm / bun are
 * intentionally first so a project that happens to also carry
 * `package-lock.json` resolves to the right manager.
 */
const DETECTION_ORDER: PackageManager[] = ['pnpm', 'bun', 'yarn', 'npm']

/**
 * Look at the lockfiles in the given directory and return the matching
 * package manager. Defaults to the current working directory so callers
 * never have to pass `process.cwd()` explicitly.
 *
 * Detection is cwd-only on purpose: a CLI that walks parents to find a
 * package.json would surprise the user running it from a sub-directory (a
 * sub-package of a monorepo, a CI scratch dir, etc). If the cwd carries no
 * recognised lockfile the detection falls back to npm, mirroring the
 * historic behaviour of the installer before multi-manager support was
 * added.
 */
export const detectPackageManager = (cwd: string = process.cwd()): PackageManager => {
    for (const candidate of DETECTION_ORDER) {
        const lockfiles = PACKAGE_MANAGER_LOCKFILES[candidate]
        if (lockfiles.some((file) => fs.existsSync(path.join(cwd, file)))) return candidate
    }
    return 'npm'
}

export interface PackageManagerCommands {
    /** Fully-qualified install command for a single package as a dev dep, e.g. `npm install foo --save-dev`. */
    installDev: (packageName: string) => string
    /** Fully-qualified install command for a single package as a regular dep, e.g. `npm install foo`. */
    install: (packageName: string) => string
    /** Fully-qualified remove command for a single package, e.g. `npm remove foo`. */
    remove: (packageName: string) => string
    /** Plain install command that uses the lockfile (no package argument), e.g. `npm ci`. */
    installFrozen: string
}

/**
 * Command templates per package manager. Centralised here so both the
 * installer (`packageInstaller.ts`) and the GitHub workflow templates stay
 * in sync — if a flag ever changes (e.g. bun moving away from `-d`) there
 * is exactly one place to update.
 */
export const PACKAGE_MANAGER_COMMANDS: Record<PackageManager, PackageManagerCommands> = {
    npm: {
        installDev: (packageName) => `npm install ${packageName} --save-dev`,
        install: (packageName) => `npm install ${packageName}`,
        remove: (packageName) => `npm remove ${packageName}`,
        installFrozen: 'npm ci'
    },
    yarn: {
        installDev: (packageName) => `yarn add ${packageName} -D`,
        install: (packageName) => `yarn add ${packageName}`,
        remove: (packageName) => `yarn remove ${packageName}`,
        installFrozen: 'yarn install --frozen-lockfile'
    },
    pnpm: {
        installDev: (packageName) => `pnpm add -D ${packageName}`,
        install: (packageName) => `pnpm add ${packageName}`,
        remove: (packageName) => `pnpm remove ${packageName}`,
        installFrozen: 'pnpm install --frozen-lockfile'
    },
    bun: {
        installDev: (packageName) => `bun add -d ${packageName}`,
        install: (packageName) => `bun add ${packageName}`,
        remove: (packageName) => `bun remove ${packageName}`,
        installFrozen: 'bun install --frozen-lockfile'
    }
}

/**
 * Resolve the package manager used by the current project and return the
 * matching command templates. Returned object is intentionally narrow (no
 * raw lockfile data) so callers cannot accidentally depend on the cwd state
 * the detection ran against.
 */
export const getPackageManagerCommands = (
    cwd?: string
): { manager: PackageManager; commands: PackageManagerCommands } => {
    const manager = detectPackageManager(cwd)
    return { manager, commands: PACKAGE_MANAGER_COMMANDS[manager] }
}

/**
 * Label printed by the installer when it makes a package-manager driven
 * decision, e.g. `Detected pnpm-lock.yaml, installing with pnpm`. Kept here
 * rather than in `packageInstaller.ts` so the test suite can assert against
 * one canonical string.
 */
export const lockfileDetectionLabel = (manager: PackageManager): string => {
    switch (manager) {
        case 'npm':
            return 'Detected package-lock.json, installing with npm'
        case 'yarn':
            return 'Detected yarn.lock, installing with yarn'
        case 'pnpm':
            return 'Detected pnpm-lock.yaml, installing with pnpm'
        case 'bun':
            return 'Detected bun.lock, installing with bun'
    }
}
