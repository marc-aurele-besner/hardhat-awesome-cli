// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockERC20
 */

import '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol';

contract MockTransparentUpgradeableProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        address admin_,
        bytes memory _data
    ) TransparentUpgradeableProxy(_logic, admin_, _data) {}
}
