// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title MockERC20Upgradeable - Test
 */

// import "hardhat/console.sol";
import "./utils/console.sol";
import "./utils/stdlib.sol";
import "./utils/test.sol";
import {CheatCodes} from "./utils/cheatcodes.sol";

import { MockERC20Upgradeable } from "../MockERC20Upgradeable.sol";

contract MockERC20UpgradeableTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    MockERC20Upgradeable private mockERC20Upgradeable;

    string constant _TEST_NAME = "MockERC20Upgradeable";
    string constant _TEST_SYMBOL = 'MOCK';

    function setUp() public {
        // Deploy contracts
        mockERC20Upgradeable = new MockERC20Upgradeable();
        mockERC20Upgradeable.initialize(_TEST_NAME, _TEST_SYMBOL);
    }

    function test_MockERC20Upgradeable_name() public {
        assertEq(mockERC20Upgradeable.name(), _TEST_NAME);
    }

    function test_MockERC20Upgradeable_symbol() public {
        assertEq(mockERC20Upgradeable.symbol(), _TEST_SYMBOL);
    }
    
    function test_MockERC20Upgradeable_mint(
        address to_, 
        uint256 amount_
    ) public {
        vm.assume(to_ != address(0));
        vm.assume(amount_ > 0);

        assertEq(mockERC20Upgradeable.balanceOf(to_), 0);
        assertEq(mockERC20Upgradeable.totalSupply(), 0);

        mockERC20Upgradeable.mint(to_, amount_);

        assertEq(mockERC20Upgradeable.balanceOf(to_), amount_);
        assertEq(mockERC20Upgradeable.totalSupply(), amount_);
    }

    function test_MockERC20Upgradeable_burn(
        address to_, 
        uint256 amount_
    ) public {
        vm.assume(to_ != address(0));
        vm.assume(amount_ > 0);

        assertEq(mockERC20Upgradeable.balanceOf(to_), 0);
        assertEq(mockERC20Upgradeable.totalSupply(), 0);

        mockERC20Upgradeable.mint(to_, amount_);

        assertEq(mockERC20Upgradeable.balanceOf(to_), amount_);

        vm.prank(to_);

        mockERC20Upgradeable.burn(amount_);

        assertEq(mockERC20Upgradeable.balanceOf(to_), 0);
        assertEq(mockERC20Upgradeable.totalSupply(), 0);
    }
}