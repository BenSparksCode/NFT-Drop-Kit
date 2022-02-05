const { MerkleTree } = require("merkletreejs");
const { keccak256 } = require("keccak256");

const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

const generateWallets = (numOfWallets) => {
  let wallets = [];

  for (let i = 0; i < numOfWallets; i++) {
    wallets.push(ethers.Wallet.createRandom());
  }

  return wallets;
};

const getLeaf = (entry) => {
  if (typeof entry == "string") {
    if (entry.startsWith("0x")) return ethers.utils.keccak256(entry);
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(entry));
  }
  return ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [entry[0], ethers.utils.parseEther(entry[1])]
  );
};

const buildWhitelistMerkleRoot = (whitelistedAddresses) => {
  const leaves = whitelistedAddresses.map(getLeaf);
  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  return tree.getHexRoot();
};

module.exports = {
  generateWallets: generateWallets,
  buildWhitelistMerkleRoot: buildWhitelistMerkleRoot,
};
