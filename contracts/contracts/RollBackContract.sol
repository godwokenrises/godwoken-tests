// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ChangeObjContract {

    // uint256  CREATE_OBJECT_CHANGE = 11; // deploy
    // uint256 public RESET_OBJECT_CHANGE = 12;  // ?
    // uint256 public SUICIDE_CHANGE = 13;       // self destruct
    // uint256 public BALANCE_CHANGE = 14;       // transfer eth
    // uint256 public NONCE_CHANGE = 15;         // deploy
    // uint256 public STORAGE_CHANGE = 16;       // storage modify
    // uint256 public CODE_CHANGE = 17;          // deploy
    // uint256 public REFUND_CHANGE = 18;        // self destruct
    // uint256 public ADD_LOG_CHANGE = 19;       // event
    // uint256 public addPreimageChange = 191;   //
    // uint256 public TOUCH_CHANGE = 192;        //

    uint256 public storage_state = 1;
    FactoryAssembly public f;

    constructor()payable {
        f = new FactoryAssembly();
    }
    struct DeployOpt {
        address newAddress;
        uint salt;
        bool isRevert;
    }

    struct DeployChangeState {
        address demoAddress;
        uint256 demoContractBalance;
        bytes32 demoContractCodeHash;
        address contract1Address;
        uint256 contract1Balance;
        bytes32 contract1CodeHash;
        uint256 toBalance;
    }

    function getFactoryAssemblyAddress() public view returns (address){
        return address(f);
    }

    function changeJournalArgs(address newAddress, uint salt, bool isRevert, address _to) public {
        changeJournal(DeployOpt(newAddress, salt, isRevert), _to);
    }

    function changeJournal(DeployOpt memory deployOpt, address _to) public {
        eventToChangeJournal();
        modStorageStateToChangeJournal();
        transferToChangeJournal(_to);
        deployToChangeJournal(deployOpt.newAddress, deployOpt.salt, deployOpt.isRevert);

    }

    function changeJournalWithRevert(address newAddress, uint salt, bool isRevert, address _to) public {
        changeJournalArgs(newAddress, salt, isRevert, _to);
        revert("false");
    }

    function getJournals(address newAddress, uint salt, bool isRevert, address _to) public view returns (DeployChangeState memory, uint256, uint256) {
        return (getDeployContractsJournal(newAddress, salt, isRevert),
        getTransferObjBalance(_to),
        getStorageState());
    }

    function deployToChangeJournal(address newAddress, uint salt, bool isRevert) public returns (address){
        bytes memory code = f.getDemoBytecode(newAddress, salt, isRevert);
        return f.deploy{value : address(this).balance / 100}(code, salt);
    }


    function getDeployContractsJournal(address newAddress, uint salt, bool isRevert) public view returns (DeployChangeState memory){
        address demoContractAddress = f.getDemoAddress(newAddress, salt, isRevert);
        address contract1Address = f.getContract1Address(salt);
        uint256 newAddressBalance = newAddress.balance;
        (uint256 demoBalance,bytes32 demoCodeHash) = getContractAccountMsg(demoContractAddress);
        (uint256 c1Balance,bytes32 c1CodeHash) = getContractAccountMsg(contract1Address);
        return DeployChangeState(demoContractAddress, demoBalance, demoCodeHash, contract1Address, c1Balance, c1CodeHash, newAddressBalance);
    }

    function getContractAccountMsg(address contractAddress) public view returns (uint256, bytes32){
        return (contractAddress.balance, getContractHash(contractAddress));
    }

    function getContractHash(address a) public view returns (bytes32 hash) {
        assembly {
            hash := extcodehash(a)
        }
    }

    function transferToChangeJournal(address _to) public payable {
        payable(_to).transfer(address(this).balance / 1000);
    }

    function getTransferObjBalance(address _to) public view returns (uint256) {
        return _to.balance;
    }


    function modStorageStateToChangeJournal() public {
        storage_state++;
    }

    function getStorageState() public view returns (uint256){
        return storage_state;
    }


    event changeEvent(uint256);

    function eventToChangeJournal() public {
        emit changeEvent(1);
    }

}


