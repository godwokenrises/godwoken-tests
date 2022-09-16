// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

error CustomError(string reason);

contract Revertal {
    function revert_null() public pure {
        revert();
    }

    function revert_string(string memory reason) public pure {
        revert(reason);
    }

    function revert_custom_error(string memory reason) public pure {
        revert CustomError({reason: reason});
    }

    function panic() public pure {
        assert(false);
    }

    function arithmetic_overflow() public pure returns(uint256) {
        return type(uint256).max + type(uint256).max;
    }
}
