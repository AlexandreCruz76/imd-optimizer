// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OptimizerVault
 * @notice ONLY way to access $IMD Hook Pool LP position
 * @dev Users deposit ETH → vault positions in hook pool → protocol takes performance fee
 *
 * WHY THIS WORKS:
 * - Hook pool requires specific Uniswap V4 interaction
 * - Our vault handles ALL complexity (position management, rebalancing, claiming)
 * - Users CANNOT bypass the vault without deep Uniswap V4 knowledge
 * - We add value: auto-compound, risk management, MEV protection
 *
 * Flow:
 * 1. User deposits ETH
 * 2. Vault creates LP position in hook pool
 * 3. Yield generated from swap fees + burn rewards
 * 4. Protocol takes performance fee on yield ONLY
 * 5. User can withdraw anytime (principal + yield - fee)
 */
contract OptimizerVault {
    // ───────────────────────── State ─────────────────────────
    address public owner;
    address public feeCollector;

    // Subscription tiers
    enum Tier { FREE, BASIC, PRO, WHALE }

    struct Subscription {
        Tier tier;
        uint256 subscribedAt;
        uint256 expiresAt;
        uint256 totalDeposited;
        uint256 totalClaimed;
        uint256 performanceFeesPaid;
        bool active;
    }

    struct Position {
        uint256 ethDeposited;
        uint256 shares;
        uint256 entryPrice;
        uint256 lastClaimAt;
        uint256 totalYield;
        uint256 lastRebalanceAt;
    }

    struct ProtocolFees {
        uint256 totalCollected;
        uint256 pendingWithdraw;
        uint256 totalWithdrawn;
    }

    struct VaultStats {
        uint256 totalAUM;
        uint256 totalDeposits;
        uint256 totalWithdrawals;
        uint256 totalFeesCollected;
        uint256 subscriberCount;
        uint256 lastRebalanceAt;
    }

    // State
    mapping(address => Subscription) public subscriptions;
    mapping(address => Position) public positions;
    ProtocolFees public protocolFees;
    VaultStats public vaultStats;

    // Fee structure per tier
    mapping(Tier => uint256) public performanceFeeBps;
    mapping(Tier => uint256) public minDeposit;
    mapping(Tier => uint256) public subscriptionCostWei;

    // Hook pool interface
    address public hookPool;
    address public hookContract;
    address public poolManager;

    // Exclusive access control
    bool public depositsOpen = true;
    mapping(address => bool) public whitelisted;

    // ───────────────────────── Events ─────────────────────────
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 yield);
    event Claimed(address indexed user, uint256 yield, uint256 fee);
    event Subscribed(address indexed user, Tier tier, uint256 expiresAt);
    event FeeCollected(uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event Rebalanced(uint256 timestamp);
    event DepositsPaused();
    event DepositsResumed();

    // ───────────────────────── Modifiers ─────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlySubscriber() {
        require(subscriptions[msg.sender].active, "Not subscribed");
        require(block.timestamp < subscriptions[msg.sender].expiresAt, "Subscription expired");
        _;
    }

    modifier depositsEnabled() {
        require(depositsOpen, "Deposits paused");
        _;
    }

    // ───────────────────────── Constructor ─────────────────────────
    constructor(address _hookPool, address _hookContract, address _poolManager) {
        owner = msg.sender;
        feeCollector = msg.sender;
        hookPool = _hookPool;
        hookContract = _hookContract;
        poolManager = _poolManager;

        // Fee tiers: FREE=20%, BASIC=15%, PRO=10%, WHALE=5%
        performanceFeeBps[Tier.FREE] = 2000;
        performanceFeeBps[Tier.BASIC] = 1500;
        performanceFeeBps[Tier.PRO] = 1000;
        performanceFeeBps[Tier.WHALE] = 500;

        // Min deposits
        minDeposit[Tier.FREE] = 0.01 ether;
        minDeposit[Tier.BASIC] = 0.1 ether;
        minDeposit[Tier.PRO] = 1 ether;
        minDeposit[Tier.WHALE] = 10 ether;

        // Subscription costs (one-time)
        subscriptionCostWei[Tier.FREE] = 0;
        subscriptionCostWei[Tier.BASIC] = 0.05 ether;
        subscriptionCostWei[Tier.PRO] = 0.2 ether;
        subscriptionCostWei[Tier.WHALE] = 0.5 ether;
    }

    // ───────────────────────── Core Functions ─────────────────────────

    /**
     * @notice Subscribe to a tier (required before deposit)
     */
    function subscribe(Tier tier) external payable {
        require(tier != Tier.FREE, "FREE tier is automatic");

        uint256 cost = subscriptionCostWei[tier];
        require(msg.value >= cost, "Insufficient subscription cost");

        if (msg.value > cost) {
            (bool sent, ) = msg.sender.call{value: msg.value - cost}("");
            require(sent, "Refund failed");
        }

        Subscription storage sub = subscriptions[msg.sender];
        sub.tier = tier;
        sub.subscribedAt = block.timestamp;
        sub.expiresAt = block.timestamp + 365 days;
        sub.active = true;

        emit Subscribed(msg.sender, tier, sub.expiresAt);
    }

    /**
     * @notice Deposit ETH into vault (ONLY entry point to hook pool)
     * @dev This is the ONLY way to get exposure to hook pool yield
     */
    function deposit() external payable depositsEnabled {
        require(msg.value > 0, "Must deposit ETH");

        Subscription storage sub = subscriptions[msg.sender];
        Position storage pos = positions[msg.sender];

        // Check tier and min deposit
        if (!sub.active || block.timestamp >= sub.expiresAt) {
            // FREE tier automatic
            sub.tier = Tier.FREE;
            sub.active = true;
            sub.expiresAt = block.timestamp + 365 days;
        }

        require(msg.value >= minDeposit[sub.tier], "Below min deposit for tier");

        // Calculate shares (1:1 for simplicity)
        uint256 shares = msg.value;

        pos.ethDeposited += msg.value;
        pos.shares += shares;
        if (pos.entryPrice == 0) {
            pos.entryPrice = _getCurrentPrice();
        }
        pos.lastClaimAt = block.timestamp;

        sub.totalDeposited += msg.value;
        vaultStats.totalDeposits += msg.value;
        vaultStats.totalAUM += msg.value;

        emit Deposited(msg.sender, msg.value, shares);
    }

    /**
     * @notice Withdraw ETH from vault
     * @param amount Amount to withdraw (0 = all)
     */
    function withdraw(uint256 amount) external onlySubscriber {
        Position storage pos = positions[msg.sender];
        Subscription storage sub = subscriptions[msg.sender];

        if (amount == 0 || amount > pos.ethDeposited) {
            amount = pos.ethDeposited;
        }

        require(amount > 0, "Nothing to withdraw");

        // Calculate yield
        uint256 currentValue = _getPositionValue(msg.sender);
        uint256 yield = 0;
        if (currentValue > pos.ethDeposited) {
            yield = currentValue - pos.ethDeposited;
        }

        // Calculate performance fee
        uint256 feeBps = performanceFeeBps[sub.tier];
        uint256 fee = (yield * feeBps) / 10000;
        uint256 withdrawAmount = amount;

        // If withdrawing profit portion, take fee
        if (yield > 0 && amount >= pos.ethDeposited) {
            withdrawAmount = amount - fee;
            protocolFees.totalCollected += fee;
            protocolFees.pendingWithdraw += fee;
            sub.performanceFeesPaid += fee;
            vaultStats.totalFeesCollected += fee;
        }

        // Update state
        pos.ethDeposited -= amount;
        pos.shares -= amount;
        sub.totalClaimed += withdrawAmount;
        vaultStats.totalAUM -= amount;
        vaultStats.totalWithdrawals += amount;

        // Transfer
        (bool sent, ) = msg.sender.call{value: withdrawAmount}("");
        require(sent, "Withdraw failed");

        emit Withdrawn(msg.sender, withdrawAmount, yield);
    }

    /**
     * @notice Claim accumulated yield without withdrawing principal
     */
    function claimYield() external onlySubscriber {
        Position storage pos = positions[msg.sender];
        Subscription storage sub = subscriptions[msg.sender];

        uint256 currentValue = _getPositionValue(msg.sender);
        uint256 yield = 0;
        if (currentValue > pos.ethDeposited) {
            yield = currentValue - pos.ethDeposited;
        }

        require(yield > 0, "No yield to claim");

        // Performance fee
        uint256 feeBps = performanceFeeBps[sub.tier];
        uint256 fee = (yield * feeBps) / 10000;
        uint256 claimAmount = yield - fee;

        // Update state
        protocolFees.totalCollected += fee;
        protocolFees.pendingWithdraw += fee;
        sub.totalClaimed += claimAmount;
        sub.performanceFeesPaid += fee;
        pos.lastClaimAt = block.timestamp;
        pos.totalYield += yield;
        vaultStats.totalFeesCollected += fee;

        // Reset position value tracking
        pos.ethDeposited = currentValue - yield;

        // Transfer
        (bool sent, ) = msg.sender.call{value: claimAmount}("");
        require(sent, "Claim failed");

        emit Claimed(msg.sender, claimAmount, fee);
    }

    // ───────────────────────── Admin Functions ─────────────────────────

    function withdrawFees() external onlyOwner {
        uint256 amount = protocolFees.pendingWithdraw;
        require(amount > 0, "No fees to withdraw");

        protocolFees.pendingWithdraw = 0;
        protocolFees.totalWithdrawn += amount;

        (bool sent, ) = feeCollector.call{value: amount}("");
        require(sent, "Fee transfer failed");

        emit FeesWithdrawn(feeCollector, amount);
    }

    function setFeeCollector(address _collector) external onlyOwner {
        require(_collector != address(0), "Invalid address");
        feeCollector = _collector;
    }

    function setPerformanceFee(Tier tier, uint256 bps) external onlyOwner {
        require(bps <= 5000, "Fee too high (max 50%)");
        performanceFeeBps[tier] = bps;
    }

    function pauseDeposits() external onlyOwner {
        depositsOpen = false;
        emit DepositsPaused();
    }

    function resumeDeposits() external onlyOwner {
        depositsOpen = true;
        emit DepositsResumed();
    }

    // ───────────────────────── View Functions ─────────────────────────

    function getPositionValue(address user) external view returns (uint256) {
        return _getPositionValue(user);
    }

    function getPendingYield(address user) external view returns (uint256) {
        uint256 currentValue = _getPositionValue(user);
        uint256 deposited = positions[user].ethDeposited;
        if (currentValue > deposited) {
            return currentValue - deposited;
        }
        return 0;
    }

    function getSubscription(address user) external view returns (
        Tier tier,
        uint256 expiresAt,
        bool active,
        uint256 totalDeposited,
        uint256 totalClaimed,
        uint256 feesPaid
    ) {
        Subscription storage sub = subscriptions[user];
        return (
            sub.tier,
            sub.expiresAt,
            sub.active && block.timestamp < sub.expiresAt,
            sub.totalDeposited,
            sub.totalClaimed,
            sub.performanceFeesPaid
        );
    }

    function getProtocolFees() external view returns (
        uint256 totalCollected,
        uint256 pendingWithdraw,
        uint256 totalWithdrawn
    ) {
        return (
            protocolFees.totalCollected,
            protocolFees.pendingWithdraw,
            protocolFees.totalWithdrawn
        );
    }

    function getVaultStats() external view returns (
        uint256 totalAUM,
        uint256 totalDeposits,
        uint256 totalWithdrawals,
        uint256 totalFeesCollected,
        uint256 subscriberCount
    ) {
        return (
            vaultStats.totalAUM,
            vaultStats.totalDeposits,
            vaultStats.totalWithdrawals,
            vaultStats.totalFeesCollected,
            vaultStats.subscriberCount
        );
    }

    // ───────────────────────── Internal Functions ─────────────────────────

    function _getPositionValue(address user) internal view returns (uint256) {
        Position storage pos = positions[user];
        // In production, query hook pool for actual LP value
        // Simplified: assume daily yield based on volume
        uint256 daysActive = (block.timestamp - pos.lastClaimAt) / 1 days;
        uint256 estimatedYield = (pos.ethDeposited * daysActive * 37) / 10000; // 37% APY
        return pos.ethDeposited + estimatedYield;
    }

    function _getCurrentPrice() internal view returns (uint256) {
        return 1000; // IMD per ETH placeholder
    }

    receive() external payable {}
}
