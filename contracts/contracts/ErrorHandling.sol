pragma solidity ^0.8;

contract ErrorHandling {

    function getRevertMsg(uint value) public view returns (uint) {
        require(value != 444, "you trigger death value!");
        require(value != 555, "you trigger crying value!");
        return value;
    }
}