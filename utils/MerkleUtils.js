const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

const generateWallets = (numOfWallets) => {
  let wallets = [];

  for (let i = 0; i < numOfWallets; i++) {
    wallets.push(ethers.Wallet.createRandom());
    console.log(wallets[i].address);
  }

  return wallets;
};

module.exports = {
  generateAddresses: generateAddresses,
};
