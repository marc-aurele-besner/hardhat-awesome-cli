import { defineConfig } from 'hardhat/config'

// The published layout: import the plugin via the subpath exposed in the
// package's `exports` map (`./plugin` → `dist/src/plugin/index.js`).
import hardhatAwesomeCli from 'hardhat-awesome-cli/plugin'

export default defineConfig({
    plugins: [hardhatAwesomeCli],
    paths: {
        cli: 'cli'
    }
})