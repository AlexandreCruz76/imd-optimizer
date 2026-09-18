// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOptimizerGenesisKey
 * @notice Interface for OptimizerGenesisKey — ERC-721 NFT for protocol access
 * @dev Full implementation is proprietary and kept off-chain
 */
interface IOptimizerGenesisKey {
    /**
     * @notice Mint a Genesis Key
     */
    function mintGenesis() external payable;

    /**
     * @notice Mint a Backer Key
     */
    function mintBacker() external payable;

    /**
     * @notice Deposit MEV profits for distribution
     */
    function depositMEV() external payable;

    /**
     * @notice Claim accumulated MEV share
     */
    function claimMEV() external;

    /**
     * @notice Get pending MEV for user
     * @param user User address
     * @return Pending MEV
     */
    function getPendingMEV(address user) external view returns (uint256);

    /**
     * @notice Get key info for token
     * @param tokenId Token ID
     * @return tier Key tier
     * @return mintedAt Mint timestamp
     * @return totalMEVReceived Total MEV received
     */
    function getKeyInfo(uint256 tokenId) external view returns (
        uint8 tier,
        uint256 mintedAt,
        uint256 totalMEVReceived
    );

    /**
     * @notice Get total supply
     * @return Total minted keys
     */
    function totalSupply() external view returns (uint256);
}
