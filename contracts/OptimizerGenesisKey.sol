// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OptimizerGenesisKey
 * @notice NFT ERC-721 — Licença Utility do Optimizer Protocol
 * @dev 100 keys. 0.5–1 ETH each. Taxa zero + MEV share + Governance.
 *
 * Utility:
 * - Taxa zero no Optimizer router PARA SEMPRE
 * - % do MEV capturado do capital
 * - Acesso prioritário à Meta-Hook Factory (B2B)
 * - Direitos de voto em parâmetros do protocolo
 */
contract OptimizerGenesisKey is ERC721, Ownable, ReentrancyGuard {

    // ==================== STATE ====================

    uint256 private _nextTokenId = 1;
    uint256 public constant MAX_SUPPLY = 100;

    // Preços
    uint256 public priceETH = 0.5 ether;
    uint256 public priceETHBacker = 1 ether;
    uint256 public constant BACKER_SUPPLY = 50;

    // Rastreamento de mint
    uint256 public totalMinted;
    uint256 public totalRaised;
    bool public mintOpen = false;

    // Sistema de tiers
    enum Tier { NONE, GENESIS, BACKER }

    struct KeyInfo {
        Tier tier;
        uint256 mintedAt;
        uint256 totalMEVReceived;
        uint256 lastClaimAt;
        bool active;
    }

    mapping(uint256 => KeyInfo) public keys;
    mapping(address => uint256[]) public ownerKeys;
    mapping(address => Tier) public userTier;

    // Distribuição de MEV
    uint256 public pendingMEV;
    mapping(address => uint256) public pendingMEVPerUser;

    // Vesting (opcional — para alocação da equipe)
    uint256 public teamAllocation = 10; // 10 keys reservadas
    mapping(address => bool) public isTeam;

    // ==================== EVENTS ====================

    event KeyMinted(
        address indexed buyer,
        uint256 indexed tokenId,
        Tier tier,
        uint256 price,
        uint256 timestamp
    );
    event MEVDistributed(address indexed holder, uint256 amount);
    event MintOpened();
    event MintClosed();
    event PriceUpdated(uint256 newPrice);
    event FundsWithdrawn(address indexed to, uint256 amount);

    // ==================== ERRORS ====================

    error MaxSupplyReached();
    error MintNotOpen();
    error InsufficientPayment();
    error NotKeyHolder();
    error NothingToClaim();

    // ==================== MODIFIERS ====================

    modifier onlyKeyHolder() {
        if (userTier[msg.sender] == Tier.NONE) revert NotKeyHolder();
        _;
    }

    modifier mintingOpen() {
        if (!mintOpen) revert MintNotOpen();
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor() ERC721("Optimizer Genesis Key", "OGKEY") Ownable(msg.sender) {}

    // ==================== MINT ====================

    /**
     * @notice Mintar uma Genesis Key (0.5 ETH)
     */
    function mintGenesis() external payable nonReentrant mintingOpen {
        if (totalMinted >= MAX_SUPPLY) revert MaxSupplyReached();
        if (msg.value < priceETH) revert InsufficientPayment();

        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);

        keys[tokenId] = KeyInfo({
            tier: Tier.GENESIS,
            mintedAt: block.timestamp,
            totalMEVReceived: 0,
            lastClaimAt: block.timestamp,
            active: true
        });

        ownerKeys[msg.sender].push(tokenId);
        userTier[msg.sender] = Tier.GENESIS;
        totalMinted++;
        totalRaised += msg.value;

        // Reembolso de excesso
        if (msg.value > priceETH) {
            (bool sent, ) = msg.sender.call{value: msg.value - priceETH}("");
            require(sent, "Refund failed");
        }

        emit KeyMinted(msg.sender, tokenId, Tier.GENESIS, priceETH, block.timestamp);
    }

    /**
     * @notice Mintar uma Backer Key (1 ETH) — acesso prioritário
     */
    function mintBacker() external payable nonReentrant mintingOpen {
        if (totalMinted >= MAX_SUPPLY) revert MaxSupplyReached();
        if (msg.value < priceETHBacker) revert InsufficientPayment();

        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);

        keys[tokenId] = KeyInfo({
            tier: Tier.BACKER,
            mintedAt: block.timestamp,
            totalMEVReceived: 0,
            lastClaimAt: block.timestamp,
            active: true
        });

        ownerKeys[msg.sender].push(tokenId);
        userTier[msg.sender] = Tier.BACKER;
        totalMinted++;
        totalRaised += msg.value;

        // Reembolso de excesso
        if (msg.value > priceETHBacker) {
            (bool sent, ) = msg.sender.call{value: msg.value - priceETHBacker}("");
            require(sent, "Refund failed");
        }

        emit KeyMinted(msg.sender, tokenId, Tier.BACKER, priceETHBacker, block.timestamp);
    }

    // ==================== MEV DISTRIBUTION ====================

    /**
     * @notice Depositar lucros de MEV para distribuição aos titulares de keys
     * @dev Chamado pelo OptimizerHook após internalizar arbitragem
     */
    function depositMEV() external payable onlyOwner {
        pendingMEV += msg.value;
    }

    /**
     * @notice Reivindicar participação acumulada de MEV
     */
    function claimMEV() external nonReentrant onlyKeyHolder {
        uint256 share = _calculateMEVShare(msg.sender);
        if (share == 0) revert NothingToClaim();

        pendingMEVPerUser[msg.sender] = 0;
        pendingMEV -= share;

        keys[ownerKeys[msg.sender][0]].totalMEVReceived += share;
        keys[ownerKeys[msg.sender][0]].lastClaimAt = block.timestamp;

        (bool sent, ) = msg.sender.call{value: share}("");
        require(sent, "MEV claim failed");

        emit MEVDistributed(msg.sender, share);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getPendingMEV(address user) external view returns (uint256) {
        return _calculateMEVShare(user);
    }

    function getKeyInfo(uint256 tokenId) external view returns (KeyInfo memory) {
        return keys[tokenId];
    }

    function getOwnerKeys(address owner) external view returns (uint256[] memory) {
        return ownerKeys[owner];
    }

    function totalSupply() external view returns (uint256) {
        return totalMinted;
    }

    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }

    // ==================== ADMIN ====================

    function setMintOpen(bool _open) external onlyOwner {
        mintOpen = _open;
        if (_open) emit MintOpened();
        else emit MintClosed();
    }

    function setPrice(uint256 _price) external onlyOwner {
        priceETH = _price;
        emit PriceUpdated(_price);
    }

    function withdrawFunds(address to) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");

        (bool sent, ) = to.call{value: balance}("");
        require(sent, "Withdraw failed");

        emit FundsWithdrawn(to, balance);
    }

    function setTeam(address addr) external onlyOwner {
        isTeam[addr] = true;
    }

    // ==================== INTERNAL ====================

    function _calculateMEVShare(address user) internal view returns (uint256) {
        uint256 totalHolders = 0;
        for (uint256 i = 1; i <= totalMinted; i++) {
            if (keys[i].active) totalHolders++;
        }
        if (totalHolders == 0) return 0;

        uint256 userKeys = ownerKeys[user].length;
        if (userKeys == 0) return 0;

        return (pendingMEV * userKeys) / totalHolders;
    }

    receive() external payable {}
}
