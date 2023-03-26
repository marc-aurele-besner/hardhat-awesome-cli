import { listAllFunctionSelectors } from './utils'

export class FunctionList {
    private readonly _env: any

    constructor(hre: any) {
        this._env = hre
    }

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
