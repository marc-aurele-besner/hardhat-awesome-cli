import 'hardhat/types/config'
import 'hardhat/types/runtime'

import { AwesomeAddressBook } from './AwesomeAddressBook'
import { FunctionList } from './functionList'

declare module 'hardhat/types/config' {
    // We extend the UserConfig type, which represents the config as written
    // by the users. Things are normally optional here.
    export interface ProjectPathsUserConfig {
        cli?: string
    }

    // We also extend the Config type, which represents the configuration
    // after it has been resolved. This is the type used during the execution
    // of tasks, tests and scripts.
    // Normally, you don't want things to be optional here. As you can apply
    // default values using the extendConfig function.
    export interface ProjectPathsConfig {
        cli: string
    }
}

declare module 'hardhat/types/runtime' {
    // This new field will be available in tasks' actions, scripts, and tests.
    export interface HardhatRuntimeEnvironment {
        addressBook: AwesomeAddressBook
        functionList: FunctionList
    }
}
