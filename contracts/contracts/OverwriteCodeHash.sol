pragma solidity ^0.8.6;

contract OverwriteCodeHash {
  bytes public codeHash;

  constructor() public payable {
  }

  function storeInner(bytes32 storage_key, bytes32 val) public {
      assembly {
          sstore(storage_key, val)
      }
  }

  function loadInner(bytes32 storage_key) public view returns(bytes32 v) {
      assembly {
          v := sload(storage_key)
      }
  }
}
