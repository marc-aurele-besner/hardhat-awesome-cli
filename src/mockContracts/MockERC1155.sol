// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title MockERC1155
 */

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockERC1155 is ERC1155 {
    constructor () ERC1155("https://google.com") {

    }
    
    function mint(address _to, uint256 _tokenId, uint256 _amount) public {
        require(_to != address(0));
        require(_tokenId > 0);
        require(_amount > 0);
        _mint(_to, _tokenId, _amount, "");
    }

    function burn(uint256 _tokenId, uint256 _amount) public {
        _burn(_msgSender(), _tokenId, _amount);
    }
    
    uint256[50] private __gap;
}