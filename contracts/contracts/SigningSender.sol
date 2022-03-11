pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Signing {
    using ECDSA for bytes32;

    function recover(bytes32 hash, bytes calldata signature)
        public
        pure
        returns (address)
    {
        return hash.toEthSignedMessageHash().recover(signature);
    }
}

library LSender {
    function getLSender(CSender c) internal view returns (address) {
        return msg.sender;
    }

    function getLOrigin(CSender c) internal view returns (address) {
        return tx.origin;
    }
}

contract CSender {
    function getCSender() public view returns (address) {
        return msg.sender;
    }

    function getCOrigin() public view returns (address) {
        return tx.origin;
    }
}

contract SigningSender is Signing {

    using LSender for CSender;
    CSender public immutable cSender;

    constructor() {
        cSender = new CSender();
    }

    function getCurrentSender() public view returns (address) {
        return msg.sender;
    }

    function getCurrentOrigin() public view returns (address) {
        return tx.origin;
    }

    function getContractSender() public view returns (address) {
        return cSender.getCSender();
    }

    function getContractOrigin() public view returns (address) {
        return cSender.getCOrigin();
    }

    function getLibrarySender() public view returns (address) {
        return cSender.getLSender();
    }

    function getLibraryOrigin() public view returns (address) {
        return cSender.getLOrigin();
    }
}