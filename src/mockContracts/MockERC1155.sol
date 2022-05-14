// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockERC1155
 */

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';

contract MockERC1155 is ERC1155 {
    string internal _name = 'MockERC1155';
    string internal _symbol = 'MOCK';

    constructor() ERC1155('https://google.com') {}

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function mint(
        address _to,
        uint256 _tokenId,
        uint256 _amount
    ) public {
        require(_to != address(0));
        require(_tokenId > 0);
        require(_amount > 0);
        _mint(_to, _tokenId, _amount, '');
    }

    function burn(uint256 _tokenId, uint256 _amount) public {
        _burn(_msgSender(), _tokenId, _amount);
    }
}
