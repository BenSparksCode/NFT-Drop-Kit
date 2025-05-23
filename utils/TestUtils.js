const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");
const { constants } = require("./TestConstants");

// Gets the time of the last block.
const currentTime = async () => {
  const { timestamp } = await ethers.provider.getBlock("latest");
  return timestamp;
};

// Increases the time in the EVM.
// seconds = number of seconds to increase the time by
const fastForward = async (seconds) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

const toJSNum = (bigNum) => {
  return parseInt(bigNum.toString());
};

const burnTokenBalance = async (signer, tokenContract) => {
  const addr = await signer.getAddress();
  const bal = await tokenContract.balanceOf(addr);
  tokenContract
    .connect(signer)
    .transfer("0x000000000000000000000000000000000000dEaD", bal);
};

const send1ETH = async (ownerSigner, recipientAddress) => {
  await ownerSigner.sendTransaction({
    to: recipientAddress,
    value: ethers.utils.parseEther("1"),
  });
};

module.exports = {
  currentTime: currentTime,
  fastForward: fastForward,
  burnTokenBalance: burnTokenBalance,
  send1ETH: send1ETH,
};
