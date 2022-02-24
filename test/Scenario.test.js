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

  // PAUSED, MAX SUPPLY
  it("No minting from anyone while paused", async () => {});
  it("No minting from anyone if max supply hit", async () => {});

  // RESERVED
  it("Owner can mint 250 while presale and whitelist mints disabled", async () => {});
  it("Owner can mint 250 while presale and whitelist mints enabled", async () => {});
  it("Owner cannot mint 251", async () => {});
  it("Owner can mint 250 in 5 separate batches of 50 each", async () => {});

  // WHITELIST
  it("Whitelisted user cannot mint if whitelist disabled", async () => {});
  it("Whitelisted user can mint if whitelist enabled", async () => {});
  it("Non-Whitelisted user cannot mint if whitelist enabled and public disabled", async () => {});
  it("Whitelisted user can mint 2 if whitelist enabled and public disabled", async () => {});
  it("Whitelisted user cannot mint 3 if whitelist enabled and public disabled", async () => {});
  it("Whitelist user cannot mint for less than 0.08 ETH", async () => {});

  // PUBLIC
  it("Public user cannot mint if public disabled", async () => {});
  it("Public user can mint if public enabled", async () => {});
  it("Public user can mint 10", async () => {});
  it("Public user cannot mint 11", async () => {});
  it("Public user cannot mint for less than 0.08 ETH", async () => {});

  // URI
  it("URI is as expected before reveal", async () => {});
  it("URI is as expected after reveal", async () => {});
  it("Both URIs can be changed after deployment", async () => {});
});
