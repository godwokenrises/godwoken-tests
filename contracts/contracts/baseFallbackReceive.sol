pragma solidity ^0.7.0;

contract baseFallbackReceive {
    fallback() external payable {}

    receive() external payable {}
}
