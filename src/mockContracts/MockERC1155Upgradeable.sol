// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title MockERC1155Upgradeable
 */

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

contract MockERC1155Upgradeable is ERC1155Upgradeable {
    
    function initialize(string memory uri_) external initializer {
        __MockERC1155Upgradeable_init(uri_);
    }

    function __MockERC1155Upgradeable_init(string memory uri_) internal onlyInitializing {
        __MockERC1155Upgradeable_init_unchained(uri_);
    }

    function __MockERC1155Upgradeable_init_unchained(string memory uri_) internal onlyInitializing {
        __ERC1155_init(uri_);
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