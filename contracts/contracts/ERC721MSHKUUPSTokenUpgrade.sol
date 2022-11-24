// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "./ERC721MSHKUUPSToken.sol";

// Upgrade ERC721MSHKUPSToken
contract ERC721MSHKUUPSTokenV2 is ERC721MSHKUUPSToken {

    ///@dev increments the slices when called
    function Decrement() external {
        uint256 value = _tokenIdCounter;
        require(value > 0, "Counter: decrement overflow");
    unchecked {
        _tokenIdCounter = value - 1;
    }
    }

    ///@dev returns the contract version
    function MSHKVersion() external pure returns (uint256) {
        return 2;
    }
}
