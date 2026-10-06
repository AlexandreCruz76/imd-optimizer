// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBuildercoin
 * @notice Interface for Buildercoin — dNFT ERC-721 (Tier 1 Alpha)
 * @dev Full implementation is proprietary and kept off-chain
 */
interface IBuildercoin {
    /**
     * @notice Mint the Buildercoin (0.05 ETH exact) with atomic 40/40/20 genesis split
     */
    function mint() external payable;

    /**
     * @notice Current dNFT level of a token (starts at 1)
     * @param tokenId Token ID
     * @return Level (1 = Bronze … 4 = Neon)
     */
    function tokenLevel(uint256 tokenId) external view returns (uint8);

    /**
     * @notice Update the dNFT level — authorized callers only (admin/relayer/protocol contracts)
     * @param tokenId Token ID
     * @param newLevel New level (1..4)
     */
    function updateTokenLevel(uint256 tokenId, uint8 newLevel) external;

    /**
     * @notice Check if an account may call updateTokenLevel
     */
    function isAuthorized(address account) external view returns (bool);

    /**
     * @notice Set the metadata base URI (owner only)
     */
    function setBaseURI(string calldata newBaseURI) external;

    /**
     * @notice ERC-721 metadata URI = baseURI + tokenId
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);

    /**
     * @notice Total minted supply (max 501)
     */
    function totalSupply() external view returns (uint256);
}
