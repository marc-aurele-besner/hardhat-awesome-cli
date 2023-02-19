// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title MockERC1155 - Test
 */

// import "hardhat/console.sol";
import "./utils/console.sol";
import "./utils/stdlib.sol";
import "./utils/test.sol";
import {CheatCodes} from "./utils/cheatcodes.sol";

import { MockERC1155 } from "../MockERC1155.sol";

contract MockERC1155Test is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    MockERC1155 private mockERC1155;

    string constant _TEST_NAME = "MockERC1155";
    string constant _TEST_SYMBOL = 'MOCK';

    function setUp() public {
        // Deploy contracts
        mockERC1155 = new MockERC1155();
    }

    function test_MockERC1155_name() public {
        assertEq(mockERC1155.name(), _TEST_NAME);
    }

    function test_MockERC1155_symbol() public {
        assertEq(mockERC1155.symbol(), _TEST_SYMBOL);
    }
    
    function test_MockERC1155_mint(
        address to_, 
        uint256 tokenId_,
        uint256 amount_
    ) public {
        vm.assume(to_ != address(0) && to_.code.length == 0);
        vm.assume(tokenId_ > 0);
        vm.assume(amount_ > 0);

        assertEq(mockERC1155.balanceOf(to_, tokenId_), 0);

        mockERC1155.mint(to_, tokenId_, amount_);

        assertEq(mockERC1155.balanceOf(to_, tokenId_), amount_);
    }

    function test_MockERC1155_burn(
        address to_, 
        uint256 tokenId_,
        uint256 amount_
    ) public {
        vm.assume(to_ != address(0) && to_.code.length == 0);
        vm.assume(tokenId_ > 0);
        vm.assume(amount_ > 0);

        assertEq(mockERC1155.balanceOf(to_, tokenId_), 0);

        mockERC1155.mint(to_, tokenId_, amount_);

        assertEq(mockERC1155.balanceOf(to_, tokenId_), amount_);

        vm.prank(to_);

        mockERC1155.burn(tokenId_, amount_);

        assertEq(mockERC1155.balanceOf(to_, tokenId_), 0);
    }

    function test_MockERC1155_burnFrom(
        address to_, 
        uint256 tokenId_,
        uint256 amount_
    ) public {
        vm.assume(to_ != address(0) && to_.code.length == 0);
        vm.assume(tokenId_ > 0);
        vm.assume(amount_ > 0);

        assertEq(mockERC1155.balanceOf(to_, tokenId_), 0);

        mockERC1155.mint(to_, tokenId_, amount_);

        assertEq(mockERC1155.balanceOf(to_, tokenId_), amount_);

        mockERC1155.burnFrom(to_, tokenId_, amount_);

        assertEq(mockERC1155.balanceOf(to_, tokenId_), 0);
    }
}