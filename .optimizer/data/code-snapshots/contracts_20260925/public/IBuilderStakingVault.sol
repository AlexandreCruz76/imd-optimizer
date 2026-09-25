// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBuilderStakingVault
 * @notice Interface for BuilderStakingVault — Stake $BUILDER to earn fees
 * @dev Full implementation is proprietary and kept off-chain
 */
interface IBuilderStakingVault {
    /**
     * @notice Stake $BUILDER tokens
     * @param amount Amount to stake
     * @param lockTier Lock period: 30, 90, or 180 days
     */
    function stake(uint256 amount, uint256 lockTier) external;

    /**
     * @notice Withdraw staked $BUILDER
     * @param positionIndex Position index to withdraw
     */
    function withdraw(uint256 positionIndex) external;

    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external;

    /**
     * @notice Deposit performance fees
     */
    function depositFees() external payable;

    /**
     * @notice Get pending rewards for user
     * @param user User address
     * @return Pending rewards
     */
    function getPendingRewards(address user) external view returns (uint256);

    /**
     * @notice Get builder score for user
     * @param user User address
     * @return Builder score
     */
    function getBuilderScore(address user) external view returns (uint256);
}
