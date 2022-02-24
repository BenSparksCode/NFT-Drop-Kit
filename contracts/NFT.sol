// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// TODO only 1 mint function - with whitelist
// TODO Enforce limit of 5 per whitelisted address
// TODO Build merkle root from CSV file script
// TODO Scripts for deploy and reveal
// TODO add MEV tx.origin = msg.sender protection

contract NFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    string baseURI;
    string public baseExtension = ".json";
    uint256 public cost = 0.08 ether;
    uint256 public reservedSupply = 250;
    uint256 public reservedMinted;
    uint256 public maxSupply = 5000;
    uint256 public maxMintAmountPresale = 2;
    uint256 public maxMintAmountPublic = 10;
    bool public presaleMintingEnabled = false;
    bool public publicMintingEnabled = false;
    bool public paused = false;
    bool public revealed = false;
    string public notRevealedUri;

    bytes32 public whitelistMerkleRoot;

    // keep track of how many each address has claimed
    mapping(address => uint256) public claimedAmount;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _initNotRevealedUri
    ) ERC721(_name, _symbol) {
        setBaseURI(_initBaseURI);
        setNotRevealedURI(_initNotRevealedUri);
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function mintPublic(uint256 _mintAmount) public payable onlyHumans {
        // TODO
    }

    function mintPresale(bytes32[] calldata merkleProof, uint256 _mintAmount)
        public
        payable
        onlyHumans
        isValidMerkleProof(merkleProof, whitelistMerkleRoot)
    {
        uint256 supply = totalSupply();
        require(presaleMintingEnabled, "Presale minting is not enabled");
        require(!paused, "Minting is paused");
        require(_mintAmount > 0, "Cannot mint 0");
        require(
            supply + _mintAmount <= maxSupply,
            "Cannot mint more than max supply"
        );
        require(
            claimedAmount[msg.sender] + _mintAmount <= maxMintAmount,
            "NFT is already claimed by this wallet"
        );

        require(msg.value >= cost * _mintAmount, "Not enough ETH");

        claimedAmount[msg.sender] += _mintAmount;

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
        }
    }

    function mintReserved(uint256 _mintAmount) public onlyOwner {
        require(!paused, "Minting is paused");
        require(_mintAmount > 0, "Cannot mint 0");
        require(
            reservedMinted + _mintAmount <= reservedSupply,
            "Cannot mint more than reserved supply"
        );

        uint256 startingID = reservedMinted;

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, startingID + i);
            reservedMinted++;
        }
    }

    function isWhitelistedInMerkleProof(
        address _account,
        bytes32[] calldata _merkleProof
    ) public view returns (bool) {
        return
            MerkleProof.verify(
                _merkleProof,
                whitelistMerkleRoot,
                keccak256(abi.encodePacked(_account))
            );
    }

    function walletOfOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        if (revealed == false) {
            return notRevealedUri;
        }

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenId.toString(),
                        baseExtension
                    )
                )
                : "";
    }

    // ============ OWNER-ONLY ADMIN FUNCTIONS ============

    function reveal() public onlyOwner {
        revealed = true;
    }

    function setPresaleMintingEnabled(bool _enabled) external onlyOwner {
        presaleMintingEnabled = _enabled;
    }

    function setPublicMintingEnabled(bool _enabled) external onlyOwner {
        publicMintingEnabled = _enabled;
    }

    function setWhitelistMerkleRoot(bytes32 merkleRoot) external onlyOwner {
        whitelistMerkleRoot = merkleRoot;
    }

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function setmaxMintAmount(uint256 _newmaxMintAmount) public onlyOwner {
        maxMintAmount = _newmaxMintAmount;
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension)
        public
        onlyOwner
    {
        baseExtension = _newBaseExtension;
    }

    function pause(bool _state) public onlyOwner {
        paused = _state;
    }

    function withdraw() public payable onlyOwner {
        // This will payout the owner 95% of the contract balance.
        // Do not remove this otherwise you will not be able to withdraw the funds.
        // =============================================================================
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
        // =============================================================================
    }

    /**
     * @dev Only allows EOA accounts to call function
     */
    modifier onlyHumans() {
        require(tx.origin == msg.sender, "Only humans allowed");
        _;
    }

    /**
     * @dev validates merkleProof
     */
    modifier isValidMerkleProof(bytes32[] calldata merkleProof, bytes32 root) {
        require(
            MerkleProof.verify(
                merkleProof,
                root,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Address does not exist in list"
        );
        _;
    }
}
