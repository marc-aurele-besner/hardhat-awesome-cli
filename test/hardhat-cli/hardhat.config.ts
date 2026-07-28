import { defineConfig } from 'hardhat/config'

import hardhatAwesomeCli from '../../src/plugin/index.js'

export default defineConfig({
    plugins: [hardhatAwesomeCli],
    paths: {
        cli: 'cli'
    }
})