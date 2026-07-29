import { defineConfig } from 'hardhat/config'
import hardhatAwesomeCli from 'hardhat-awesome-cli/plugin'

export default defineConfig({
    plugins: [hardhatAwesomeCli],
    solidity: '0.8.28'
})
