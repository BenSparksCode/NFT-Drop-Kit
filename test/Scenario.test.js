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
let alice, aliceAddress;
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
    [owner, alice] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    aliceAddress = await alice.getAddress();

    const nftFactory = await ethers.getContractFactory("NFT");
    NFT = await nftFactory.deploy(
      "Teenage Mutant Ninja Turtles",
      "TMNT",
      constants.REVEALED_URI,
      constants.HIDDEN_URI
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
  // it("No minting from anyone if max supply hit", async () => {
  //   //   TODO

  //   // Code to use in public wallet creation and funding loop
  //   await send1ETH(owner, await whitelistWallets[index].getAddress());
  //   await NFT.connect(whitelistWallets[index]).mintPresale(hexProof, 1, {
  //     gasLimit: 1000000,
  //     value: constants.MINT_COST,
  //   });

  //   await NFT.connect(owner).setPublicMintingEnabled(true);

  //   await NFT.connect(owner).mintReserved(250);
  //   await NFT.connect(owner).mintPublic(4750); //TODO fix to loop public addresses and mint 10 each
  // });

  // RESERVED
  it("Owner can mint 250 while presale and whitelist mints disabled", async () => {
    expect(await NFT.presaleMintingEnabled()).to.equal(false);
    expect(await NFT.publicMintingEnabled()).to.equal(false);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);
  });
  it("RoyaltyRecipient can mint the 250 reserved", async () => {
    expect(await NFT.presaleMintingEnabled()).to.equal(false);
    expect(await NFT.publicMintingEnabled()).to.equal(false);

    expect(await NFT.royaltyRecipient()).to.equal(constants.ROYALTY_RECIPIENT);

    await NFT.connect(owner).setRoyaltyRecipient(aliceAddress);

    expect(await NFT.royaltyRecipient()).to.equal(aliceAddress);
    expect(await NFT.balanceOf(aliceAddress)).to.equal(0);

    await NFT.connect(alice).mintReserved(250);

    expect(await NFT.balanceOf(aliceAddress)).to.equal(250);
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
  it("Whitelisted user cannot mint 3 if whitelist enabled and public disabled", async () => {
    const amountMinted = 3;
    const index = 5;
    const hexProof = merkleTree.getHexProof(leafNodes[index]);

    await send1ETH(owner, await whitelistWallets[index].getAddress());

    await NFT.connect(owner).setPresaleMintingEnabled(true);

    expect(await NFT.presaleMintingEnabled()).to.equal(true);
    expect(await NFT.publicMintingEnabled()).to.equal(false);

    await expect(
      NFT.connect(whitelistWallets[index]).mintPresale(hexProof, amountMinted, {
        gasLimit: 1000000,
        value: constants.MINT_COST.mul(amountMinted),
      })
    ).to.be.revertedWith("Mints exceed 2 per address");

    expect(await NFT.balanceOf(whitelistWallets[index].address)).to.equal(0);
  });
  it("Whitelist user cannot mint for less than 0.08 ETH", async () => {
    const amountMinted = 1;
    const index = 5;
    const hexProof = merkleTree.getHexProof(leafNodes[index]);

    await send1ETH(owner, await whitelistWallets[index].getAddress());

    await NFT.connect(owner).setPresaleMintingEnabled(true);

    expect(await NFT.presaleMintingEnabled()).to.equal(true);
    expect(await NFT.publicMintingEnabled()).to.equal(false);

    await expect(
      NFT.connect(whitelistWallets[index]).mintPresale(hexProof, amountMinted, {
        gasLimit: 1000000,
        value: constants.MINT_COST.mul(amountMinted).sub(1),
      })
    ).to.be.revertedWith("Not enough ETH");

    expect(await NFT.balanceOf(whitelistWallets[index].address)).to.equal(0);
  });

  // PUBLIC
  it("Public user cannot mint if public disabled", async () => {
    const amountMinted = 1;
    const index = 5;

    await send1ETH(owner, await whitelistWallets[index].getAddress());

    expect(await NFT.publicMintingEnabled()).to.equal(false);

    await expect(
      NFT.connect(whitelistWallets[index]).mintPublic(amountMinted, {
        gasLimit: 1000000,
        value: constants.MINT_COST.mul(amountMinted).sub(1),
      })
    ).to.be.revertedWith("Public minting is not enabled");

    expect(await NFT.balanceOf(whitelistWallets[index].address)).to.equal(0);
  });
  it("Public user can mint if public enabled", async () => {
    const amountMinted = 1;
    const pubWallets = generateSignerWallets(1);

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
      gasLimit: 1000000,
      value: constants.MINT_COST.mul(amountMinted),
    });

    expect(await NFT.balanceOf(pubWallets[0].address)).to.equal(amountMinted);

    expect(await NFT.totalSupply()).to.equal(251);
  });
  it("Public user can mint 10", async () => {
    const amountMinted = 10;
    const pubWallets = generateSignerWallets(1);

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
      gasLimit: 2000000,
      value: constants.MINT_COST.mul(amountMinted),
    });

    expect(await NFT.balanceOf(pubWallets[0].address)).to.equal(amountMinted);

    expect(await NFT.totalSupply()).to.equal(260);
  });
  it("Public user cannot mint 11", async () => {
    const amountMinted = 11;
    const pubWallets = generateSignerWallets(1);

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await expect(
      NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
        gasLimit: 3000000,
        value: constants.MINT_COST.mul(amountMinted),
      })
    ).to.be.revertedWith("Mints exceed 10 per address");

    expect(await NFT.balanceOf(pubWallets[0].address)).to.equal(0);

    expect(await NFT.totalSupply()).to.equal(250);
  });
  it("Public user cannot mint for less than 0.08 ETH", async () => {
    const amountMinted = 1;
    const pubWallets = generateSignerWallets(1);

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await expect(
      NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
        gasLimit: 1000000,
        value: constants.MINT_COST.mul(amountMinted).sub(1),
      })
    ).to.be.revertedWith("Not enough ETH");

    expect(await NFT.balanceOf(pubWallets[0].address)).to.equal(0);

    expect(await NFT.totalSupply()).to.equal(250);
  });

  // URI
  it("URI is as expected before reveal", async () => {
    const amountMinted = 1;
    const pubWallets = generateSignerWallets(1);

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
      gasLimit: 1000000,
      value: constants.MINT_COST.mul(amountMinted),
    });

    expect(await NFT.balanceOf(pubWallets[0].address)).to.equal(amountMinted);

    expect(await NFT.totalSupply()).to.equal(251);

    expect(await NFT.tokenURI(1)).to.equal(constants.HIDDEN_URI);
    expect(await NFT.tokenURI(251)).to.equal(constants.HIDDEN_URI);
  });
  it("URI is as expected after reveal", async () => {
    const amountMinted = 1;
    const pubWallets = generateSignerWallets(1);

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
      gasLimit: 1000000,
      value: constants.MINT_COST.mul(amountMinted),
    });

    expect(await NFT.balanceOf(pubWallets[0].address)).to.equal(amountMinted);

    expect(await NFT.totalSupply()).to.equal(251);

    expect(await NFT.tokenURI(1)).to.equal(constants.HIDDEN_URI);
    expect(await NFT.tokenURI(251)).to.equal(constants.HIDDEN_URI);

    await NFT.connect(owner).reveal();

    expect(await NFT.tokenURI(1)).to.equal(constants.REVEALED_URI + "1.json");
    expect(await NFT.tokenURI(251)).to.equal(
      constants.REVEALED_URI + "251.json"
    );
  });
  it("Both URIs can be changed after deployment", async () => {
    const amountMinted = 1;
    const pubWallets = generateSignerWallets(1);
    const newUnrevealedURI = "NEW UNREVEALED URI";
    const newBaseURI = "bussy";

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
      gasLimit: 1000000,
      value: constants.MINT_COST.mul(amountMinted),
    });

    expect(await NFT.balanceOf(pubWallets[0].address)).to.equal(amountMinted);

    expect(await NFT.totalSupply()).to.equal(251);

    expect(await NFT.tokenURI(1)).to.equal(constants.HIDDEN_URI);
    expect(await NFT.tokenURI(251)).to.equal(constants.HIDDEN_URI);

    await NFT.connect(owner).setNotRevealedURI(newUnrevealedURI);

    expect(await NFT.tokenURI(1)).to.equal(newUnrevealedURI);
    expect(await NFT.tokenURI(251)).to.equal(newUnrevealedURI);

    await NFT.connect(owner).reveal();

    expect(await NFT.tokenURI(1)).to.equal(constants.REVEALED_URI + "1.json");
    expect(await NFT.tokenURI(251)).to.equal(
      constants.REVEALED_URI + "251.json"
    );

    await NFT.connect(owner).setBaseURI(newBaseURI);

    expect(await NFT.tokenURI(1)).to.equal(newBaseURI + "1.json");
    expect(await NFT.tokenURI(251)).to.equal(newBaseURI + "251.json");
  });

  // ROYALTY
  it("Royalty calculated correctly with royaltyInfo view function", async () => {
    const amountMinted = 1;
    const pubWallets = generateSignerWallets(1);
    const tradeAmount = ethers.utils.parseEther("12");
    const expectedRoyalty = tradeAmount
      .mul(constants.ROYALTY)
      .div(constants.SCALE);

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
      gasLimit: 1000000,
      value: constants.MINT_COST.mul(amountMinted),
    });

    const output1 = await NFT.royaltyInfo(1, tradeAmount);
    const output251 = await NFT.royaltyInfo(251, tradeAmount);

    expect(output1.receiver).to.equal(constants.ROYALTY_RECIPIENT);
    expect(output251.receiver).to.equal(constants.ROYALTY_RECIPIENT);
    expect(output1.royaltyAmount).to.equal(expectedRoyalty);
    expect(output251.royaltyAmount).to.equal(expectedRoyalty);
  });
  it("royaltyInfo returns 0 on non-existant token query", async () => {
    await expect(
      NFT.royaltyInfo(1, ethers.utils.parseEther("12"))
    ).to.be.revertedWith("ERC721Metadata: Royalty query for nonexistent token");
  });

  // ONLY OWNER
  it("Only owner can withdraw all ETH", async () => {
    const amountMinted = 10;
    const pubWallets = generateSignerWallets(1);
    await NFT.connect(owner).setPublicMintingEnabled(true);

    await NFT.connect(owner).mintReserved(250);

    expect(await NFT.balanceOf(ownerAddress)).to.equal(250);

    await send1ETH(owner, pubWallets[0].address);

    await NFT.connect(pubWallets[0]).mintPublic(amountMinted, {
      gasLimit: 3000000,
      value: constants.MINT_COST.mul(amountMinted),
    });

    const contractBal = await ethers.provider.getBalance(NFT.address);
    const ownerBal1 = await ethers.provider.getBalance(ownerAddress);
    console.log(contractBal);

    expect(contractBal).to.equal(constants.MINT_COST.mul(amountMinted));

    await expect(NFT.connect(alice).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await NFT.connect(owner).withdraw();
    const ownerBal2 = await ethers.provider.getBalance(ownerAddress);
    expect(await ethers.provider.getBalance(NFT.address)).to.equal(0);
    expect(ownerBal2.sub(ownerBal1)).to.be.closeTo(
      constants.MINT_COST.mul(amountMinted),
      constants.MINT_COST.mul(amountMinted).div(1000)
    );
  });
  it("Only owner can set royalty percentage", async () => {
    const newRoyalty = 500;

    expect(await NFT.royaltyPercentage()).to.equal(constants.ROYALTY);

    await expect(NFT.connect(alice).setRoyalty(newRoyalty)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await NFT.connect(owner).setRoyalty(newRoyalty);

    expect(await NFT.royaltyPercentage()).to.equal(newRoyalty);
  });
  it("Only owner can pause minting", async () => {
    const pubWallets = generateSignerWallets(1);

    await NFT.connect(owner).setPublicMintingEnabled(true);

    await expect(NFT.connect(alice).pause(true)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await send1ETH(owner, pubWallets[0].address);

    // await NFT.connect(pubWallets[0]).mintPublic(1, {
    //   gasLimit: 3000000,
    //   value: constants.MINT_COST,
    // });

    await NFT.connect(owner).mintReserved(1);

    expect(await NFT.paused()).to.equal(false);

    await NFT.connect(owner).pause(true);

    await expect(NFT.connect(owner).mintReserved(1)).to.be.revertedWith(
      "Minting is paused"
    );

    await expect(
      NFT.connect(pubWallets[0]).mintPublic(1, {
        gasLimit: 3000000,
        value: constants.MINT_COST,
      })
    ).to.be.revertedWith("Minting is paused");

    expect(await NFT.paused()).to.equal(true);
  });
});
