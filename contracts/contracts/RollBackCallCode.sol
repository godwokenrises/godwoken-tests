pragma solidity ^0.4.24;
contract StateContract{

    uint256 public state = 1;
    function modState() public{
        state++;
    }
    function modStateWithRevert() public {
        state++;
        revert();
    }
}

contract RollBackWithCallCodeContract{

    uint256 public state = 1;

    function getState() public view returns(uint256){
        return state;
    }
    function callCodeWithMethod(string memory methodName) public {
        StateContract sc = new StateContract();
        address(sc).callcode(bytes4(keccak256(abi.encodePacked(methodName))));
    }

}
