// tslint:disable-next-line no-implicit-dependencies
import { assert, expect } from "chai"
import fs from 'fs'
import path from "path"

import { useEnvironment } from "./helpers";

describe("Integration tests", function () {
  describe("AwesomeAddressBook", function () {
    useEnvironment("hardhat-cli")

    it("saveContract()", function () {
      expect(this.hre.addressBook.saveContract('MockERC20', '0x0000000000000000000000000000000000000000', 'hardhat', '0x0000000000000000000000000000000000000000')).to.be.equal(undefined)
    });

    it("retrieveContract()", function () {
      expect(this.hre.addressBook.retrieveContract('MockERC20', 'hardhat')).to.be.equal('0x0000000000000000000000000000000000000000')
    });

    it("contractsAddressDeployed.json exist", function () {
      expect(fs.existsSync('contractsAddressDeployed.json')).to.be.equal(true)
    });

    it("contractsAddressDeployedHistory.json exist", function () {
      expect(fs.existsSync('contractsAddressDeployedHistory.json')).to.be.equal(true)
    });

    it("Delete contractsAddressDeployed.json from previous tests", function () {
      expect(fs.unlinkSync('contractsAddressDeployed.json')).to.be.equal(undefined)
      expect(fs.existsSync('contractsAddressDeployed.json')).to.be.equal(false)
    });

    it("Delete contractsAddressDeployedHistory.json from previous tests", function () {
      expect(fs.unlinkSync('contractsAddressDeployedHistory.json')).to.be.equal(undefined)
      expect(fs.existsSync('contractsAddressDeployedHistory.json')).to.be.equal(false)
    });
  });
});