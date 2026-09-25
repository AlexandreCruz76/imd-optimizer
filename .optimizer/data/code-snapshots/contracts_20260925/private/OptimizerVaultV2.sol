// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OptimizerVaultV2
 * @notice Vault ERC-4626-style que recebe yield do OptimizerRouter
 * @dev Distribui MEV capturado como yield para LPs
 *
 * FLUXO:
 * 1. Usuário deposita ETH
 * 2. Vault posiciona na pool com hook
 * 3. Router captura MEV via vendas protegidas
 * 4. MEV é depositado no Vault como yield
 * 5. LPs reivindicam yield proporcional
 */
contract OptimizerVaultV2 is Ownable, ReentrancyGuard {

    // ==================== STATE ====================

    address public router; // OptimizerRouter endereço
    address public feeCollector;

    // Posições dos LPs
    struct Position {
        uint256 ethDeposited;
        uint256 shares;
        uint256 entryPrice;
        uint256 lastClaimAt;
        uint256 totalYield;
        uint256 yieldDebt; // Yield já reivindicado
    }

    // Tracking global
    uint256 public totalDeposits;
    uint256 public totalYieldAccumulated;
    uint256 public totalSharesIssued;

    // Yield per share (acumulado)
    uint256 public yieldPerShare; // Em wei, com 18 decimais de precisão

    // Posições
    mapping(address => Position) public positions;

    // Fee structure
    uint256 public performanceFeeBps = 1000; // 10% default
    mapping(address => uint256) public userFeeBps; // Override por usuário

    // Tier fees
    enum Tier { FREE, BASIC, PRO, WHALE }
    mapping(address => Tier) public userTier;
    mapping(Tier => uint256) public tierFeeBps;

    // ==================== EVENTS ====================

    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 yield, uint256 fee);
    event YieldReceived(uint256 amount, uint256 timestamp);
    event FeeCollected(uint256 amount);
    event TierUpdated(address indexed user, Tier tier);

    // ==================== ERRORS ====================

    error InsufficientDeposit();
    error NothingToWithdraw();
    error NothingToClaim();
    error InvalidAmount();
    error TransferFailed();

    // ==================== CONSTRUCTOR ====================

    constructor(address _router) Ownable(msg.sender) {
        router = _router;

        // Fee tiers
        tierFeeBps[Tier.FREE] = 2000;   // 20%
        tierFeeBps[Tier.BASIC] = 1500;  // 15%
        tierFeeBps[Tier.PRO] = 1000;    // 10%
        tierFeeBps[Tier.WHALE] = 500;   // 5%
    }

    // ==================== CORE FUNCTIONS ====================

    /**
     * @notice Deposita ETH no vault
     * @return shares Tokens de participação emitidos
     */
    function deposit() external payable nonReentrant returns (uint256 shares) {
        require(msg.value > 0, "Must deposit ETH");

        Position storage pos = positions[msg.sender];

        // Calcula shares baseado no preço atual
        if (totalSharesIssued == 0) {
            // Primeiro depósito: 1:1
            shares = msg.value;
        } else {
            // Depósitos subsequentes: proporcional ao valor total
            shares = (msg.value * totalSharesIssued) / totalDeposits;
        }

        require(shares > 0, "Shares too small");

        // Atualiza posição
        pos.ethDeposited += msg.value;
        pos.shares += shares;
        if (pos.entryPrice == 0) {
            pos.entryPrice = _getCurrentPrice();
        }
        pos.lastClaimAt = block.timestamp;

        // Atualiza globals
        totalDeposits += msg.value;
        totalSharesIssued += shares;

        emit Deposited(msg.sender, msg.value, shares);
    }

    /**
     * @notice Retira ETH do vault
     * @param amount Quantidade a retirar (0 = tudo)
     */
    function withdraw(uint256 amount) external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(pos.ethDeposited > 0, "No position");

        if (amount == 0 || amount > pos.ethDeposited) {
            amount = pos.ethDeposited;
        }

        require(amount > 0, "Nothing to withdraw");

        // Calcula yield proporcional
        uint256 yield = _calculatePendingYield(msg.sender);
        uint256 fee = _calculateFee(msg.sender, yield);
        uint256 withdrawAmount = amount;

        // Se há yield, aplica taxa
        if (yield > 0) {
            uint256 yieldProportion = (amount * yield) / (pos.ethDeposited + yield);
            fee = _calculateFee(msg.sender, yieldProportion);
            withdrawAmount = amount - fee;

            if (fee > 0) {
                totalYieldAccumulated += fee;
            }
        }

        // Atualiza estado ANTES da transferência
        pos.ethDeposited -= amount;
        pos.shares -= amount;
        totalDeposits -= amount;
        totalSharesIssued -= amount;

        // Transferência
        (bool sent, ) = msg.sender.call{value: withdrawAmount}("");
        require(sent, "Withdraw failed");

        emit Withdrawn(msg.sender, withdrawAmount);
    }

    /**
     * @notice Reivindica yield acumulado sem retirar depósito
     */
    function claimYield() external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(pos.ethDeposited > 0, "No position");

        uint256 pendingYield = _calculatePendingYield(msg.sender);
        require(pendingYield > 0, "Nothing to claim");

        uint256 fee = _calculateFee(msg.sender, pendingYield);
        uint256 claimAmount = pendingYield - fee;

        // Atualiza estado ANTES da transferência
        pos.totalYield += pendingYield;
        pos.yieldDebt += pendingYield;
        pos.lastClaimAt = block.timestamp;
        totalYieldAccumulated += fee;

        // Transferência
        (bool sent, ) = msg.sender.call{value: claimAmount}("");
        require(sent, "Claim failed");

        emit YieldClaimed(msg.sender, claimAmount, fee);
    }

    // ==================== YIELD RECEBIMENTO ====================

    /**
     * @notice Recebe yield do OptimizerRouter
     * @dev Chamado pelo Router após captura de MEV
     */
    function receiveYield() external payable onlyRouter {
        require(msg.value > 0, "No yield");

        // Atualiza yield per share
        if (totalSharesIssued > 0) {
            uint256 yieldPerShareDelta = (msg.value * 1e18) / totalSharesIssued;
            yieldPerShare += yieldPerShareDelta;
        }

        totalYieldAccumulated += msg.value;

        emit YieldReceived(msg.value, block.timestamp);
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @notice Calcula yield pendente para um usuário
     */
    function _calculatePendingYield(address user) internal view returns (uint256) {
        Position storage pos = positions[user];
        if (pos.shares == 0 || totalSharesIssued == 0) return 0;

        // Yield proporcional ao número de shares
        uint256 totalYield = totalYieldAccumulated - pos.yieldDebt;
        return (pos.shares * totalYield) / totalSharesIssued;
    }

    /**
     * @notice Calcula taxa para um usuário
     */
    function _calculateFee(address user, uint256 yield) internal view returns (uint256) {
        if (yield == 0) return 0;

        uint256 feeBps = userFeeBps[user];
        if (feeBps == 0) {
            feeBps = tierFeeBps[userTier[user]];
        }

        return (yield * feeBps) / 10000;
    }

    function getPositionValue(address user) external view returns (uint256) {
        Position storage pos = positions[user];
        uint256 yield = _calculatePendingYield(user);
        return pos.ethDeposited + yield;
    }

    function getPendingYield(address user) external view returns (uint256) {
        return _calculatePendingYield(user);
    }

    function getVaultStats() external view returns (
        uint256 totalDeposits_,
        uint256 totalYield_,
        uint256 totalShares_,
        uint256 yieldPerShare_
    ) {
        return (
            totalDeposits,
            totalYieldAccumulated,
            totalSharesIssued,
            yieldPerShare
        );
    }

    function _getCurrentPrice() internal view returns (uint256) {
        return 1000; // Placeholder — usar TWAP oracle
    }

    // ==================== ADMIN ====================

    modifier onlyRouter() {
        require(msg.sender == router, "Not router");
        _;
    }

    function setRouter(address _router) external onlyOwner {
        router = _router;
    }

    function setFeeCollector(address _collector) external onlyOwner {
        require(_collector != address(0), "Invalid address");
        feeCollector = _collector;
    }

    function setTierFee(Tier tier, uint256 bps) external onlyOwner {
        require(bps <= 5000, "Fee too high");
        tierFeeBps[tier] = bps;
    }

    function setUserTier(address user, Tier tier) external onlyOwner {
        userTier[user] = tier;
        emit TierUpdated(user, tier);
    }

    receive() external payable {}
}
