import { defineConfig } from 'hardhat/config'

// `.ts` extension on the source path because Hardhat's config loader does not
// rewrite `.js` suffixes to `.ts` (and we don't pre-build before tests).
import hardhatAwesomeCli from '../../src/plugin/index.ts'

export default defineConfig({
    plugins: [hardhatAwesomeCli],
    paths: {
        cli: 'cli'
    }
})
