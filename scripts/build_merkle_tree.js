const hre = require("hardhat");
const { ethers } = require("hardhat");
require("@nomiclabs/hardhat-etherscan");
const chalk = require("chalk");
const fs = require("fs");
const ProgressBar = require("progress");

const { constants } = require("../utils/TestConstants");

const writeToFile = (str) => {
  // TODO
};

async function main() {
  // TODO

  console.log("✅✅  Merkle Tree Created! ✅✅");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
