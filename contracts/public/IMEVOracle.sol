// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMEVOracle
 * @notice Interface for MEV Threat Intelligence Oracle
 * @dev Consumed by OptimizerHook to detect real MEV attacks
 */
interface IMEVOracle {
    /**
     * @notice Check if an address is a known MEV bot
     * @param addr Address to check
     * @return isBot True if address is a known MEV bot
     * @return confidence Confidence score (0-100)
     */
    function isMEVBot(address addr) external view returns (bool isBot, uint256 confidence);

    /**
     * @notice Get MEV data for a specific block
     * @param blockNumber Block to analyze
     * @return attacks Number of attacks detected
     * @return totalExtracted Total MEV extracted in wei
     */
    function getMEVData(uint256 blockNumber) external view returns (
        uint256 attacks,
        uint256 totalExtracted
    );

    /**
     * @notice Submit MEV report from off-chain oracle
     * @param botAddress Address of attacking bot
     * @param blockNumber Block where attack occurred
     * @param profit Amount extracted in wei
     * @param signature ECDSA signature from oracle signer
     */
    function submitMEVReport(
        address botAddress,
        uint256 blockNumber,
        uint256 profit,
        bytes calldata signature
    ) external;

    /**
     * @notice Get total MEV captured
     * @return Total MEV captured in wei
     */
    function totalMEVCaptured() external view returns (uint256);

    /**
     * @notice Get total bots detected
     * @return Total bots in registry
     */
    function totalBotsDetected() external view returns (uint256);
}
