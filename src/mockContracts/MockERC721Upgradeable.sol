// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockERC721Upgradeable
 */

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';

contract MockERC721Upgradeable is ERC721Upgradeable {
    function initialize(string memory name_, string memory symbol_) external initializer {
        __MockERC721Upgradeable_init(name_, symbol_);
    }

    function __MockERC721Upgradeable_init(string memory name_, string memory symbol_) internal onlyInitializing {
        __MockERC721Upgradeable_init_unchained(name_, symbol_);
    }

    function __MockERC721Upgradeable_init_unchained(string memory name_, string memory symbol_)
        internal
        onlyInitializing
    {
        __ERC721_init(name_, symbol_);
    }

    function mint(address _to, uint256 _tokenId) public {
        require(_to != address(0));
        require(_tokenId > 0);
        _mint(_to, _tokenId);
    }

    function burn(uint256 _tokenId) public {
        require(_exists(_tokenId));
        _burn(_tokenId);
    }

    uint256[50] private __gap;
}
