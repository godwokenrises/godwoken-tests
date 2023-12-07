/**
 * rollback
 *  a rollback is triggered when the eth execution does not meet expectations
 *  the following scenarios trigger a rollback
 *      1. eth_call(https://github.com/ethereum/go-ethereum/blob/master/accounts/abi/bind/backends/simulated.go#L456)
 *      2. EstimateGas(https://github.com/ethereum/go-ethereum/blob/master/accounts/abi/bind/backends/simulated.go#L553)
 *      3. sync failed tx(https://github.com/ethereum/go-ethereum/blob/d30e39b2f833fb75f1e529cd405061fb6b548b8d/miner/worker.go#L830)
 *      4. Call execute(https://github.com/ethereum/go-ethereum/blob/d30e39b2f833fb75f1e529cd405061fb6b548b8d/core/vm/evm.go#L236)
 *      5. callCode execute(https://github.com/ethereum/go-ethereum/blob/d30e39b2f833fb75f1e529cd405061fb6b548b8d/core/vm/evm.go#L289)
 *      6. delegateCall execute(https://github.com/ethereum/go-ethereum/blob/d30e39b2f833fb75f1e529cd405061fb6b548b8d/core/vm/evm.go#L329)
 *      7. staticCall execute(https://github.com/ethereum/go-ethereum/blob/d30e39b2f833fb75f1e529cd405061fb6b548b8d/core/vm/evm.go#L385)
 *      8. create execute(https://github.com/ethereum/go-ethereum/blob/d30e39b2f833fb75f1e529cd405061fb6b548b8d/core/vm/evm.go#L482)
 *
 *  Ref:
 * rollback object
 *  createObjectChange: deploy will create obj
 *  resetObjectChange:  -
 *  suicideChange: self destruct
 *  balanceChange: transfer eth
 *  nonceChange:   deploy contract
 *  codeChange:    deploy contract
 *  refundChange:  self destruct
 *  addLogChange:  event
 *  addPreimageChange: -
 *  touchChange:   empty account
 *  accessListAddAccountChange: -
 *  accessListAddSlotChange:  -
 *
 * Ref: https://github.com/ethereum/go-ethereum/blob/master/core/state/journal.go#L87-L141
 *
 */
const { ethers } = require("hardhat");
const { expect } = require("chai");
const { isGwMainnetV1, isHardhatNetwork } = require("../utils/network")

