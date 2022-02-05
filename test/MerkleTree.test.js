const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { BigNumber, Signer } = require("ethers");
const {
  generateWallets,
  buildMerkleTree,
  buildMerkleRoot,
  buildMerkleProof,
} = require("../utils/MerkleUtils");
const { constants } = require("../utils/TestConstants");
const {} = require("../utils/TestUtils");

let owner, ownerAddress;
let NFT;

const NFT_MINT_COST = ethers.utils.parseEther("0.05");

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

  it("Basic merkle tree works in JS", async () => {
    let whitelist = [
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    ];

    const leafNodes = whitelist.map((addr) => keccak256(addr));

    const merkleTree = new MerkleTree(leafNodes, keccak256, {
      sortPairs: true,
    });

    const root = merkleTree.getRoot();

    const hexProof = merkleTree.getHexProof(leafNodes[1]);

    const merkleProofVerification = merkleTree.verify(
      hexProof,
      leafNodes[1],
      root
    );
    expect(merkleProofVerification).to.equal(true);
  });

  it("isWhitelistedInMerkleProof view function works correctly", async () => {
    // TODO
    const wallets = generateWallets(2);
    const walletAddresses = wallets.map((w) => w.address);
    const leafNodes = walletAddresses.map((addr) => keccak256(addr));

    const merkleTree = new MerkleTree(leafNodes, keccak256, {
      sortPairs: true,
    });
    const merkleRoot = merkleTree.getHexRoot();

    // Set Merkle Root in NFT as owner
    await NFT.connect(owner).setWhitelistMerkleRoot(merkleRoot);

    // Check whitelistMerkleRoot is set as expected
    expect(await NFT.whitelistMerkleRoot()).to.equal(merkleRoot);

    // loop through whitelisted addresses
    for (let i = 0; i < wallets.length; i++) {
      const currentWallet = wallets[i];
      const hexProof = merkleTree.getHexProof(leafNodes[i]);

      // Check in JS if wallet should be in merkle tree
      const merkleProofVerification = merkleTree.verify(
        hexProof,
        leafNodes[i],
        merkleRoot
      );
      expect(merkleProofVerification).to.equal(true);

      const isWhitelisted = await NFT.isWhitelistedInMerkleProof(
        currentWallet.address,
        hexProof
      );

      expect(isWhitelisted).to.equal(true);
    }

    const evilWallets = generateWallets(2);
    const evilWalletAddresses = evilWallets.map((w) => w.address);
    const evilLeafNodes = evilWalletAddresses.map((addr) => keccak256(addr));

    for (let i = 0; i < evilWallets.length; i++) {
      const currentWallet = evilWallets[i];
      const hexProof = merkleTree.getHexProof(evilLeafNodes[i]);

      const isWhitelisted = await NFT.isWhitelistedInMerkleProof(
        currentWallet.address,
        hexProof
      );

      expect(isWhitelisted).to.equal(false);
    }
  });

  it("10 addresses merkle whitelisted, all can claim, non-whitelisted claims revert", async () => {
    // Generate 10 wallets, addresses, and hashed leaf nodes
    const wallets = generateWallets(10);
    const walletAddresses = wallets.map((w) => w.address);
    const leafNodes = walletAddresses.map((addr) => keccak256(addr));

    const evilWallets = generateWallets(10);
    const evilWalletAddresses = evilWallets.map((w) => w.address);
    const evilLeafNodes = evilWalletAddresses.map((addr) => keccak256(addr));

    // Create Merkle Root from 10 addresses for whitelist
    const merkleTree = new MerkleTree(leafNodes, keccak256, {
      sortPairs: true,
    });
    const merkleRoot = merkleTree.getHexRoot();

    // Set Merkle Root in NFT as owner
    await NFT.connect(owner).setWhitelistMerkleRoot(merkleRoot);

    // Check whitelistMerkleRoot is set as expected
    expect(await NFT.whitelistMerkleRoot()).to.equal(merkleRoot);

    // loop through whitelisted addresses
    for (let i = 0; i < wallets.length; i++) {
      const currentWallet = wallets[i];
      const hexProof = merkleTree.getHexProof(leafNodes[i]);

      // Check in JS if wallet should be in merkle tree
      const merkleProofVerification = merkleTree.verify(
        hexProof,
        leafNodes[i],
        merkleRoot
      );
      expect(merkleProofVerification).to.equal(true);

      await owner.sendTransaction({
        to: currentWallet.address,
        value: ethers.utils.parseEther("0.2"),
      });

      await NFT.connect(currentWallet).mintWhitelist(hexProof, 1, {
        gasLimit: 1000000,
        value: NFT_MINT_COST,
      });
    }

    // loop through evil wallets
    for (let i = 0; i < evilWallets.length; i++) {
      const currentEvilWallet = evilWallets[i];
      const evilHexProof = merkleTree.getHexProof(evilLeafNodes[i]);

      // Check in JS that evil wallet not in merkle tree
      const evilMerkleProofVerification = merkleTree.verify(
        evilHexProof,
        evilLeafNodes[i],
        merkleRoot
      );
      expect(evilMerkleProofVerification).to.equal(false);

      // Give evil wallet gas
      await owner.sendTransaction({
        to: currentEvilWallet.address,
        value: ethers.utils.parseEther("0.2"),
      });

      // Check evil wallet cannot mint NFT via whitelist function
      await expect(
        NFT.connect(currentEvilWallet).mintWhitelist(evilHexProof, 1, {
          gasLimit: 1000000,
          value: NFT_MINT_COST,
        })
      ).to.be.revertedWith("Address does not exist in list");
    }
  });

  it("1000 addresses whitelisted, checked with view function", async () => {
    const wallets = generateWallets(1000);
    const walletAddresses = wallets.map((w) => w.address);
    const leafNodes = walletAddresses.map((addr) => keccak256(addr));

    const merkleTree = new MerkleTree(leafNodes, keccak256, {
      sortPairs: true,
    });
    const merkleRoot = merkleTree.getHexRoot();

    // Set Merkle Root in NFT as owner
    await NFT.connect(owner).setWhitelistMerkleRoot(merkleRoot);

    // Check whitelistMerkleRoot is set as expected
    expect(await NFT.whitelistMerkleRoot()).to.equal(merkleRoot);

    // loop through whitelisted addresses
    for (let i = 0; i < wallets.length; i++) {
      const currentWallet = wallets[i];
      const hexProof = merkleTree.getHexProof(leafNodes[i]);

      // Check in JS if wallet should be in merkle tree
      const merkleProofVerification = merkleTree.verify(
        hexProof,
        leafNodes[i],
        merkleRoot
      );
      expect(merkleProofVerification).to.equal(true);

      const isWhitelisted = await NFT.isWhitelistedInMerkleProof(
        currentWallet.address,
        hexProof
      );

      expect(isWhitelisted).to.equal(true);
    }
  });
});
