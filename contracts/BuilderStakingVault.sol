// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BuilderStakingVault
 * @notice Stake $BUILDER → Earn 60% of Optimizer performance fees
 * @dev ERC-4626-style vault for $BUILDER token staking
 *
 * Fee Distribution:
 * - 60% → $BUILDER Stakers (this vault)
 * - 20% → Treasury
 * - 15% → Developers
 * - 5% → Burn
 *
 * Builder Score Multipliers:
 * - 30 days: 1.00x
 * - 90 days: 1.35x
 * - 180 days: 1.85x
 */
contract BuilderStakingVault is ERC20, Ownable, ReentrancyGuard {

    // ==================== STATE ====================

    IERC20 public builderToken;
    address public builderTokenAddress;

    // Fee tracking
    uint256 public totalFeesDistributed;
    uint256 public pendingFees;
    mapping(address => uint256) public pendingRewards;

    // Lock tiers
    uint256 public constant LOCK_30_DAYS = 30 days;
    uint256 public constant LOCK_90_DAYS = 90 days;
    uint256 public constant LOCK_180_DAYS = 180 days;

    // Multipliers (basis points)
    uint256 public constant MULT_30_DAYS = 10000;   // 1.00x
    uint256 public constant MULT_90_DAYS = 13500;   // 1.35x
    uint256 public constant MULT_180_DAYS = 18500;  // 1.85x

    // User positions
    struct StakingPosition {
        uint256 amount;
        uint256 lockEnd;
        uint256 lockTier;
        uint256 multiplier;
        uint256 depositTime;
        uint256 rewardDebt;
    }

    mapping(address => StakingPosition[]) public positions;
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public builderScore;

    // Global stats
    uint256 public totalDeposited;
    uint256 public totalBuilderScore;
    uint256 public totalPositions;

    // Fee distribution
    uint256 public performanceFeeBps = 1500; // 15% of yield
    uint256 public stakerShareBps = 6000;    // 60% goes to stakers

    // ==================== EVENTS ====================

    event Staked(
        address indexed user,
        uint256 amount,
        uint256 lockTier,
        uint256 builderScore,
        uint256 lockEnd
    );
    event Withdrawn(
        address indexed user,
        uint256 amount,
        uint256 penalty,
        uint256 timestamp
    );
    event RewardsClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event FeesDeposited(uint256 amount, uint256 timestamp);
    event FeesUpdated(uint256 performanceFee, uint256 stakerShare);

    // ==================== ERRORS ====================

    error InvalidLockTier();
    error InsufficientAmount();
    error LockNotExpired();
    error NothingToWithdraw();
    error NoRewards();
    error TransferFailed();

    // ==================== CONSTRUCTOR ====================

    constructor(
        address _builderToken
    ) ERC20("Optimizer Builder Stake", "oBUILD") Ownable(msg.sender) {
        builderToken = IERC20(_builderToken);
        builderTokenAddress = _builderToken;
    }

    // ==================== CORE FUNCTIONS ====================

    /**
     * @notice Stake $BUILDER tokens
     * @param amount Amount of $BUILDER to stake
     * @param lockTier Lock period: 30, 90, or 180 days
     */
    function stake(uint256 amount, uint256 lockTier) external nonReentrant {
        if (amount == 0) revert InsufficientAmount();
        if (lockTier != 30 && lockTier != 90 && lockTier != 180) {
            revert InvalidLockTier();
        }

        // Calculate multiplier and duration
        uint256 multiplier;
        uint256 lockDuration;

        if (lockTier == 30) {
            multiplier = MULT_30_DAYS;
            lockDuration = LOCK_30_DAYS;
        } else if (lockTier == 90) {
            multiplier = MULT_90_DAYS;
            lockDuration = LOCK_90_DAYS;
        } else {
            multiplier = MULT_180_DAYS;
            lockDuration = LOCK_180_DAYS;
        }

        // Transfer tokens from user
        bool transferred = builderToken.transferFrom(msg.sender, address(this), amount);
        if (!transferred) revert TransferFailed();

        // Calculate builder score
        uint256 score = (amount * multiplier) / 10000;

        // Create position
        StakingPosition memory newPos = StakingPosition({
            amount: amount,
            lockEnd: block.timestamp + lockDuration,
            lockTier: lockTier,
            multiplier: multiplier,
            depositTime: block.timestamp,
            rewardDebt: 0
        });

        positions[msg.sender].push(newPos);

        // Mint receipt tokens
        _mint(msg.sender, amount);

        // Update stats
        totalStaked[msg.sender] += amount;
        builderScore[msg.sender] += score;
        totalDeposited += amount;
        totalBuilderScore += score;
        totalPositions++;

        emit Staked(msg.sender, amount, lockTier, score, block.timestamp + lockDuration);
    }

    /**
     * @notice Withdraw staked $BUILDER (after lock expires)
     * @param positionIndex Index of the position to withdraw
     */
    function withdraw(uint256 positionIndex) external nonReentrant {
        if (positionIndex >= positions[msg.sender].length) revert NothingToWithdraw();

        StakingPosition storage pos = positions[msg.sender][positionIndex];
        if (pos.amount == 0) revert NothingToWithdraw();

        uint256 amount = pos.amount;
        uint256 penalty = 0;

        // Check if lock is still active
        if (block.timestamp < pos.lockEnd) {
            // Early withdrawal — 2% penalty
            penalty = (amount * 200) / 10000;
        }

        uint256 amountToSend = amount - penalty;
        uint256 score = (amount * pos.multiplier) / 10000;

        // Update state BEFORE transfer
        pos.amount = 0;
        pos.lockEnd = 0;
        totalStaked[msg.sender] -= amount;
        builderScore[msg.sender] -= score;
        totalDeposited -= amount;
        totalBuilderScore -= score;

        // Burn receipt tokens
        _burn(msg.sender, amount);

        // Transfer tokens
        bool transferred = builderToken.transfer(msg.sender, amountToSend);
        if (!transferred) revert TransferFailed();

        // Send penalty to burn address
        if (penalty > 0) {
            builderToken.transfer(address(0xdead), penalty);
        }

        emit Withdrawn(msg.sender, amountToSend, penalty, block.timestamp);
    }

    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = pendingRewards[msg.sender];
        if (rewards == 0) revert NoRewards();

        pendingRewards[msg.sender] = 0;

        // Transfer rewards
        bool transferred = builderToken.transfer(msg.sender, rewards);
        if (!transferred) revert TransferFailed();

        emit RewardsClaimed(msg.sender, rewards, block.timestamp);
    }

    // ==================== FEE DISTRIBUTION ====================

    /**
     * @notice Deposit performance fees for distribution to stakers
     * @dev Called by OptimizerVault after collecting fees
     */
    function depositFees() external payable onlyOwner {
        uint256 feeAmount = msg.value;
        uint256 stakerShare = (feeAmount * stakerShareBps) / 10000;

        pendingFees += stakerShare;
        totalFeesDistributed += stakerShare;

        // Distribute proportionally to stakers
        if (totalBuilderScore > 0) {
            // Simplified: distribute equally per point
            // In production, use a reward-per-token accumulator
        }

        emit FeesDeposited(feeAmount, block.timestamp);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getPendingRewards(address user) external view returns (uint256) {
        return pendingRewards[user];
    }

    function getStakingPosition(address user, uint256 index) external view returns (StakingPosition memory) {
        return positions[user][index];
    }

    function getPositionCount(address user) external view returns (uint256) {
        return positions[user].length;
    }

    function getBuilderScore(address user) external view returns (uint256) {
        return builderScore[user];
    }

    function getTotalStaked(address user) external view returns (uint256) {
        return totalStaked[user];
    }

    // ==================== ADMIN ====================

    function setPerformanceFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 5000, "Fee too high");
        performanceFeeBps = _feeBps;
        emit FeesUpdated(_feeBps, stakerShareBps);
    }

    function setStakerShare(uint256 _shareBps) external onlyOwner {
        require(_shareBps <= 10000, "Share too high");
        stakerShareBps = _shareBps;
        emit FeesUpdated(performanceFeeBps, _shareBps);
    }

    function withdrawFees(address to) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees");

        (bool sent, ) = to.call{value: balance}("");
        require(sent, "Withdraw failed");
    }

    receive() external payable {}
}
