import { expect } from 'chai'

import { FunctionList } from '../src/functionList'
import { listAllFunctionSelectors } from '../src/utils'

/**
 * Minimal stand-in for the object `hre.ethers.getContractFactory()` returns.
 * Only `interface.fragments` is read by `listAllFunctionSelectors`, so the
 * tests can describe a contract without compiling one.
 */
const buildEnv = (fragments: any[], withEthersV5Utils = false) => ({
    ethers: {
        getContractFactory: async () => ({ interface: { fragments } }),
        utils: withEthersV5Utils
            ? {
                  // Only the first 4 bytes are used, the rest is never read.
                  id: (signature: string) =>
                      signature === 'transfer(address,uint256)'
                          ? '0xa9059cbb2ab09eb219583f4a59a5d0623ade346d962bcd4e46b11da047c9049b'
                          : '0xdd62ed3e90e97b3d417db9c0c7522647811bafca5afc6694f143588d255fdfb4'
              }
            : undefined
    }
})

const transferFragment = {
    type: 'function',
    selector: '0xa9059cbb',
    format: () => 'transfer(address,uint256)'
}

const allowanceFragment = {
    type: 'function',
    selector: '0xdd62ed3e',
    format: () => 'allowance(address,address)'
}

const transferEventFragment = {
    type: 'event',
    format: () => 'Transfer(address,address,uint256)'
}

describe('Integration tests', function () {
    describe('listAllFunctionSelectors()', function () {
        it('returns the name and selector of every function', async function () {
            const functions = await listAllFunctionSelectors(buildEnv([transferFragment]), 'MockERC20')

            expect(functions).to.deep.equal([{ name: 'transfer(address,uint256)', selector: '0xa9059cbb' }])
        })

        it('orders the functions by selector', async function () {
            const functions = await listAllFunctionSelectors(
                buildEnv([allowanceFragment, transferFragment]),
                'MockERC20'
            )

            expect(functions.map((fn) => fn.selector)).to.deep.equal(['0xa9059cbb', '0xdd62ed3e'])
        })

        it('skips fragments that are not functions', async function () {
            const functions = await listAllFunctionSelectors(
                buildEnv([transferFragment, transferEventFragment]),
                'MockERC20'
            )

            expect(functions).to.have.lengthOf(1)
        })

        it('falls back on ethers.utils.id() when the fragment has no selector', async function () {
            const fragments = [
                { type: 'function', format: () => 'transfer(address,uint256)' },
                { type: 'function', format: () => 'allowance(address,address)' }
            ]

            const functions = await listAllFunctionSelectors(buildEnv(fragments, true), 'MockERC20')

            expect(functions).to.deep.equal([
                { name: 'transfer(address,uint256)', selector: '0xa9059cbb' },
                { name: 'allowance(address,address)', selector: '0xdd62ed3e' }
            ])
        })
    })

    describe('FunctionList', function () {
        it('listSelectors() returns the selectors of the contract', async function () {
            const functionList = new FunctionList(buildEnv([transferFragment, allowanceFragment]))

            const functions = await functionList.listSelectors('MockERC20')

            expect(functions).to.deep.equal([
                { name: 'transfer(address,uint256)', selector: '0xa9059cbb' },
                { name: 'allowance(address,address)', selector: '0xdd62ed3e' }
            ])
        })
    })
})
