// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";

import "../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.8.0",
  defaultNetwork: "hardhat",
  paths: {
    cli: "cli",
  },
};

export default config;