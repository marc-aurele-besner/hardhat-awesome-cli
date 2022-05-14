// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockERC20Upgradeable
 */

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';

contract MockERC20Upgradeable is ERC20Upgradeable {
    function initialize(string memory name_, string memory symbol_) external initializer {
        __MockERC20Upgradeable_init(name_, symbol_);
    }

    function __MockERC20Upgradeable_init(string memory name_, string memory symbol_) internal onlyInitializing {
        __MockERC20Upgradeable_init_unchained(name_, symbol_);
    }

    function __MockERC20Upgradeable_init_unchained(string memory name_, string memory symbol_)
        internal
        onlyInitializing
    {
        __ERC20_init(name_, symbol_);
    }

    function mint(address _to, uint256 _amount) public {
        require(_to != address(0));
        require(_amount > 0);
        _mint(_to, _amount);
    }

    function burn(uint256 _amount) public {
        require(_amount > 0);
        _burn(_msgSender(), _amount);
    }

    uint256[50] private __gap;
}