contract RollBackTestContract {

    // delegate call changeObjContract will mod storage_state ,and need f to deploy contract
    uint256 public storage_state = 1;
    FactoryAssembly public f;

    // will cause roll back style
    uint256 public CALL_STYLE = 1;
    uint256 public DELEGATE_CALL_STYLE = 2;
    uint256 public STATIC_CALL_STYLE = 3;
    uint256 public CALL_CODE_STYLE = 4;
    uint256 public CREATE2_ROLL_BACK = 5;
    uint256 public SYNC_TX_STYLE = 6;

    ChangeObjContract public  changeObjContract;

    constructor() payable{
        changeObjContract = new ChangeObjContract{value : msg.value / 2}();
        f = FactoryAssembly(changeObjContract.getFactoryAssemblyAddress());
    }


    function changeWithRevert(address newAddress, uint salt, address _to, uint256 rollback_style) public {
        if (rollback_style == SYNC_TX_STYLE) {
            changeObjContract.changeJournalWithRevert(newAddress, salt, false, _to);
            return;
        }
        if (rollback_style == CALL_STYLE) {
            (bool successed,) = address(changeObjContract).call(abi.encodeWithSignature("changeJournalWithRevert(address,uint256,bool,address)", newAddress, salt, false, _to));
            require(!successed, "call should success");
            return;
        }
        if (rollback_style == DELEGATE_CALL_STYLE) {
            (bool successed,) = address(changeObjContract).delegatecall(abi.encodeWithSignature("changeJournalWithRevert(address,uint256,bool,address)", newAddress, salt, false, _to));
            require(!successed, "delegatecall should success");
            return;
        }
        if (rollback_style == STATIC_CALL_STYLE) {
            (bool successed,) = address(changeObjContract).staticcall(abi.encodeWithSignature("changeJournalWithRevert(address,uint256,bool,address)", newAddress, salt, false, _to));
            require(!successed, "delegatecall should success");
            return;
        }

        if (rollback_style == CALL_CODE_STYLE) {
            // 0.8.0 not support call code
            return;
        }
        if (rollback_style == CREATE2_ROLL_BACK) {
            changeObjContract.deployToChangeJournal(newAddress, salt, true);
            return;
        }
    }

    function changeJournal(address newAddress, uint salt, address _to, uint256 rollback_style) public {
        if (rollback_style == SYNC_TX_STYLE) {
            changeObjContract.changeJournalArgs(newAddress, salt, false, _to);
            return;
        }
        if (rollback_style == DELEGATE_CALL_STYLE) {
            (bool successed,) = address(changeObjContract).delegatecall(abi.encodeWithSignature("changeJournalArgs(address,uint256,bool,address)", newAddress, salt, false, _to));
            require(successed, "delegatecall should success ");
            return;
        }
        if (rollback_style == CALL_STYLE) {
            (bool successed,) = address(changeObjContract).call(abi.encodeWithSignature("changeJournalArgs(address,uint256,bool,address)", newAddress, salt, false, _to));
            require(successed, "call should success ");
            return;
        }

        if (rollback_style == STATIC_CALL_STYLE) {
            (bool successed,) = address(changeObjContract).staticcall(abi.encodeWithSignature("changeJournalArgs(address,uint256,bool,address)", newAddress, salt, false, _to));
            require(!successed, "staticcall should failed ");
            return;
        }

        if (rollback_style == CREATE2_ROLL_BACK) {
            changeObjContract.deployToChangeJournal(newAddress, salt, false);
            return;
        }


    }


}

contract FactoryAssembly {
    event Deployed(address addr, uint salt);

    function getDemoBytecode(address newAddress, uint salt, bool isRevert) public pure returns (bytes memory) {
        bytes memory bytecode = type(DemoContract).creationCode;
        return abi.encodePacked(bytecode, abi.encode(newAddress, salt, isRevert));
    }

    function getContract1Address(uint256 _salt) public view returns (address){
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(type(Contract1).creationCode))
        );

        return address(uint160(uint(hash)));
    }

    function getDemoAddress(address newAddress, uint salt, bool isRevert) public view returns (address){
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(getDemoBytecode(newAddress, salt, isRevert)))
        );
        return address(uint160(uint(hash)));
    }


    // 2. Compute the address of the contract to be deployed
    // NOTE: _salt is a random number used to create an address
    function getAddress(bytes memory bytecode, uint _salt)
    public
    view
    returns (address)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        // NOTE: cast last 20 bytes of hash to address
        return address(uint160(uint(hash)));
    }

    // 3. Deploy the contract
    // NOTE:
    // Check the event log Deployed which contains the address of the deployed TestContract.
    // The address in the log should equal the address computed from above.
    function deploy(bytes memory bytecode, uint _salt) public payable returns (address){
        address addr;

        /*
        NOTE: How to call create2

        create2(v, p, n, s)
        create new contract with code at memory p to p + n
        and send v wei
        and return the new address
        where new address = first 20 bytes of keccak256(0xff + address(this) + s + keccak256(mem[p…(p+n)))
              s = big-endian 256-bit value
        */


        assembly {
            addr := create2(
            callvalue(), // wei sent with current call
            // Actual code starts after skipping the first 32 bytes
            add(bytecode, 0x20),
            mload(bytecode), // Load the size of code contained in the first 32 bytes
            _salt // Salt from function arguments
            )
        }

        // deploy failed not revert
        //        assembly{
        //            if iszero(extcodesize(addr)) {
        //                revert(0, 0)
        //            }
        //        }

        emit Deployed(addr, _salt);
        return addr;
    }
}

contract DemoContract {

    uint256 public state = 1;

    event DemoEvent(uint256);


    constructor(address newAddress, uint256 _salt, bool isRevert) payable {
        // add log
        emit DemoEvent(1);

        // state change
        state = 2;
        // createObject change
        //

        create2WithDestrcut(_salt);
        payable(newAddress).transfer(msg.value / 2);

        if (isRevert) {
            revert("false");
        }
    }

    function create2WithDestrcut(uint _salt) public {
        bytes memory bytecode = type(Contract1).creationCode;
        address addr = deploy(bytecode, _salt);
        Contract1 c1 = Contract1(addr);
        c1.destructAccount();
    }



    // create2:
    function deploy(bytes memory bytecode, uint256 _salt) public payable returns (address){
        address addr;

        assembly {
            addr := create2(
            callvalue(), // wei sent with current call, // wei sent with current call
            // Actual code starts after skipping the first 32 bytes
            add(bytecode, 0x20),
            mload(bytecode), // Load the size of code contained in the first 32 bytes
            _salt // Salt from function arguments
            )
        }

        // deploy failed not revert

        assembly{
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }

        return addr;
    }

}

contract Contract1 {
    constructor() payable{}

    function destructAccount() public {
        selfdestruct(payable(msg.sender));
    }
}
