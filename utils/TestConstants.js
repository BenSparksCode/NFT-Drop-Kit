const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");

const CONSTANTS = {
  WHITELIST_PRIV_KEYS: [
    "0xb594d6703f296dd549f4f151108a0a7da825b44cba31dad2f34f4a3521d601c5",
    "0x4519ba8eb8b5ab21bdc2817e291a9db0ef89055a386246a676a0c60cf049926b",
    "0xbdbdf54470c8e1358ae34cff6149473bc7ac5dd603ed30d6b0917e15faa179a0",
    "0xc277b1873e75139f4d11e4bf21261295f95ff596fd538c3f7772b49a160b8a5a",
    "0xebaba9d62e2a96e292376d1bd3d0651557f6e2db80afb26648cf90a9048e04da",
    "0xd2c5b14c82ebf582fcee49c9e176056d3d3efde99eecdc1f4e42ae207c133a1a",
    "0x4c84b9a09fd4ff00bc5099ffc59235d5ab4ab28161def4400cd1e041e1c384e8",
    "0x9c63f34b8353a12e881b28e1b13e322827ccb58ee6cf645e091f16c157c933e4",
    "0x3e7d256313194a901415486a4a97d150c2ec4a8edfea2645d119ec8ce1f184e1",
    "0x996f50c261bd2d4629e7343d489bb46092de18fce72e34bfec7b45a7934545cc",
  ],
  WHITELIST_ADDRESSES: [
    "0x474E42FDC007B7891f7575492C33de08Aeb3334E",
    "0xDC5cDe49930b836D1eD88A3D448dE394699E037D",
    "0x4d8f95Bf6DB254398c8EEe5a643A1829967D5602",
    "0x92202FEC2A9Dc1FbF17C2B542a69AD17f7d8C4c7",
    "0xA36bBc8B2dC99045fBa0352098c61c469FA138b4",
    "0x170cBf4F9967de3C66bBc7589C1ea8D08E490693",
    "0x42C0f043a0e5dd9169C320C6f342554b9B46Bf00",
    "0xfc5A21ae45F8d8A5CA162048c1A7bECC4b44167d",
    "0x62b625505C4AC9B32a233D290965313F8319855B",
    "0xBD7dd1c9aa59Fb68727Fd827B3dBd57Db5D1061b",
  ],
  MINT_COST: ethers.utils.parseEther("0.08"),
  MAX_MINT_PRESALE: 2,
  MAX_MINT_PUBLIC: 10,
  TEAM_TOKENS: 250,
  MAX_SUPPLY: 5000,
  ROYALTY: 750,
  SCALE: 10000,
  HIDDEN_URI: "HIDDEN",
  REVEALED_URI: "REVEALED",
  ROYALTY_RECIPIENT: "0x339Ff26CF5E9332b59A6E37C2453c4B335b839d1",
};

module.exports = {
  constants: CONSTANTS,
};
