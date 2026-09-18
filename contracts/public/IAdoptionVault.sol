// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAdoptionVault
 * @notice Interface for AdoptionVault — Fundraising for mainnet deployment
 * @dev Full implementation is proprietary and kept off-chain
 */
interface IAdoptionVault {
    /**
     * @notice Join a support tier
     * @param tier Tier to join
     * @param message Optional message
     */
    function joinTier(uint8 tier, string calldata message) external payable;

    /**
     * @notice Upgrade to higher tier
     * @param newTier New tier
     */
    function upgradeTier(uint8 newTier) external payable;

    /**
     * @notice Claim benefits
     */
    function claimBenefits() external;

    /**
     * @notice Get supporter benefits
     * @param supporter Supporter address
     * @return tier Supporter tier
     * @return feeDiscount Fee discount in basis points
     * @return revenueShare Revenue share in basis points
     * @return maxPositions Maximum positions allowed
     */
    function getSupporterBenefits(address supporter) external view returns (
        uint8 tier,
        uint256 feeDiscount,
        uint256 revenueShare,
        uint256 maxPositions
    );

    /**
     * @notice Get total raised
     * @return Total ETH raised
     */
    function totalRaised() external view returns (uint256);

    /**
     * @notice Get supporter count
     * @return Number of supporters
     */
    function getSupporterCount() external view returns (uint256);
}
