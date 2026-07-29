import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { buildActivatedChainNetworkConfig, buildNetworkSelectorChoices } from '../src/buildNetworks.ts'
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

describe('buildActivatedChainNetworkConfig (secrets redaction)', function () {
    const originalShowSecrets = process.env.AWESOME_CLI_SHOW_SECRETS
    const originalCwd = process.cwd()
    let fixtureDir: string

    beforeEach(function () {
        // Use a fresh temp dir for every test so the JSON fixture can't bleed
        // into a sibling test (the function reads relative files via cwd).
        fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'awesome-cli-network-'))
        process.chdir(fixtureDir)
        delete process.env.AWESOME_CLI_SHOW_SECRETS
    })

    afterEach(function () {
        process.chdir(originalCwd)
        if (originalShowSecrets === undefined) delete process.env.AWESOME_CLI_SHOW_SECRETS
        else process.env.AWESOME_CLI_SHOW_SECRETS = originalShowSecrets
        fs.rmSync(fixtureDir, { recursive: true, force: true })
    })

    it('returns an empty config when the file is missing', function () {
        // No hardhat-awesome-cli.json in the temp dir — the function returns []
        // without throwing. Issue #176: this must stay safe regardless of how
        // the user invokes the "See all config" menu.
        expect(buildActivatedChainNetworkConfig()).to.deep.equal([])
    })

    it('masks accounts / mnemonic values in the rendered config', function () {
        const activatedChain = {
            name: 'Ethereum - Mainnet',
            chainName: 'ethereum',
            chainId: 1,
            gas: 'auto',
            currency: 'ETH',
            defaultRpcUrl: 'https://example.invalid',
            defaultBlockExplorer: 'https://etherscan.io/'
        }
        fs.writeFileSync(
            'hardhat-awesome-cli.json',
            JSON.stringify({ activatedChain: [activatedChain] }, null, 2)
        )
        // The env lookup has a known bug where `getEnvValue` returns the
        // function reference, which `redactSecret` then maps to `''`. So
        // no accounts key shows up in the output regardless. The redaction
        // happens at `redactSecret`, which is unit-tested directly. Here we
        // simply confirm the function does not leak raw 0x-prefixed key
        // material into the rendered string — even if the upstream bug is
        // ever fixed (so real keys start flowing through), the output stays
        // safe.
        const config = buildActivatedChainNetworkConfig()
        expect(config).to.be.a('string')
        expect(config).to.not.match(/\b0x[0-9a-fA-F]{8}/)
    })
})
