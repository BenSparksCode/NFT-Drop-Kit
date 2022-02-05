const { MerkleTree } = require("merkletreejs");
const { keccak256 } = require("keccak256");

const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

const generateWallets = (numOfWallets) => {
  let wallets = [];

  for (let i = 0; i < numOfWallets; i++) {
    wallets.push(
      new ethers.Wallet(
        ethers.Wallet.createRandom().privateKey,
        ethers.provider
      )
    );
  }

  return wallets;
};

module.exports = {
  generateWallets: generateWallets,
};
