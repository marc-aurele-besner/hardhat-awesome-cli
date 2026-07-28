import { expect } from 'chai'

import { buildNetworkSelectorChoices } from '../src/buildNetworks.ts'
import { DefaultChainList } from '../src/config.ts'
import type { IChain } from '../src/types.ts'

const findChain = (chainName: string): IChain => {
    const chain = DefaultChainList.find((entry: IChain) => entry.chainName === chainName)
    if (!chain) throw new Error(`Test fixture missing default chain "${chainName}"`)
    return chain
}

describe('buildNetworkSelectorChoices', function () {
    it('Re-injects the hardhat local network when it was not selected in the activated list', function () {
        const activatedChainList = [findChain('ethereum')]
        const { chains, names } = buildNetworkSelectorChoices(activatedChainList, false)
        expect(names).to.include('Hardhat (Temporary instance)')
        expect(names).to.include('Ethereum - Mainnet')
        // Bug from issue #32: hardhat used to disappear when the user only
        // selected mainnet / testnet chains.
        expect(chains.some((chain: IChain) => chain.chainName === 'hardhat')).to.equal(true)
    })

    it('Does not duplicate hardhat when it is already in the activated list', function () {
        const activatedChainList = [findChain('hardhat'), findChain('ethereum')]
        const { chains } = buildNetworkSelectorChoices(activatedChainList, false)
        const hardhatCount = chains.filter((chain: IChain) => chain.chainName === 'hardhat').length
        expect(hardhatCount).to.equal(1)
    })

    it('Filters hardhat out when noLocalNetwork is set (RPC/accounts editor)', function () {
        const activatedChainList = [findChain('hardhat'), findChain('ethereum')]
        const { chains, names } = buildNetworkSelectorChoices(activatedChainList, true)
        expect(names).to.not.include('Hardhat (Temporary instance)')
        expect(names).to.include('Ethereum - Mainnet')
        expect(chains.every((chain: IChain) => chain.chainName !== 'hardhat')).to.equal(true)
    })

    it('Falls back to hardhat + localhost when no chains are activated at all', function () {
        const { chains, names } = buildNetworkSelectorChoices([], false)
        expect(names).to.include('Hardhat (Temporary instance)')
        expect(names).to.include('Hardhat (Localhost node)')
        expect(chains.length).to.equal(2)
    })

    it('Keeps hardhat as the first choice when it has to be re-injected', function () {
        const activatedChainList = [findChain('ethereum'), findChain('polygon')]
        const { chains } = buildNetworkSelectorChoices(activatedChainList, false)
        expect(chains[0].chainName).to.equal('hardhat')
    })

    it('Preserves the names list aligned with the chains list', function () {
        const activatedChainList = [findChain('ethereum'), findChain('polygon')]
        const { chains, names } = buildNetworkSelectorChoices(activatedChainList, false)
        expect(names.length).to.equal(chains.length)
        chains.forEach((chain: IChain, index: number) => {
            expect(names[index]).to.equal(chain.name)
        })
    })
})
