import "./SimpleStorage.sol";

pragma solidity >=0.4.0 <0.7.0;

contract CallTest is SimpleStorage {
    function getRevertMsg(uint256 value) public view returns (uint256) {
        require(value != 444, "you trigger death value!");
        require(value != 555, "you trigger crying value!");
        return value;
    }
}
