// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title MockProxyAdmin - Test
 */

import "./utils/console.sol";
import "./utils/stdlib.sol";
import "./utils/test.sol";
import {CheatCodes} from "./utils/cheatcodes.sol";

import { MockProxyAdmin } from "../MockProxyAdmin.sol";
import { MockTransparentUpgradeableProxy } from "../MockTransparentUpgradeableProxy.sol";
import { MockERC20Upgradeable } from "../MockERC20Upgradeable.sol";

contract MockProxyAdminTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    MockProxyAdmin private proxyAdmin;
    MockTransparentUpgradeableProxy private proxy;
    MockERC20Upgradeable private logic;

    function setUp() public {
        proxyAdmin = new MockProxyAdmin();
        logic = new MockERC20Upgradeable();
        proxy = new MockTransparentUpgradeableProxy(address(logic), address(proxyAdmin), "");
    }

    function test_MockProxyAdmin_getProxyAdmin() public {
        assertEq(proxyAdmin.getProxyAdmin(address(proxy)), address(proxyAdmin));
    }

    function test_MockProxyAdmin_getProxyImplementation() public {
        assertEq(proxyAdmin.getProxyImplementation(address(proxy)), address(logic));
    }

    function test_MockProxyAdmin_changeProxyAdmin() public {
        MockProxyAdmin newAdmin = new MockProxyAdmin();
        proxyAdmin.changeProxyAdmin(address(proxy), address(newAdmin));
        assertEq(proxyAdmin.getProxyAdmin(address(proxy)), address(newAdmin));
    }

    function test_MockProxyAdmin_upgrade() public {
        MockERC20Upgradeable newLogic = new MockERC20Upgradeable();
        proxyAdmin.upgrade(address(proxy), address(newLogic));
        assertEq(proxyAdmin.getProxyImplementation(address(proxy)), address(newLogic));
    }

    function test_MockProxyAdmin_upgradeAndCall() public {
        MockERC20Upgradeable newLogic = new MockERC20Upgradeable();

        // initialize(string,string) selector; matches ERC20Upgradeable's
        // __ERC20_init path so the storage variables are populated.
        bytes memory callData = abi.encodeWithSignature("initialize(string,string)", "UpgradedToken", "UPG");

        proxyAdmin.upgradeAndCall(address(proxy), address(newLogic), callData);

        assertEq(proxyAdmin.getProxyImplementation(address(proxy)), address(newLogic));

        // Read the storage-backed values back through the proxy (delegatecall).
        MockERC20Upgradeable proxyAsErc20 = MockERC20Upgradeable(address(proxy));
        assertEq(proxyAsErc20.name(), "UpgradedToken");
        assertEq(proxyAsErc20.symbol(), "UPG");
    }

    function test_MockProxyAdmin_transferOwnership() public {
        address newOwner = address(0xBEEF);
        proxyAdmin.transferOwnership(newOwner);
        assertEq(proxyAdmin.owner(), newOwner);
    }

    function test_MockProxyAdmin_renounceOwnership() public {
        proxyAdmin.renounceOwnership();
        assertEq(proxyAdmin.owner(), address(0));
    }

    function test_MockProxyAdmin_revert_changeProxyAdmin_when_not_owner() public {
        MockProxyAdmin newAdmin = new MockProxyAdmin();
        address attacker = address(0xBAD);

        vm.prank(attacker);
        vm.expectRevert("Ownable: caller is not the owner");
        proxyAdmin.changeProxyAdmin(address(proxy), address(newAdmin));
    }
}