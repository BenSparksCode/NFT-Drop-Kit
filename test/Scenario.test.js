const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { BigNumber, Signer } = require("ethers");
const {
  generateSignerWallets,
  generateAddresses,
} = require("../utils/MerkleUtils");
const { constants } = require("../utils/TestConstants");
const {} = require("../utils/TestUtils");

let owner, ownerAddress;
let NFT;

const NFT_MINT_COST = ethers.utils.parseEther("0.05");

describe("Scenario Tests", function () {
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();

    const nftFactory = await ethers.getContractFactory("NFT");
    NFT = await nftFactory.deploy(
      "Teenage Mutant Ninja Turtles",
      "TMNT",
      "hiddenturtles.com",
      "revealedturtles.com"
    );
  });

  it("Test 1", async () => {
    //   TODO
  });
});
