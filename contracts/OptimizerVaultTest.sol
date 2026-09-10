// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OptimizerVaultTest
 * @notice Simplified vault for Sepolia testing
 * @dev Simulates vault mechanics without Uniswap V4 integration
 */
contract OptimizerVaultTest {
    // ───────────────────────── State ─────────────────────────
    address public owner;
    address public feeCollector;

    // Subscription tiers
    enum Tier { FREE, BASIC, PRO, WHALE }

    struct Subscription {
        Tier tier;
        uint256 subscribedAt;
        uint256 expiresAt;
        bool active;
    }

    struct Position {
        uint256 ethDeposited;
        uint256 shares;
        uint256 yieldEarned;
        uint256 lastClaimAt;
    }

    // Storage
    mapping(address => Subscription) public subscriptions;
    mapping(address => Position) public positions;
    mapping(address => uint256) public pendingYields;

    uint256 public totalDeposits;
    uint256 public totalYield;
    uint256 public totalFeesCollected;

    // Fee percentages (basis points)
    uint256[4] public tierFees = [2000, 1500, 1000, 500]; // 20%, 15%, 10%, 5%
    uint256[4] public tierCosts = [0, 50000000000000000, 200000000000000000, 500000000000000000]; // 0, 0.05, 0.2, 0.5 ETH
    uint256[4] public tierMinDeposit = [10000000000000000, 100000000000000000, 1000000000000000000, 10000000000000000000]; // 0.01, 0.1, 1, 10 ETH

    // Events
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event YieldClaimed(address indexed user, uint256 amount, uint256 fee);
    event Subscribed(address indexed user, Tier tier, uint256 expiresAt);
    event YieldDistributed(uint256 amount);

    // ───────────────────────── Modifiers ─────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ───────────────────────── Constructor ─────────────────────────
    constructor() {
        owner = msg.sender;
        feeCollector = msg.sender;
    }

    // ───────────────────────── Subscription ─────────────────────────
    function subscribe(Tier _tier) external payable {
        require(!subscriptions[msg.sender].active, "Already subscribed");
        require(msg.value >= tierCosts[uint256(_tier)], "Insufficient cost");

        uint256 expiresAt = block.timestamp + 365 days;

        subscriptions[msg.sender] = Subscription({
            tier: _tier,
            subscribedAt: block.timestamp,
            expiresAt: expiresAt,
            active: true
        });

        emit Subscribed(msg.sender, _tier, expiresAt);
    }

    // ───────────────────────── Deposit ─────────────────────────
    function deposit() external payable {
        require(msg.value > 0, "Must deposit ETH");
        require(subscriptions[msg.sender].active, "Must be subscribed");
        require(block.timestamp < subscriptions[msg.sender].expiresAt, "Subscription expired");

        Subscription storage sub = subscriptions[msg.sender];
        require(msg.value >= tierMinDeposit[uint256(sub.tier)], "Below minimum deposit");

        Position storage pos = positions[msg.sender];

        // Calculate shares (1 ETH = 1 share initially)
        uint256 shares = msg.value;

        if (pos.ethDeposited > 0) {
            // Proportional shares based on total deposits
            shares = (msg.value * totalDeposits) / (totalDeposits - pos.ethDeposited + msg.value);
        }

        pos.ethDeposited += msg.value;
        pos.shares += shares;
        pos.lastClaimAt = block.timestamp;

        totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value, shares);
    }

    // ───────────────────────── Withdraw ─────────────────────────
    function withdraw(uint256 _amount) external {
        require(_amount > 0, "Must withdraw ETH");
        require(positions[msg.sender].ethDeposited >= _amount, "Insufficient balance");

        Position storage pos = positions[msg.sender];
        Subscription storage sub = subscriptions[msg.sender];

        // Calculate fee on yield only
        uint256 yieldOnWithdraw = 0;
        if (pos.yieldEarned > 0) {
            yieldOnWithdraw = (_amount * pos.yieldEarned) / pos.ethDeposited;
            uint256 fee = (yieldOnWithdraw * tierFees[uint256(sub.tier)]) / 10000;
            totalFeesCollected += fee;
            yieldOnWithdraw -= fee;
        }

        // Update position
        uint256 sharesToBurn = (_amount * pos.shares) / pos.ethDeposited;
        pos.ethDeposited -= _amount;
        pos.shares -= sharesToBurn;
        totalDeposits -= _amount;

        // Transfer ETH
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, _amount, sharesToBurn);
    }

    // ───────────────────────── Claim Yield ─────────────────────────
    function claimYield() external {
        Position storage pos = positions[msg.sender];
        Subscription storage sub = subscriptions[msg.sender];

        require(pos.yieldEarned > 0, "No yield to claim");
        require(sub.active, "Must be subscribed");

        uint256 yieldAmount = pos.yieldEarned;
        uint256 fee = (yieldAmount * tierFees[uint256(sub.tier)]) / 10000;
        uint256 netYield = yieldAmount - fee;

        // Reset yield
        pos.yieldEarned = 0;
        pos.lastClaimAt = block.timestamp;

        // Update totals
        totalFeesCollected += fee;
        totalYield += yieldAmount;

        // Transfer net yield
        (bool success, ) = payable(msg.sender).call{value: netYield}("");
        require(success, "Transfer failed");

        emit YieldClaimed(msg.sender, netYield, fee);
    }

    // ───────────────────────── Admin Functions ─────────────────────────
    function distributeYield() external onlyOwner {
        // Simulate yield distribution (5% of total deposits per day for testing)
        uint256 dailyYield = (totalDeposits * 500) / 10000 / 365;
        if (dailyYield > 0) {
            // Distribute proportionally to all depositors
            // For simplicity, just add to a test user
            pendingYields[owner] += dailyYield;
            emit YieldDistributed(dailyYield);
        }
    }

    function addYieldToUser(address _user, uint256 _amount) external onlyOwner {
        pendingYields[_user] += _amount;
        positions[_user].yieldEarned += _amount;
        emit YieldDistributed(_amount);
    }

    function setFeeCollector(address _collector) external onlyOwner {
        feeCollector = _collector;
    }

    // ───────────────────────── View Functions ─────────────────────────
    function getPosition(address _user) external view returns (
        uint256 ethDeposited,
        uint256 shares,
        uint256 yieldEarned,
        uint256 lastClaimAt
    ) {
        Position storage pos = positions[_user];
        return (pos.ethDeposited, pos.shares, pos.yieldEarned, pos.lastClaimAt);
    }

    function getSubscription(address _user) external view returns (
        Tier tier,
        uint256 subscribedAt,
        uint256 expiresAt,
        bool active
    ) {
        Subscription storage sub = subscriptions[_user];
        return (sub.tier, sub.subscribedAt, sub.expiresAt, sub.active);
    }

    function getTierInfo(Tier _tier) external view returns (
        uint256 fee,
        uint256 cost,
        uint256 minDeposit
    ) {
        return (tierFees[uint256(_tier)], tierCosts[uint256(_tier)], tierMinDeposit[uint256(_tier)]);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
