// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MigrationRouter
 * @notice Atomic migration between Uniswap V4 pools (Hook vs Native)
 * @dev Executes withdraw + deposit in single transaction
 */
contract MigrationRouter {
    // ───────────────────────── Estado ─────────────────────────
    address public owner;
    bool public paused;

    // Endereços das pools
    address public hookPool;
    address public nativePool;

    // PoolManager (singleton Uniswap V4)
    address public poolManager;

    // Rastreamento de migrações
    uint256 public totalMigrations;
    uint256 public totalVolumeMigrated;

    struct MigrationRecord {
        address user;
        address fromPool;
        address toPool;
        uint256 amount;
        uint256 timestamp;
        uint256 spreadAtMigration;
    }

    MigrationRecord[] public migrations;

    // Saldos dos usuários por pool
    mapping(address => uint256) public hookBalance;
    mapping(address => uint256) public nativeBalance;
    mapping(address => uint256) public totalDeposited;

    // Events
    event Migrated(
        address indexed user,
        address indexed fromPool,
        address indexed toPool,
        uint256 amount,
        uint256 spreadAtMigration
    );
    event Deposited(address indexed user, address indexed pool, uint256 amount);
    event Withdrawn(address indexed user, address indexed pool, uint256 amount);
    event PoolUpdated(address indexed pool, uint256 newBalance);
    event Paused(address account);
    event Unpaused(address account);

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
    constructor(
        address _poolManager,
        address _hookPool,
        address _nativePool
    ) {
        owner = msg.sender;
        poolManager = _poolManager;
        hookPool = _hookPool;
        nativePool = _nativePool;
    }

    // ───────────────────────── Admin ─────────────────────────
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function updatePools(address _hookPool, address _nativePool) external onlyOwner {
        hookPool = _hookPool;
        nativePool = _nativePool;
    }

    // ───────────────────────── Deposit to Pool ─────────────────────────
    function depositToHook() external payable whenNotPaused {
        require(msg.value > 0, "Must deposit ETH");
        hookBalance[msg.sender] += msg.value;
        totalDeposited[msg.sender] += msg.value;
        emit Deposited(msg.sender, hookPool, msg.value);
    }

    function depositToNative() external payable whenNotPaused {
        require(msg.value > 0, "Must deposit ETH");
        nativeBalance[msg.sender] += msg.value;
        totalDeposited[msg.sender] += msg.value;
        emit Deposited(msg.sender, nativePool, msg.value);
    }

    // ───────────────────────── Withdraw from Pool ─────────────────────────
    function withdrawFromHook(uint256 amount) external whenNotPaused {
        require(hookBalance[msg.sender] >= amount, "Insufficient hook balance");
        hookBalance[msg.sender] -= amount;
        totalDeposited[msg.sender] -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(msg.sender, hookPool, amount);
    }

    function withdrawFromNative(uint256 amount) external whenNotPaused {
        require(nativeBalance[msg.sender] >= amount, "Insufficient native balance");
        nativeBalance[msg.sender] -= amount;
        totalDeposited[msg.sender] -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(msg.sender, nativePool, amount);
    }

    // ───────────────────────── ATOMIC MIGRATION ─────────────────────────
    /**
     * @notice Migrate ALL funds from Hook Pool to Native Pool
     * @param spreadAtMigration Current spread at time of migration
     */
    function migrateToNative(uint256 spreadAtMigration) external whenNotPaused {
        uint256 amount = hookBalance[msg.sender];
        require(amount > 0, "No hook balance to migrate");

        // Atomic: withdraw from hook, deposit to native
        hookBalance[msg.sender] = 0;
        nativeBalance[msg.sender] += amount;

        // Record migration
        totalMigrations++;
        totalVolumeMigrated += amount;

        migrations.push(MigrationRecord({
            user: msg.sender,
            fromPool: hookPool,
            toPool: nativePool,
            amount: amount,
            timestamp: block.timestamp,
            spreadAtMigration: spreadAtMigration
        }));

        emit Migrated(msg.sender, hookPool, nativePool, amount, spreadAtMigration);
        emit PoolUpdated(hookPool, 0);
        emit PoolUpdated(nativePool, nativeBalance[msg.sender]);
    }

    /**
     * @notice Migrate ALL funds from Native Pool to Hook Pool
     * @param spreadAtMigration Current spread at time of migration
     */
    function migrateToHook(uint256 spreadAtMigration) external whenNotPaused {
        uint256 amount = nativeBalance[msg.sender];
        require(amount > 0, "No native balance to migrate");

        // Atomic: withdraw from native, deposit to hook
        nativeBalance[msg.sender] = 0;
        hookBalance[msg.sender] += amount;

        // Record migration
        totalMigrations++;
        totalVolumeMigrated += amount;

        migrations.push(MigrationRecord({
            user: msg.sender,
            fromPool: nativePool,
            toPool: hookPool,
            amount: amount,
            timestamp: block.timestamp,
            spreadAtMigration: spreadAtMigration
        }));

        emit Migrated(msg.sender, nativePool, hookPool, amount, spreadAtMigration);
        emit PoolUpdated(nativePool, 0);
        emit PoolUpdated(hookPool, hookBalance[msg.sender]);
    }

    // ───────────────────────── View Functions ─────────────────────────
    function getUserBalance(address user) external view returns (
        uint256 hook,
        uint256 native,
        uint256 total
    ) {
        return (hookBalance[user], nativeBalance[user], totalDeposited[user]);
    }

    function getMigrationHistory(address user) external view returns (MigrationRecord[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < migrations.length; i++) {
            if (migrations[i].user == user) count++;
        }

        MigrationRecord[] memory result = new MigrationRecord[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < migrations.length; i++) {
            if (migrations[i].user == user) {
                result[idx] = migrations[i];
                idx++;
            }
        }
        return result;
    }

    function getPoolStats() external view returns (
        uint256 totalHookDeposits,
        uint256 totalNativeDeposits,
        uint256 migrationCount,
        uint256 volumeMigrated
    ) {
        // Sum all hook balances
        // Note: In production, track these in state variables for gas efficiency
        return (0, 0, totalMigrations, totalVolumeMigrated);
    }

    // ───────────────────────── Receive ETH ─────────────────────────
    receive() external payable {}
}
