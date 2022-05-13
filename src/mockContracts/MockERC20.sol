// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockERC20
 */

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MockERC20 is ERC20 {
    constructor() ERC20('MockERC20', 'MOCK') {}

    function mint(address _to, uint256 _amount) public {
        require(_to != address(0));
        require(_amount > 0);
        _mint(_to, _amount);
    }

    function burn(uint256 _amount) public {
        require(_amount > 0);
        _burn(_msgSender(), _amount);
    }
}
