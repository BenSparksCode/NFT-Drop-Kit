// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "contracts/interfaces/IERC2981.sol";

contract ERC721AWhitelistNFT is ERC721A, Ownable, ReentrancyGuard, IERC2981 {
    // --------------------------------------------------------------
    // STORAGE
    // --------------------------------------------------------------

    string public baseURI;
    string public uriExtension;

    uint256 public constant SCALE = 1e18;

    uint256 public phaseTwoPrice;
    uint256 public publicPrice;
    uint256 private immutable MAX_PER_ADDRESS_PHASE_TWO;
    uint256 private immutable MAX_PER_ADDRESS_PUBLIC;
    uint256 private immutable MAX_TOKEN_SUPPLY;
    uint256 public immutable PHASE_ONE_START_TIME;
    uint256 public immutable PHASE_TWO_START_TIME;
    uint256 public immutable PUBLIC_START_TIME;

    uint256 public royaltyCut = 1e17; // default = 10%
    address public royaltyRecipient;

    bytes32 private phaseOneMerkleRoot;
    bytes32 private phaseTwoMerkleRoot;
    mapping(address => uint256) public mintedTokens; // how many an account has minted
    mapping(address => bool) public phaseOneClaimed;
    mapping(address => bool) public phaseTwoClaimed;

    // --------------------------------------------------------------
    // EVENTS
    // --------------------------------------------------------------

    event TokenURISet(uint256 tokenID);
    event TokensMinted(address to, uint256 quantity);
    event BaseURIUpdated(string uri);
    event PhaseOneMerkleRootUpdated(bytes32 root);
    event PhaseTwoMerkleRootUpdated(bytes32 root);
    event TokenURIExtentionSet(string extention);
    event NewRoyaltyRecipientSet(address newRecipient);
    event NewRoyaltyCutSet(uint256 newRoyaltyCut);
    event NewPhaseTwoMintPriceSet(uint256 newPrice);
    event NewPublicMintPriceSet(uint256 newPrice);

    // --------------------------------------------------------------
    // CUSTOM ERRORS
    // --------------------------------------------------------------

    error RoyaltyCutTooHigh();
    error FounderMintNotStarted();
    error PhaseTwoMintNotStarted();
    error PublicMintNotStarted();
    error TokensAlreadyMinted();
    error InsufficientEth();
    error AmountExceedsMax();
    error MintExceedsMaxPerAddress();
    error NftIDOutOfRange();
    error MerkleProofNotValid();
    error MintExceedsMaxSupply();
    error WithdrawEthFailed();

    // --------------------------------------------------------------
    // CONSTRUCTOR
    // --------------------------------------------------------------

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _phaseTwoPrice,
        uint256 _publicPrice,
        uint256 _maxPerAddressforSale,
        uint256 _maxPerAddressforPreSale,
        uint256 _maxTokenSupply,
        uint256 _phaseOneStartTime,
        uint256 _phaseTwoStartTime,
        uint256 _publicStartTime
    ) ERC721A(_name, _symbol) {
        MAX_PER_ADDRESS_PHASE_TWO = _maxPerAddressforPreSale;
        MAX_PER_ADDRESS_PUBLIC = _maxPerAddressforSale;
        MAX_TOKEN_SUPPLY = _maxTokenSupply;
        PHASE_ONE_START_TIME = _phaseOneStartTime;
        PHASE_TWO_START_TIME = _phaseTwoStartTime;
        PUBLIC_START_TIME = _publicStartTime;

        phaseTwoPrice = _phaseTwoPrice;
        publicPrice = _publicPrice;
    }

    // --------------------------------------------------------------
    // STATE-MODIFYING FUNCTIONS
    // --------------------------------------------------------------

    /// @notice Starts the Mintings with Tokenid at a count of one
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /// @notice first phase pre-sale mint for whitelisted accounts, free minting
    /// @param to receving address
    /// @param quantity amount an address can mint
    /// @param _merkleProof for whitelist verification
    function phaseOneMint(
        address to,
        uint256 quantity,
        bytes32[] calldata _merkleProof
    ) public {
        if (block.timestamp < PHASE_ONE_START_TIME) revert FounderMintNotStarted();

        if (phaseOneClaimed[msg.sender]) revert TokensAlreadyMinted();

        if (totalSupply() + quantity > MAX_TOKEN_SUPPLY) revert MintExceedsMaxSupply();

        // Merkle proof verification
        bool proofIsValid = MerkleProof.verify(
            _merkleProof,
            phaseOneMerkleRoot,
            keccak256(abi.encodePacked(msg.sender, quantity))
        );
        if (!proofIsValid) revert MerkleProofNotValid();

        phaseOneClaimed[msg.sender] = true;

        _safeMint(to, quantity);
    }

    /// @notice second phase pre-sale mint for whitelisted accounts, specified price
    /// @param to receving address
    /// @param quantity amount an address can mint
    /// @param _merkleProof for whitelist verification
    function phaseTwoMint(
        address to,
        uint256 quantity,
        bytes32[] calldata _merkleProof
    ) public payable {
        if (msg.value < phaseTwoPrice * quantity) revert InsufficientEth();

        if (block.timestamp < PHASE_TWO_START_TIME) revert PhaseTwoMintNotStarted();

        if (quantity + mintedTokens[msg.sender] > MAX_PER_ADDRESS_PHASE_TWO) revert AmountExceedsMax();

        if (totalSupply() + quantity > MAX_TOKEN_SUPPLY) revert MintExceedsMaxSupply();

        // Merkle proof verification
        bool proofIsValid = MerkleProof.verify(
            _merkleProof,
            phaseTwoMerkleRoot,
            keccak256(abi.encodePacked(msg.sender))
        );
        if (!proofIsValid) revert MerkleProofNotValid();

        mintedTokens[msg.sender] += quantity;

        _safeMint(to, quantity);
    }

    /// @notice public mint for non-whitelisted addresses
    /// @param to receving address
    /// @param quantity amount an address can mint
    function mint(address to, uint256 quantity) public payable {
        if (block.timestamp < PUBLIC_START_TIME) revert PublicMintNotStarted();

        if (msg.value < publicPrice * quantity) revert InsufficientEth();

        if (quantity + mintedTokens[msg.sender] > MAX_PER_ADDRESS_PUBLIC) revert MintExceedsMaxPerAddress();

        if (totalSupply() + quantity > MAX_TOKEN_SUPPLY) revert MintExceedsMaxSupply();

        mintedTokens[msg.sender] += quantity;

        _safeMint(to, quantity);
    }

    // --------------------------------------------------------------
    // ONLY OWNER FUNCTIONS
    // --------------------------------------------------------------

    function setPhaseTwoMintPrice(uint256 _price) public onlyOwner {
        phaseTwoPrice = _price;
        emit NewPhaseTwoMintPriceSet(_price);
    }

    function setPublicMintPrice(uint256 _price) public onlyOwner {
        publicPrice = _price;
        emit NewPublicMintPriceSet(_price);
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
        emit BaseURIUpdated(_baseURI);
    }

    function setURIExtention(string memory _extention) public onlyOwner {
        uriExtension = _extention;
        emit TokenURIExtentionSet(_extention);
    }

    function setPhaseOneMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        phaseOneMerkleRoot = _merkleRoot;
        emit PhaseOneMerkleRootUpdated(_merkleRoot);
    }

    function setPhaseTwoMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        phaseTwoMerkleRoot = _merkleRoot;
        emit PhaseTwoMerkleRootUpdated(_merkleRoot);
    }

    function setRoyaltyRecipient(address _newRecipient) public onlyOwner {
        royaltyRecipient = _newRecipient;
        emit NewRoyaltyRecipientSet(_newRecipient);
    }

    function setRoyaltyCut(uint256 _newCut) public onlyOwner {
        if (_newCut > SCALE) revert RoyaltyCutTooHigh();
        royaltyCut = _newCut;
        emit NewRoyaltyCutSet(_newCut);
    }

    function withdraw() public payable onlyOwner {
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        if (!os) revert WithdrawEthFailed();
    }

    // --------------------------------------------------------------
    // VIEW FUNCTIONS
    // --------------------------------------------------------------

    function tokenURI(uint256 _tokenID) public view override returns (string memory) {
        if (_tokenID > totalSupply()) revert NftIDOutOfRange();

        return bytes(baseURI).length != 0 ? string(abi.encodePacked(baseURI, toString(_tokenID), uriExtension)): '';
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721A, IERC165) returns (bool) {
        return ERC721A.supportsInterface(interfaceId) || interfaceId == type(IERC2981).interfaceId;
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        royaltyAmount = (_salePrice * royaltyCut) / SCALE;
        return (royaltyRecipient, royaltyAmount);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
