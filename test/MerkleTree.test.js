const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { BigNumber } = require("ethers");
const { generateWallets } = require("../utils/MerkleUtils");
const { constants } = require("../utils/TestConstants");
const {} = require("../utils/TestUtils");

let owner, ownerAddress;

describe("Merkle Tree Tests", function () {
  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    ownerAddress = await owner.getAddress();
  });

  it("5000 addresses merkle whitelisted, all can claim", async () => {
    //   TODO

    const wallets = generateWallets(20);
  });

  it;
});
