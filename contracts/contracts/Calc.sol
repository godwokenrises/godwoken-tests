// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.7.0;

contract Calc {
    address public owner;

    function add(uint256 x, uint256 y) public returns (uint256) {
        return x + y;
    }

    function sub(uint256 x, uint256 y) public returns (uint256) {
        return x - y;
    }
}
