const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const hre = require("hardhat");
const { ethers } = require("hardhat");
require("@nomiclabs/hardhat-etherscan");
const chalk = require("chalk");
const fs = require("fs");
const ProgressBar = require("progress");

const { constants } = require("../utils/TestConstants");

const CSV_FILE_NAME = "KoolKidzMasterList.csv";

async function main() {
  const data = fs.readFileSync("./" + CSV_FILE_NAME, "utf8");
  const walletAddresses = data.split("\r\n");

  console.log("Found", walletAddresses.length, "addresses in CSV...");
  console.log("First 5 addresses:", walletAddresses.slice(0, 5));
  console.log("Last 5 addresses:", walletAddresses.slice(-5));

  // 1. turn addresses into leaf nodes with keccak256 hashing
  const leafNodes = walletAddresses.map((addr) => keccak256(addr));
  // 2. create merkle tree with sorted leaf nodes
  const merkleTree = new MerkleTree(leafNodes, keccak256, {
    sortPairs: true,
  });
  // 3. get root of merkle tree
  const merkleRoot = merkleTree.getHexRoot();

  console.log("Merkle Root:", merkleRoot);
  console.log("✅✅  Merkle Tree Created! ✅✅");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
