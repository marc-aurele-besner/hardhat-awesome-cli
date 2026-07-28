import path from 'path'

declare module 'mocha' {
    interface Context {
        // Each fixture's setup function sets this to a minimal HRE-like object
        // the tests need (just `userConfig` for addressBook, just `config.paths`
        // for paths assertions, etc.). See `useAddressBookEnvironment` below.
        env: { userConfig?: any; config?: any; network?: any; tasks?: any }
    }
}

/**
 * Set up the working directory and a minimal env for tests that exercise
 * `AwesomeAddressBook` directly. `resetHardhatContext` from the Hardhat 2
 * `plugins-testing` package no longer exists in Hardhat 3; `network.create()`
 * already produces isolated state, and the address-book tests don't need a
 * real HRE — they only need a `userConfig`.
 */
export function useAddressBookEnvironment(fixtureProjectName: string, userConfig: any) {
    beforeEach('Loading address-book fixture', function () {
        process.chdir(path.join(__dirname, fixtureProjectName))
        this.env = { userConfig }
    })
}

/**
 * Set up the working directory for tests that inspect the resolved Hardhat
 * config (e.g. `paths.cli`).
 */
export function usePathsEnvironment(fixtureProjectName: string) {
    beforeEach('Loading paths fixture', async function () {
        process.chdir(path.join(__dirname, fixtureProjectName))
        const hardhat = await import('hardhat')
        this.env = {
            config: hardhat.config,
            tasks: hardhat.tasks
        }
    })
}