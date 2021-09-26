// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract testERC20 is ERC20("testERC20","testERC20") {
	constructor() {
      // _mint(msg.sender, type(uint256).max);
      _mint(msg.sender, 10000);
   }
}