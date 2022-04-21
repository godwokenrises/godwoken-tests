# Create EOA account in godwoken

This demo demonstrates how to create an EOA account in godwoken.
First, we need to create an EOA Account with Meta Contract.
See more about [MetaContract](https://github.com/nervosnetwork/godwoken/blob/develop/docs/life_of_a_godwoken_transaction.md#metacontract).

Besides, we need some help from [Eth Address Registry Contract](https://github.com/nervosnetwork/godwoken-scripts/blob/master/c/contracts/eth_addr_reg.c) which is invoved in Godwoken V1.
See more about [eth reg](https://github.com/nervosnetwork/godwoken/blob/develop/docs/v1-release-note.md#address-registry).
We need set mapping between ETH address and godwoken script hash with Eth Address Registry Contract.

## Setup

[godwoken-kicker](https://github.com/RetricSu/godwoken-kicker/tree/v1.1.x)
```sh
./kicker start
```

## Run

```sh
npm install
npm start
```

