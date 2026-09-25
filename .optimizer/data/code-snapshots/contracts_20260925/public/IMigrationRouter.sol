// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMigrationRouter
 * @notice Interface for MigrationRouter — Atomic migration between pools
 * @dev Full implementation is proprietary and kept off-chain
 */
interface IMigrationRouter {
    /**
     * @notice Deposit ETH to Hook Pool
     */
    function depositToHook() external payable;

    /**
     * @notice Deposit ETH to Native Pool
     */
    function depositToNative() external payable;

    /**
     * @notice Migrate liquidity from Native to Hook Pool
     * @param amount Amount of ETH to migrate
     */
    function migrateToHook(uint256 amount) external;

    /**
     * @notice Migrate liquidity from Hook to Native Pool
     * @param amount Amount of ETH to migrate
     */
    function migrateToNative(uint256 amount) external;

    /**
     * @notice Get user balance
     * @param user User address
     * @return hook Balance in Hook Pool
     * @return native Balance in Native Pool
     * @return total Total balance
     */
    function getUserBalance(address user) external view returns (
        uint256 hook,
        uint256 native,
        uint256 total
    );
}
