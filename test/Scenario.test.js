const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { BigNumber, Signer } = require("ethers");
const {
  generateSignerWallets,
  generateAddresses,
  createWalletFromPrivKey,
} = require("../utils/MerkleUtils");
const { constants } = require("../utils/TestConstants");
const { send1ETH } = require("../utils/TestUtils");

let owner, ownerAddress;
let NFT;

let whitelistWallets = [];
let randomWallets = generateSignerWallets(10);

// Build array of whitelisted wallets
for (let i = 0; i < constants.WHITELIST_PRIV_KEYS.length; i++) {
  const privKey = constants.WHITELIST_PRIV_KEYS[i];
  whitelistWallets.push(createWalletFromPrivKey(privKey));
}

// MERKLE TREE STUFF
const leafNodes = whitelistWallets
  .map((w) => w.address)
  .map((addr) => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, {
  sortPairs: true,
});
const merkleRoot = merkleTree.getHexRoot();

describe("Scenario Tests", function () {
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();

    const nftFactory = await ethers.getContractFactory("NFT");
    NFT = await nftFactory.deploy(
      "Teenage Mutant Ninja Turtles",
      "TMNT",
      constants.HIDDEN_URI,
      constants.REVEALED_URI
    );

    // Set Merkle Root in NFT as owner
    await NFT.connect(owner).setWhitelistMerkleRoot(merkleRoot);
  });

  // PAUSED, MAX SUPPLY
  it("No minting from anyone while paused", async () => {
    const hexProof = merkleTree.getHexProof(leafNodes[0]);

    await send1ETH(owner, await whitelistWallets[0].getAddress());
    await send1ETH(owner, await randomWallets[0].getAddress());

    await NFT.connect(owner).pause(true);
    await NFT.connect(owner).setPresaleMintingEnabled(true);
    await NFT.connect(owner).setPublicMintingEnabled(true);

    await expect(NFT.connect(owner).mintReserved(1)).to.be.revertedWith(
      "Minting is paused"
    );

    await expect(
      NFT.connect(whitelistWallets[0]).mintPresale(hexProof, 1, {
        gasLimit: 1000000,
        value: constants.MINT_COST,
      })
    ).to.be.revertedWith("Minting is paused");

    await expect(
      NFT.connect(randomWallets[0]).mintPublic(1, {
        gasLimit: 1000000,
        value: constants.MINT_COST,
      })
    ).to.be.revertedWith("Minting is paused");
  });
  it("No minting from anyone if max supply hit", async () => {
    //   TODO
  });

  // RESERVED
  it("Owner can mint 250 while presale and whitelist mints disabled", async () => {
    expect(await NFT.presaleMintingEnabled()).to.equal(false);
    expect(await NFT.publicMintingEnabled()).to.equal(false);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);
  });
  it("Owner can mint 250 while presale and whitelist mints enabled", async () => {
    await NFT.connect(owner).setPresaleMintingEnabled(true);
    await NFT.connect(owner).setPublicMintingEnabled(true);

    expect(await NFT.presaleMintingEnabled()).to.equal(true);
    expect(await NFT.publicMintingEnabled()).to.equal(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);
  });
  it("Owner cannot mint 251", async () => {
    await expect(NFT.connect(owner).mintReserved(251)).to.be.revertedWith(
      "Cannot mint more than reserved supply"
    );

    expect(await NFT.balanceOf(ownerAddress)).to.equal(0);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await expect(NFT.connect(owner).mintReserved(1)).to.be.revertedWith(
      "Cannot mint more than reserved supply"
    );
  });
  it("Owner can mint 250 in 5 separate batches of 50 each", async () => {
    await NFT.connect(owner).mintReserved(50);
    expect(await NFT.balanceOf(ownerAddress)).to.equal(50);
    await NFT.connect(owner).mintReserved(50);
    expect(await NFT.balanceOf(ownerAddress)).to.equal(100);
    await NFT.connect(owner).mintReserved(50);
    expect(await NFT.balanceOf(ownerAddress)).to.equal(150);
    await NFT.connect(owner).mintReserved(50);
    expect(await NFT.balanceOf(ownerAddress)).to.equal(200);
    await NFT.connect(owner).mintReserved(50);
    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);
  });

  // WHITELIST
  it("Whitelisted user cannot mint if whitelist disabled", async () => {
    const wlIndex = 3;
    const hexProof = merkleTree.getHexProof(leafNodes[wlIndex]);

    await send1ETH(owner, await whitelistWallets[wlIndex].getAddress());

    expect(await NFT.presaleMintingEnabled()).to.equal(false);

    await expect(
      NFT.connect(whitelistWallets[wlIndex]).mintPresale(hexProof, 1, {
        gasLimit: 1000000,
        value: constants.MINT_COST,
      })
    ).to.be.revertedWith("Presale minting is not enabled");
  });
  it("Whitelisted user can mint if whitelist enabled", async () => {
    const index = 3;
    const hexProof = merkleTree.getHexProof(leafNodes[index]);

    await send1ETH(owner, await whitelistWallets[index].getAddress());

    await NFT.connect(owner).setPresaleMintingEnabled(true);

    expect(await NFT.presaleMintingEnabled()).to.equal(true);

    await NFT.connect(whitelistWallets[index]).mintPresale(hexProof, 1, {
      gasLimit: 1000000,
      value: constants.MINT_COST,
    });

    expect(await NFT.balanceOf(whitelistWallets[index].address)).to.equal(1);
  });
  it("Non-Whitelisted user cannot mint if whitelist enabled and public disabled", async () => {
    const index = 3;

    await send1ETH(owner, await randomWallets[index].getAddress());

    await NFT.connect(owner).setPresaleMintingEnabled(true);

    expect(await NFT.presaleMintingEnabled()).to.equal(true);

    await expect(
      NFT.connect(randomWallets[index]).mintPublic(1, {
        gasLimit: 1000000,
        value: constants.MINT_COST,
      })
    ).to.be.revertedWith("Public minting is not enabled");
  });
  it("Whitelisted user can mint 2 if whitelist enabled and public disabled", async () => {
    const amountMinted = 2;
    const index = 5;
    const hexProof = merkleTree.getHexProof(leafNodes[index]);

    await send1ETH(owner, await whitelistWallets[index].getAddress());

    await NFT.connect(owner).setPresaleMintingEnabled(true);

    expect(await NFT.presaleMintingEnabled()).to.equal(true);
    expect(await NFT.publicMintingEnabled()).to.equal(false);

    await NFT.connect(whitelistWallets[index]).mintPresale(
      hexProof,
      amountMinted,
      {
        gasLimit: 1000000,
        value: constants.MINT_COST.mul(amountMinted),
      }
    );

    expect(await NFT.balanceOf(whitelistWallets[index].address)).to.equal(
      amountMinted
    );
  });
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

  // ONLY OWNER
  it("Only owner can withdraw all ETH", async () => {});
});