describe('RollBack', function () {

  // Skip for gw_mainnet_v1 network
  if (isGwMainnetV1()) {
    return;
  }

  let rollBackContract;  // select rollback style contract
  let changeObjContract;// trigger mod rollback object contract


  const CALL_STYLE = 1;
  const DELEGATE_CALL_STYLE = 2;
  const STATIC_CALL_STYLE = 3;
  const CALL_CODE_STYLE = 4;
  const CREATE2_STYLE = 5;
  const SYNC_TX_STYLE = 6;

  const TEST_ROLLBACK_STYLES = [CALL_STYLE, DELEGATE_CALL_STYLE, STATIC_CALL_STYLE, CALL_CODE_STYLE, CREATE2_STYLE, SYNC_TX_STYLE]
  const TEST_ROLLBACK_NAME = {
    1: "CALL_STYLE",
    2: "DELEGATE_CALL_STYLE",
    3: "STATIC_CALL_STYLE",
    4: "CALL_CODE_STYLE",
    5: "CREATE2_STYLE",
    6: "SYNC_TX_STYLE",
  }

  before(async () => {
    const rollBackContractInfo = await ethers.getContractFactory("RollBackTestContract");
    rollBackContract = await rollBackContractInfo.deploy({ value: 50000 });
    await rollBackContract.waitForDeployment();
    const changeObjContractAddress = await rollBackContract.getFunction("changeObjContract").staticCall();
    changeObjContract = await ethers.getContractAt("ChangeObjContract", changeObjContractAddress)
  })

  describe('not trigger rollback', function () {


    for (let i = 0; i < TEST_ROLLBACK_STYLES.length; i++) {
      const test_way = TEST_ROLLBACK_STYLES[i];

      if (test_way === STATIC_CALL_STYLE || test_way === CALL_CODE_STYLE || test_way === SYNC_TX_STYLE) {
        // STATIC_CALL_STYLE: static can't mod state
        // CALL_CODE_STYLE: call code not support for 0.8.0
        // SYNC_TX_STYLE: failed tx trigger rollback
        continue
      }

      it(TEST_ROLLBACK_NAME[TEST_ROLLBACK_STYLES[i]] + "", async () => {

        let prepareData = getPrepareData();

        // getState
        const preState = await changeObjContract.getFunction("getJournals").send(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.deployOpt.isRevert, prepareData.transferOpt.toAddress)

        // send change state tx
        // add gasLimit option: because selfdestruct make gas estimates are low
        const tx = await rollBackContract.getFunction("changeJournal").send(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.transferOpt.toAddress, test_way, { gasLimit: 1000000 })
        const receipt = await tx.wait()

        expect(receipt.logs.length).to.be.gt(0)

        // getState ,should not eq last state
        const afterState = await changeObjContract.getFunction("getJournals").staticCall(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.deployOpt.isRevert, prepareData.transferOpt.toAddress)
        expect(preState.toString()).to.not.equal(afterState.toString());
      })
    }
  });

  describe('trigger rollback ', function () {

    for (let i = 0; i < TEST_ROLLBACK_STYLES.length; i++) {
      const test_way = TEST_ROLLBACK_STYLES[i];
      if (test_way === SYNC_TX_STYLE || test_way === CALL_CODE_STYLE) {
        // SYNC_TX_STYLE: sync tx failed tx : tx.wait() will return throw
        // CALL_CODE_STYLE:0.8.0 not support call_code
        continue;
      }


      it(TEST_ROLLBACK_NAME[TEST_ROLLBACK_STYLES[i]], async () => {

        const prepareData = getPrepareData();

        if (test_way === CREATE2_STYLE) {
          // create2 : run failed ,trigger roll back
          prepareData.deployOpt.isRevert = true;
        }


        // getState
        const preState = await changeObjContract.getFunction("getJournals").staticCall(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.deployOpt.isRevert, prepareData.transferOpt.toAddress)

        // https://github.com/cryptape/acceptance-internal/issues/562
        const txData = {
          newAddress: prepareData.deployOpt.newAddress,
          salt: prepareData.deployOpt.salt,
          toAddress: prepareData.transferOpt.toAddress,
          testWay: test_way
        };

        const estimatedGas = await rollBackContract.getFunction("changeWithRevert").estimateGas(
          txData.newAddress,
          txData.salt,
          txData.toAddress,
          txData.testWay
        );

        const MAX_GAS_LIMIT = 50000000
        let gasLimit;
        if (estimatedGas > MAX_GAS_LIMIT) {
          console.error(`Estimated Gas (${estimatedGas.toString()}) exceeds ${MAX_GAS_LIMIT}`);
          gasLimit = MAX_GAS_LIMIT;
        } else {
          gasLimit = estimatedGas;
        }

        const tx = await rollBackContract.getFunction("changeWithRevert").send(
          txData.newAddress,
          txData.salt,
          txData.toAddress,
          txData.testWay,
          { gasLimit: gasLimit }
        );

        // const tx = await rollBackContract.getFunction("changeWithRevert").send(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.transferOpt.toAddress, test_way)

        const receipt = await tx.wait()

        if (estimatedGas > MAX_GAS_LIMIT) {
          console.log("changeWithRevert gasUsed: ",receipt.gasUsed.toString())
        }

          expect(receipt.logs.length).to.be.equal(0)

        // getState ,should not eq last state
        const afterState = await changeObjContract.getFunction("getJournals").staticCall(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.deployOpt.isRevert, prepareData.transferOpt.toAddress)
        expect(preState.toString()).to.be.equal(afterState.toString());
      })
    }

    it("SYNC_TX_STYLE", async () => {

      if (isHardhatNetwork()) {
        // run  failed tx will revert
        return;
      }
      const prepareData = getPrepareData();

      // getState
      const preState = await changeObjContract.getFunction("getJournals").staticCall(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.deployOpt.isRevert, prepareData.transferOpt.toAddress)

      const tx = await rollBackContract.getFunction("changeWithRevert").send(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.transferOpt.toAddress, SYNC_TX_STYLE, { gasLimit: 1000_000 })

      // failed tx: statue== 0 ,will revert
      await expect(tx.wait()).to.be.rejected

      // getState ,should not eq last state
      const afterState = await changeObjContract.getFunction("getJournals").staticCall(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.deployOpt.isRevert, prepareData.transferOpt.toAddress)
      expect(preState.toString()).to.be.equal(afterState.toString());
    })

    it("eth_call", async () => {
      await test_simulate_call_rollback(changeObjContract, rollBackContract, "callStatic");
    });

    it("esGas", async () => {
      await test_simulate_call_rollback(changeObjContract, rollBackContract, "estimateGas");
    });

    async function test_simulate_call_rollback(changeObjContract, rollBackContract, simulationType) {

      const prepareData = getPrepareData();

      // getState
      const preState = await changeObjContract.getFunction("getJournals").staticCall(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.deployOpt.isRevert, prepareData.transferOpt.toAddress);

      // Using getFunction based on the provided simulationType
      const changeWithRevertFunction = rollBackContract.getFunction("changeWithRevert");

      if (simulationType === "callStatic") {
        await changeWithRevertFunction.staticCall(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.transferOpt.toAddress, CALL_STYLE);
      } else if (simulationType === "estimateGas") {
        await changeWithRevertFunction.estimateGas(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.transferOpt.toAddress, CALL_STYLE);
      } else {
        throw new Error("Invalid simulationType");
      }

      // getState
      const afterState = await changeObjContract.getFunction("getJournals").staticCall(prepareData.deployOpt.newAddress, prepareData.deployOpt.salt, prepareData.deployOpt.isRevert, prepareData.transferOpt.toAddress);

      // eth_call should rollback state change, state should eq pre state
      expect(preState.toString()).to.be.equal(afterState.toString());

    }


    it("call_code", async () => {

      const RollBackWithCallCodeContractInfo = await ethers.getContractFactory("RollBackWithCallCodeContract");
      // deploy
      const rollBackWithCallCodeContract = await RollBackWithCallCodeContractInfo.deploy()
      await rollBackWithCallCodeContract.waitForDeployment()

      const beforeState = await rollBackWithCallCodeContract.getFunction("getState").staticCall();

      const tx = await rollBackWithCallCodeContract.getFunction("callCodeWithMethod").send("modStateWithRevert()");
      await tx.wait()

      const afterState = await rollBackWithCallCodeContract.getFunction("getState").staticCall();
      expect(beforeState).to.be.equal(afterState)
    })

  });


});


function getPrepareData() {
  const randomAddress = genRandomAddress();
  const salt = getRandomInt(1000000000); // random salt -> deploy  contract that address is diffent
  const toAddress = genRandomAddress();
  return {
    deployOpt: {
      newAddress: randomAddress, // random address : trigger createObjectChange
      salt: salt,
      isRevert: false, // create2 run success or run revert (true: trigger create roll back,false:create run successful)
    },
    transferOpt: {
      toAddress: toAddress,
    }
  }
}

function genRandomAddress() {
  return ethers.Wallet.createRandom().address;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
