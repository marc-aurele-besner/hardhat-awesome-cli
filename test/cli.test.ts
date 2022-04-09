// tslint:disable-next-line no-implicit-dependencies
import { assert, expect } from "chai"
import path from "path"

import { useEnvironment } from "./helpers"

describe("Integration tests", function () {
  describe("Hardhat CLI task", function () {
    useEnvironment("hardhat-cli")

    it("The task CLI is available", function () {
      assert.equal(this.hre.tasks.cli.name, "cli")
    });
  });

  describe("HardhatConfig extension", function () {
    useEnvironment("hardhat-cli")

    it("The path CLI is injected in paths", function () {
      expect(this.hre.config.paths.cli).to.not.equal(undefined)
    });
  });
});