// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title MockERC20 - Test
 */

// import "hardhat/console.sol";
import "./utils/console.sol";
import "./utils/stdlib.sol";
import "./utils/test.sol";
import {CheatCodes} from "./utils/cheatcodes.sol";

import { MockERC20 } from "../MockERC20.sol";

contract MockERC20Test is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    MockERC20 private mockERC20;

    string constant _TEST_NAME = "MockERC20";
    string constant _TEST_SYMBOL = 'MOCK';

    function setUp() public {
        // Deploy contracts
        mockERC20 = new MockERC20();
    }

    function test_MockERC20_name() public {
        assertEq(mockERC20.name(), _TEST_NAME);
    }

    function test_MockERC20_symbol() public {
        assertEq(mockERC20.symbol(), _TEST_SYMBOL);
    }
    
    function test_MockERC20_mint(
        address to_, 
        uint256 amount_
    ) public {
        vm.assume(to_ != address(0));
        vm.assume(amount_ > 0);

        assertEq(mockERC20.balanceOf(to_), 0);
        assertEq(mockERC20.totalSupply(), 0);

        mockERC20.mint(to_, amount_);

        assertEq(mockERC20.balanceOf(to_), amount_);
        assertEq(mockERC20.totalSupply(), amount_);
    }

    function test_MockERC20_burn(
        address to_, 
        uint256 amount_
    ) public {
        vm.assume(to_ != address(0));
        vm.assume(amount_ > 0);

        assertEq(mockERC20.balanceOf(to_), 0);
        assertEq(mockERC20.totalSupply(), 0);

        mockERC20.mint(to_, amount_);

        assertEq(mockERC20.balanceOf(to_), amount_);

        vm.prank(to_);

        mockERC20.burn(amount_);

        assertEq(mockERC20.balanceOf(to_), 0);
        assertEq(mockERC20.totalSupply(), 0);
    }
}