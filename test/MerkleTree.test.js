const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { constants } = require("../utils/TestConstants");
const {} = require("../utils/TestUtils");
const { BigNumber } = require("ethers");

let owner, ownerAddress;

describe("ArtizenCore Basic Tests", function () {
  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    ownerAddress = await owner.getAddress();
  });

  it("5000 addresses merkle whitelisted, all can claim", async () => {
    //   TODO
  });
});
