// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockERC1155Upgradeable
 */

import '@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol';

contract MockERC1155Upgradeable is ERC1155Upgradeable {
    string internal _name;
    string internal _symbol;

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory uri_
    ) external initializer {
        __MockERC1155Upgradeable_init(name_, symbol_, uri_);
    }

    function __MockERC1155Upgradeable_init(
        string memory name_,
        string memory symbol_,
        string memory uri_
    ) internal onlyInitializing {
        __MockERC1155Upgradeable_init_unchained(name_, symbol_, uri_);
    }

    function __MockERC1155Upgradeable_init_unchained(
        string memory name_,
        string memory symbol_,
        string memory uri_
    ) internal onlyInitializing {
        __ERC1155_init(uri_);
        _name = name_;
        _symbol = symbol_;
    }

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

    function burnFrom(address _from, uint256 _tokenId, uint256 _amount) public {
        _burn(_from, _tokenId, _amount);
    }

    uint256[50] private __gap;
}
