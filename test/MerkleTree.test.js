const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { BigNumber } = require("ethers");
const {
  generateWallets,
  buildWhitelistMerkleRoot,
} = require("../utils/MerkleUtils");
const { constants } = require("../utils/TestConstants");
const {} = require("../utils/TestUtils");

let owner, ownerAddress;
let NFT;

describe("Merkle Tree Tests", function () {
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

  it("100 addresses merkle whitelisted, all can claim", async () => {
    //   TODO

    // Generate 100 wallets and addresses
    const wallets = generateWallets(100);
    const walletAddresses = wallets.map((w) => w.address);

    // Create Merkle Root from 100 addresses for whitelist
    const merkleRoot = buildWhitelistMerkleRoot(walletAddresses);
    console.log(merkleRoot);

    // TODO check merkleRoot is in correct bytes32 format

    // Set Merkle Root in NFT as owner
    await NFT.setWhitelistMerkleRoot(merkleRoot);

    const evilWallets = generateWallets(10);

    // loop through whitelisted addresses
    for (let i = 0; i < wallets.length; i++) {
      const currentWallet = wallets[i];

      // claim NFT via whitelist mint function
    }

    // loop through evil wallets
    for (let i = 0; i < evilWallets.length; i++) {
      const currentEvilWallet = evilWallets[i];

      // Check evil wallet not in whitelist wallet array

      // Check evil wallet cannot mint NFT via whitelist function
    }
  });

  it("5000 addresses merkle whitelisted, check all are on whitelist in view function", async () => {
    // TODO
  });
});
