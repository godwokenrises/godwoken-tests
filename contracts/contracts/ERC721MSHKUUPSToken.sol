// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Open Zeppelin libraries for controlling upgradability and access.
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


// Create a contract that can be upgraded
contract ERC721MSHKUUPSToken is
Initializable,
ERC721Upgradeable,
UUPSUpgradeable,
OwnableUpgradeable
{
    uint256 public _tokenIdCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    // The scalable contract should have an initialize method instead of the constructor, and the initializer keyword ensures that the contract is initialized only once
    function initialize() public initializer {

        __ERC721_init("MSHK ERC721 UUPS Token", "MSHKUUPS");

        ///@dev as there is no constructor, we need to initialise the OwnableUpgradeable explicitly
        __Ownable_init();

        __UUPSUpgradeable_init();

        // Send 1000 tokens with 18 decimal places to the contract creator
        _mint(msg.sender, 1000 * 10 ** 18);
    }

    // This method is needed to prevent unauthorized upgrades, because in the UUPS mode, the upgrade is completed from the implementation contract, while in the transparent proxy mode, the upgrade is completed through the proxy contract
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // Count+1
    function Increment() external  {
    unchecked {
        _tokenIdCounter += 1;
    }
    }

}
