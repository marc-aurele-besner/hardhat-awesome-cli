// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title MockTransparentUpgradeableProxy - Test
 */

import "./utils/console.sol";
import "./utils/stdlib.sol";
import "./utils/test.sol";
import {CheatCodes} from "./utils/cheatcodes.sol";

import { MockProxyAdmin } from "../MockProxyAdmin.sol";
import { MockTransparentUpgradeableProxy } from "../MockTransparentUpgradeableProxy.sol";
import { MockERC20Upgradeable } from "../MockERC20Upgradeable.sol";

contract MockTransparentUpgradeableProxyTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    MockProxyAdmin private proxyAdmin;
    MockTransparentUpgradeableProxy private proxy;
    MockERC20Upgradeable private logic;

    function setUp() public {
        proxyAdmin = new MockProxyAdmin();
        logic = new MockERC20Upgradeable();
        proxy = new MockTransparentUpgradeableProxy(address(logic), address(proxyAdmin), "");
    }

    function test_TransparentProxy_delegatesCallsToLogic() public {
        // Read through the proxy address: the transparent proxy must
        // delegatecall into the logic and surface its storage-backed
        // name(). Since `initialize` was never called in setUp(), the
        // value falls back to the empty string.
        MockERC20Upgradeable proxyAsErc20 = MockERC20Upgradeable(address(proxy));
        assertEq(proxyAsErc20.name(), "");
    }

    function test_TransparentProxy_adminCanUpgradeImplementation() public {
        MockERC20Upgradeable newLogic = new MockERC20Upgradeable();
        proxyAdmin.upgrade(address(proxy), address(newLogic));
        assertEq(proxyAdmin.getProxyImplementation(address(proxy)), address(newLogic));
    }

    function test_TransparentProxy_adminCanChangeAdmin() public {
        MockProxyAdmin newAdmin = new MockProxyAdmin();
        proxyAdmin.changeProxyAdmin(address(proxy), address(newAdmin));
        assertEq(proxyAdmin.getProxyAdmin(address(proxy)), address(newAdmin));
    }

    function test_TransparentProxy_adminCanUpgradeAndCall() public {
        MockERC20Upgradeable newLogic = new MockERC20Upgradeable();

        bytes memory callData = abi.encodeWithSignature("initialize(string,string)", "V2Token", "V2");

        proxyAdmin.upgradeAndCall(address(proxy), address(newLogic), callData);

        assertEq(proxyAdmin.getProxyImplementation(address(proxy)), address(newLogic));

        MockERC20Upgradeable proxyAsErc20 = MockERC20Upgradeable(address(proxy));
        assertEq(proxyAsErc20.name(), "V2Token");
        assertEq(proxyAsErc20.symbol(), "V2");
    }

    function test_TransparentProxy_rejectsAdminCallFromNonAdminCaller() public {
        // The transparent proxy shields admin functions: when a non-admin
        // address tries to call `upgrade` on the proxy itself, the call
        // must revert.
        MockProxyAdmin proxyAsAdmin = MockProxyAdmin(address(proxy));
        MockERC20Upgradeable newLogic = new MockERC20Upgradeable();

        address attacker = address(0xBAD);
        vm.prank(attacker);
        vm.expectRevert("TransparentUpgradeableProxy: admin cannot fallback to proxy target");
        proxyAsAdmin.upgrade(address(proxy), address(newLogic));
    }
}