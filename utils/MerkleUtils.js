const { MerkleTree } = require("merkletreejs");
const { keccak256 } = require("keccak256");

const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

const generateSignerWallets = (numOfWallets) => {
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

const generateAddresses = (numOfWallets) => {
  let wallets = [];

  for (let i = 0; i < numOfWallets; i++) {
    wallets.push(ethers.Wallet.createRandom());
  }

  return wallets;
};

const createWalletFromPrivKey = (privKey) => {
  return new ethers.Wallet(privKey, ethers.provider);
};

module.exports = {
  generateSignerWallets: generateSignerWallets,
  generateAddresses: generateAddresses,
  createWalletFromPrivKey: createWalletFromPrivKey,
};
