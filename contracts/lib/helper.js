const { utils } = require("@ckb-lumos/base");

const u32ToLittleEnd = function (value) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return `0x${buf.toString("hex")}`;
};

const getAccountIdByContractAddress = async function (rpc, contractAddress) {
  const nodeInfo = (await rpc.poly_version()).nodeInfo;
  const polyjuiceValidatorCodeHash =
    nodeInfo.backends.polyjuice.validatorScriptTypeHash;
  const rollupTypeHash = nodeInfo.rollupCell.typeHash;
  const creator_account_id = nodeInfo.accounts.polyjuiceCreator.id;

  const script = {
    code_hash: polyjuiceValidatorCodeHash,
    hash_type: "type",
    args:
      rollupTypeHash +
      u32ToLittleEnd(+creator_account_id).slice(2) +
      contractAddress.slice(2),
  };
  const scriptHash = utils.computeScriptHash(script);
  const id = await rpc.gw_get_account_id_by_script_hash(scriptHash);
  if (id == null) {
    throw new Error("toId is null!");
  }
  return id;
};

module.exports = {
  u32ToLittleEnd,
  getAccountIdByContractAddress,
};
