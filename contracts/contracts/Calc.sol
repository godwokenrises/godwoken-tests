// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity >=0.7.0 <0.9.0;

contract Calc {
    uint256 number;

    /**
     * @dev Store value in variable
     * @param num value to store
     */
    function store(uint256 num) public {
        number = num;
    }

    /**
     * @dev Return value
     * @return value of 'number'
     */
    function retrieve() public view returns (uint256) {
        return number;
    }

    function add(uint256 x, uint256 y) public view returns (uint256) {
        return x + y;
    }

    function sub(uint256 x, uint256 y) public view returns (uint256) {
        return x - y;
    }
}
