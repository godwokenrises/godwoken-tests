pragma solidity ^0.8;

contract RevertHandling {
    string public message;

    function getMsg() public view returns (string memory) {
        return message;
    }

    function setMsg(uint success, string memory _message) public payable {
        require(success == 1, "failed to set message");
        message = _message;
    }
}
