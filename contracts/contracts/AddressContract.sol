pragma solidity ^0.8.6;

//type(C).name (string): the name of the contract
//type(C).creationCode (bytes memory): creation bytecode of the given contract, see Type Information.
//type(C).runtimeCode (bytes memory): runtime bytecode of the given contract, see Type Information.
contract AddressContract{

    uint256 public  latestBalance;
    address public latestAddress;
    bytes public latestCode;
    uint256 public latestCodeLength;
    bytes32 public latestCodeHash;

    struct AddressMsg{
        uint256 latestBalance;
        address latestAddress;
        bytes latestCode;
        uint256 latestCodeLength;
        bytes32 latestCodeHash;
    }

    AddressMsg public addrMsg;
    event updateAddressEvent(uint256 idx, AddressMsg msg);

    constructor() public payable {
        latestBalance = address(this).balance;
        latestAddress = address(this);
        latestCode = address(this).code;
        latestCodeLength = address(this).code.length;
        latestCodeHash = address(this).codehash;
        addrMsg = AddressMsg(
            latestBalance,
            latestAddress,
            latestCode,
            latestCodeLength,
            latestCodeHash
        );
        emit updateAddressEvent(1, addrMsg);
    }

    function getCodehash() public view returns(bytes32) {
        return address(this).codehash;
    }

    function getCode() public view returns(bytes memory) {
        return address(this).code;
    }

    function setAddressMsg() public {
        (latestAddress,latestBalance,latestCode,latestCodeLength,latestCodeHash) = opcodeWithAddress();
        addrMsg.latestBalance = latestBalance;
        addrMsg.latestAddress = latestAddress;
        addrMsg.latestCode = latestCode;
        addrMsg.latestCodeLength = latestCodeLength;
        addrMsg.latestCodeHash = latestCodeHash;
        emit updateAddressEvent(1,addrMsg);
    }

    function opcodeWithAddress() public view returns(address, uint256, bytes memory, uint256, bytes32){
        return (
            address(this),
            address(this).balance,
            address(this).code,
            address(this).code.length,
            address(this).codehash
        );
    }

    function getOtherAddress(address addr) public view returns(address, uint256, bytes memory, uint256, bytes32) {
        return (addr, addr.balance, addr.code, addr.code.length, addr.codehash);
    }

    function getOtherAddr(address addr) public view returns (address) {
        return addr;
    }

    function getOtherAddressBalance(address addr) public view returns (uint256) {
        return addr.balance;
    }

    function getLatestDataWithAddress() public view returns(address, uint256, bytes memory, uint256, bytes32) {
        return (latestAddress,latestBalance,latestCode,latestCodeLength,latestCodeHash);
    }
}