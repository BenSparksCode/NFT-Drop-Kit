const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
// const hre = require("hardhat");
// const { ethers } = require("hardhat");
require("@nomiclabs/hardhat-etherscan");
// const chalk = require("chalk");
const fs = require("fs");
// const ProgressBar = require("progress");

const CSV_FILE_NAME = "KoolKidzMasterList.csv";
const ADDRESS_TO_VERIFY = "0x5fc0be7a7d67a98bea9aad9e4583332e44e19f0f";

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
  // 4. get merkle proof for a specific address
  const merkleProof = merkleTree.getHexProof(keccak256(ADDRESS_TO_VERIFY));

  // This is just a check in JS that should return true if address is in whitelist
  const merkleProofVerification = merkleTree.verify(
    merkleProof,
    keccak256(ADDRESS_TO_VERIFY),
    merkleRoot
  );
  console.log(merkleProofVerification);

  console.log("Merkle Root:", merkleRoot);
  console.log("Proving that", ADDRESS_TO_VERIFY, "is on the list...");
  console.log("Merkle Proof:", merkleProof);
  console.log("✅✅  done ✅✅");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
