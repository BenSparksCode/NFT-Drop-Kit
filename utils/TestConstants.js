const { BigNumber } = require("@ethersproject/bignumber");
const { ethers } = require("hardhat");

const CONSTANTS = {
  WHITELIST: ["", "", "", "", "", ""],
  MINT_COST: ethers.utils.parseEther("0.08"),
  MAX_MINT_PRESALE: 2,
  MAX_MINT_PUBLIC: 10,
  TEAM_TOKENS: 250,
  MAX_SUPPLY: 5000,
};

module.exports = {
  constants: CONSTANTS,
};
