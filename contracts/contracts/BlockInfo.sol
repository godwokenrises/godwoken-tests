pragma solidity ^0.8.4;

contract BlockInfo {

    event BlockEvt(
        uint256 number,
        bytes32 hash
    );

    event PreviousBlockEvt(
        uint256 number,
        bytes32 hash
    );

    function getCurrentBlockNumber() public view returns (uint256) {
        return block.number;
    }

    function getBlockNumber() public view returns (uint256) {
        return block.number - 1;
    }

    function getBlockHash(uint256 number) public view returns (bytes32) {
        return blockhash(number);
    }

    function executeCurrentBlockHash() public {
        emit BlockEvt(block.number, blockhash(block.number));
    }

    function getBlockTimestamp() public view returns (uint256) {
        return block.timestamp;
    }

    function getBlockDifficulty() public view returns (uint256) {
        return block.difficulty;
    }

    function getBlockCoinbase() public view returns (address) {
        return block.coinbase;
    }

    function getChainId() public view returns (uint256 chainId_) {
        assembly {
            chainId_ := chainid()
        }
    }

    function executePreviousBlockHash() public {
        emit PreviousBlockEvt(block.number - 1, blockhash(block.number - 1));
    }
}
