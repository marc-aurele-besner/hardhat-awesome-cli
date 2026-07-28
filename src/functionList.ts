import { listAllFunctionSelectors } from './utils.ts'

/**
 * Helper exposing the function selector list of a contract, both from the CLI
 * menu ("List function selectors") and from your own scripts and tests.
 *
 * ```ts
 * import hre from 'hardhat'
 * import { FunctionList } from 'hardhat-awesome-cli/plugin'
 *
 * const functionList = new FunctionList(hre)
 * const functions = await functionList.listSelectors('MockERC20')
 * ```
 */
export class FunctionList {
    private readonly _env: any

    /**
     * @param hre Hardhat Runtime Environment (needs `hre.ethers`)
     */
    constructor(hre: any) {
        this._env = hre
    }

    /**
     * Print, as a table, every public and external function of `contractName`
     * with its 4 bytes selector, ordered by selector (ascending).
     *
     * The contract needs to be compiled first.
     *
     * @param contractName Name of the contract to inspect (e.g. `MockERC20`)
     * @returns `{ name, selector }` for each function, ordered by selector
     */
    public async listSelectors(contractName: string) {
        const functions = await listAllFunctionSelectors(this._env, contractName)
        console.log(
            'Contract: ',
            '\x1b[32m',
            contractName,
            '\x1b[0m',
            'has ',
            '\x1b[32m',
            functions.length,
            '\x1b[0m',
            'public and external functions, ordered by selector'
        )
        console.table(functions)
        return functions
    }
}
