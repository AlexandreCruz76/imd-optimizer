// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OptimizerVaultTest
 * @notice Simplified vault for Sepolia testing — HARDENED VERSION
 * @dev Security fixes applied: reentrancy guard, yield limits, 2-step ownership, pause, input validation
 */

// ───────────────────────── Reentrancy Guard (inline, no OZ dependency) ─────────────────────────
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract OptimizerVaultTest is ReentrancyGuard {
    // ───────────────────────── State ─────────────────────────
    address public owner;
    address public pendingOwner;
    address public feeCollector;
    bool public paused;

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
    mapping(address => uint256) public dailyYieldAdded;
    mapping(address => uint256) public lastYieldDay;

    uint256 public totalDeposits;
    uint256 public totalYield;
    uint256 public totalFeesCollected;

    // Fee percentages (basis points)
    uint256[4] public tierFees = [2000, 1500, 1000, 500]; // 20%, 15%, 10%, 5%
    uint256[4] public tierCosts = [0, 50000000000000000, 200000000000000000, 500000000000000000]; // 0, 0.05, 0.2, 0.5 ETH
    uint256[4] public tierMinDeposit = [10000000000000000, 100000000000000000, 1000000000000000000, 10000000000000000000]; // 0.01, 0.1, 1, 10 ETH

    // Max deposit per user (anti-whale)
    uint256 public maxDepositPerUser = 50 ether;

    // Max daily yield injection (1% of total deposits)
    uint256 public maxYieldBpsPerDay = 100; // 1%

    // Events
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event YieldClaimed(address indexed user, uint256 amount, uint256 fee);
    event Subscribed(address indexed user, Tier tier, uint256 expiresAt);
    event YieldDistributed(uint256 amount);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);
    event FeesSwept(address indexed to, uint256 amount);
    event MaxDepositUpdated(uint256 oldMax, uint256 newMax);

    // ───────────────────────── Modifiers ─────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // ───────────────────────── Constructor ─────────────────────────
    constructor() {
        owner = msg.sender;
        feeCollector = msg.sender;
    }

    // ───────────────────────── Ownership (2-step) ─────────────────────────
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        pendingOwner = _newOwner;
        emit OwnershipTransferStarted(owner, _newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    // ───────────────────────── Pause ─────────────────────────
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ───────────────────────── Subscription ─────────────────────────
    function subscribe(Tier _tier) external payable whenNotPaused {
        require(!subscriptions[msg.sender].active, "Already subscribed");

        uint256 cost = tierCosts[uint256(_tier)];
        require(msg.value >= cost, "Insufficient cost");

        // Refund overpayment
        if (msg.value > cost) {
            uint256 refund = msg.value - cost;
            (bool sent, ) = payable(msg.sender).call{value: refund}("");
            require(sent, "Refund failed");
        }

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
    function deposit() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must deposit ETH");
        require(subscriptions[msg.sender].active, "Must be subscribed");
        require(block.timestamp < subscriptions[msg.sender].expiresAt, "Subscription expired");

        Subscription storage sub = subscriptions[msg.sender];
        require(msg.value >= tierMinDeposit[uint256(sub.tier)], "Below minimum deposit");

        // Anti-whale: max deposit per user
        Position storage pos = positions[msg.sender];
        require(pos.ethDeposited + msg.value <= maxDepositPerUser, "Exceeds max deposit");

        // Calculate shares
        uint256 shares = msg.value;

        if (pos.ethDeposited > 0) {
            shares = (msg.value * totalDeposits) / (totalDeposits - pos.ethDeposited + msg.value);
        }

        require(shares > 0, "Shares too small");

        pos.ethDeposited += msg.value;
        pos.shares += shares;
        pos.lastClaimAt = block.timestamp;

        totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value, shares);
    }

    // ───────────────────────── Withdraw ─────────────────────────
    function withdraw(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Must withdraw ETH");

        Position storage pos = positions[msg.sender];
        Subscription storage sub = subscriptions[msg.sender];

        require(pos.ethDeposited >= _amount, "Insufficient balance");
        require(pos.ethDeposited > 0, "No position");

        // Calculate fee on yield only
        uint256 yieldOnWithdraw = 0;
        if (pos.yieldEarned > 0 && pos.ethDeposited > 0) {
            yieldOnWithdraw = (_amount * pos.yieldEarned) / pos.ethDeposited;
            uint256 fee = (yieldOnWithdraw * tierFees[uint256(sub.tier)]) / 10000;
            totalFeesCollected += fee;
            yieldOnWithdraw -= fee;
        }

        // Calculate shares to burn
        uint256 sharesToBurn = 0;
        if (pos.shares > 0 && pos.ethDeposited > 0) {
            sharesToBurn = (_amount * pos.shares) / pos.ethDeposited;
        }

        // Update state BEFORE transfer (checks-effects-interactions)
        pos.ethDeposited -= _amount;
        pos.shares -= sharesToBurn;
        pos.yieldEarned -= yieldOnWithdraw;
        totalDeposits -= _amount;

        // Transfer ETH
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, _amount, sharesToBurn);
    }

    // ───────────────────────── Claim Yield ─────────────────────────
    function claimYield() external nonReentrant {
        Position storage pos = positions[msg.sender];
        Subscription storage sub = subscriptions[msg.sender];

        require(pos.yieldEarned > 0, "No yield to claim");
        require(sub.active, "Must be subscribed");

        uint256 yieldAmount = pos.yieldEarned;
        uint256 fee = (yieldAmount * tierFees[uint256(sub.tier)]) / 10000;
        uint256 netYield = yieldAmount - fee;

        // Update state BEFORE transfer
        pos.yieldEarned = 0;
        pos.lastClaimAt = block.timestamp;

        totalFeesCollected += fee;
        totalYield += yieldAmount;

        // Transfer net yield
        (bool success, ) = payable(msg.sender).call{value: netYield}("");
        require(success, "Transfer failed");

        emit YieldClaimed(msg.sender, netYield, fee);
    }

    // ───────────────────────── Admin Functions ─────────────────────────
    function addYieldToUser(address _user, uint256 _amount) external onlyOwner {
        require(_user != address(0), "Invalid address");
        require(_amount > 0, "Amount must be > 0");

        // Daily yield limit: max 1% of totalDeposits per day
        uint256 today = block.timestamp / 1 days;
        if (lastYieldDay[_user] != today) {
            dailyYieldAdded[_user] = 0;
            lastYieldDay[_user] = today;
        }

        uint256 maxYieldPerDay = (totalDeposits * maxYieldBpsPerDay) / 10000;
        require(dailyYieldAdded[_user] + _amount <= maxYieldPerDay, "Exceeds daily yield limit");

        dailyYieldAdded[_user] += _amount;
        pendingYields[_user] += _amount;
        positions[_user].yieldEarned += _amount;

        emit YieldDistributed(_amount);
    }

    function setFeeCollector(address _collector) external onlyOwner {
        require(_collector != address(0), "Invalid address");
        feeCollector = _collector;
    }

    function setMaxDepositPerUser(uint256 _max) external onlyOwner {
        require(_max > 0, "Max must be > 0");
        uint256 old = maxDepositPerUser;
        maxDepositPerUser = _max;
        emit MaxDepositUpdated(old, _max);
    }

    function sweepStuckFunds() external onlyOwner {
        uint256 vaultBalance = address(this).balance;
        uint256 accounted = totalDeposits + totalFeesCollected;
        require(vaultBalance > accounted, "No stuck funds");

        uint256 stuck = vaultBalance - accounted;
        (bool success, ) = payable(feeCollector).call{value: stuck}("");
        require(success, "Sweep failed");

        emit FeesSwept(feeCollector, stuck);
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

    function getDailyYieldAdded(address _user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        if (lastYieldDay[_user] != today) return 0;
        return dailyYieldAdded[_user];
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
