// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RevertTest {
    function test() public pure {
        require(false, "RevertTest: reverted as expected");
    }
}
