// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockERC721
 */

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract MockERC721 is ERC721 {
    constructor() ERC721('MockERC721', 'MOCK') {}

    function mint(address _to, uint256 _tokenId) public {
        require(_to != address(0));
        require(_tokenId > 0);
        _mint(_to, _tokenId);
    }

    function burn(uint256 _tokenId) public {
        require(_exists(_tokenId));
        _burn(_tokenId);
    }
}
