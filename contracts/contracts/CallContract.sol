pragma solidity >=0.4.0 <0.7.0;

interface SimpleStorage {
  function set(uint x) external;
}

contract CallerContract {
  address public ss;
  constructor(address _ss) public payable {
    ss = _ss;
  }

  function proxySet(uint x) public {
    SimpleStorage target = SimpleStorage(ss);
    target.set(x+3);
  }

  /// @notice Explain to an end user what this does
  /// @dev Explain to a developer any extra details
  /// @param Documents a parameter just like in doxygen (must be followed by parameter name)
  /// @return Documents the return variables of a contract’s function state variable
  /// @inheritdoc	Copies all missing tags from the base function (must be followed by the contract name)
//   function recursiveCall(depth) public {

//   }

}
