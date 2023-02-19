// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title MockERC721 - Test
 */

// import "hardhat/console.sol";
import "./utils/console.sol";
import "./utils/stdlib.sol";
import "./utils/test.sol";
import {CheatCodes} from "./utils/cheatcodes.sol";

import { MockERC721 } from "../MockERC721.sol";

contract MockERC721Test is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    MockERC721 private mockERC721;

    string constant _TEST_NAME = "MockERC721";
    string constant _TEST_SYMBOL = 'MOCK';

    function setUp() public {
        // Deploy contracts
        mockERC721 = new MockERC721();
    }

    function test_MockERC721_name() public {
        assertEq(mockERC721.name(), _TEST_NAME);
    }

    function test_MockERC721_symbol() public {
        assertEq(mockERC721.symbol(), _TEST_SYMBOL);
    }
    
    function test_MockERC721_mint(
        address to_, 
        uint256 tokenId_
    ) public {
        vm.assume(to_ != address(0) && to_.code.length == 0);
        vm.assume(tokenId_ > 0);

        assertEq(mockERC721.balanceOf(to_), 0);

        mockERC721.mint(to_, tokenId_);

        assertEq(mockERC721.balanceOf(to_), 1);
        assertEq(mockERC721.ownerOf(tokenId_), to_);
    }

    function test_MockERC721_burn(
        address to_, 
        uint256 tokenId_
    ) public {
        vm.assume(to_ != address(0) && to_.code.length == 0);
        vm.assume(tokenId_ > 0);

        assertEq(mockERC721.balanceOf(to_), 0);

        mockERC721.mint(to_, tokenId_);

        assertEq(mockERC721.balanceOf(to_), 1);
        assertEq(mockERC721.ownerOf(tokenId_), to_);

        vm.prank(to_);

        mockERC721.burn(tokenId_);

        assertEq(mockERC721.balanceOf(to_), 0);
    }
}