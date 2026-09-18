// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOptimizerVault
 * @notice Interface for OptimizerVault — ERC-4626-style vault for yield distribution
 * @dev Full implementation is proprietary and kept off-chain
 */
interface IOptimizerVault {
    /**
     * @notice Deposit ETH into vault
     * @return shares Tokens issued
     */
    function deposit() external payable returns (uint256 shares);

    /**
     * @notice Withdraw ETH from vault
     * @param amount Amount to withdraw (0 = all)
     */
    function withdraw(uint256 amount) external;

    /**
     * @notice Claim accumulated yield
     */
    function claimYield() external;

    /**
     * @notice Get pending yield for user
     * @param user User address
     * @return Pending yield amount
     */
    function getPendingYield(address user) external view returns (uint256);

    /**
     * @notice Get position value for user
     * @param user User address
     * @return Position value (deposited + yield)
     */
    function getPositionValue(address user) external view returns (uint256);

    /**
     * @notice Get vault statistics
     * @return totalDeposits Total ETH deposited
     * @return totalYield Total yield accumulated
     * @return totalShares Total shares issued
     * @return yieldPerShare Yield per share
     */
    function getVaultStats() external view returns (
        uint256 totalDeposits,
        uint256 totalYield,
        uint256 totalShares,
        uint256 yieldPerShare
    );
}
