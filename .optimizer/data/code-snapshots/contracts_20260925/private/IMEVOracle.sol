// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IMEVOracle
 * @notice MEV Threat Intelligence Oracle for Optimizer Protocol
 * @dev Simplified version compatible with Adam's IMD Worker VPS
 *
 * ARCHITECTURE:
 * - Adam's VPS runs IMD Worker → generates mev_report_output.json
 * - bld-feeder.js reads JSON → signs with node key → calls updateMEVBots()
 * - Hook queries isMEVBot() during afterSwap
 *
 * SECURITY:
 * - Only authorized node keys can update bot list
 * - ECDSA signature verification prevents spoofing
 * - Owner can add/remove authorized nodes
 */
contract IMEVOracle is Ownable, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ==================== TYPES ====================

    struct MEVBot {
        bool isBot;
        uint256 confidence;
        uint256 totalExtracted;
        uint256 attackCount;
        uint256 lastSeenBlock;
        string attackType;
    }

    // ==================== STATE ====================

    // MEV Bot registry
    mapping(address => MEVBot) public bots;
    address[] public botList;

    // Authorized nodes (can submit updates)
    mapping(address => bool) public authorizedNodes;
    address[] public nodeList;

    // Stats
    uint256 public totalBotsDetected;
    uint256 public totalMEVCaptured;
    uint256 public totalUpdates;

    // Config
    uint256 public constant MIN_CONFIDENCE = 70;

    // ==================== EVENTS ====================

    event MEVBotsUpdated(address indexed updater, address[] bots, uint256 count);
    event BotRegistered(address indexed botAddress, uint256 confidence);
    event BotRemoved(address indexed botAddress);
    event NodeAdded(address indexed node);
    event NodeRemoved(address indexed node);

    // ==================== CONSTRUCTOR ====================

    constructor(address[] memory initialNodes) Ownable(msg.sender) {
        require(initialNodes.length > 0, "Need at least 1 node");
        for (uint256 i = 0; i < initialNodes.length; i++) {
            authorizedNodes[initialNodes[i]] = true;
            nodeList.push(initialNodes[i]);
        }
    }

    // ==================== CORE FUNCTIONS ====================

    /**
     * @notice Update MEV bot list from off-chain detection
     * @dev Called by bld-feeder.js on Adam's VPS
     * @param newBots Array of bot addresses detected
     * @param tssSignature ECDSA signature proving authorized node
     */
    function updateMEVBots(
        address[] calldata newBots,
        bytes calldata tssSignature
    ) external whenNotPaused {
        require(newBots.length > 0, "Empty bot list");

        // Verify signature from authorized node
        bytes32 messageHash = keccak256(abi.encodePacked(newBots));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ECDSA.recover(ethSignedHash, tssSignature);

        require(authorizedNodes[signer], "Unauthorized node");
        require(signer == msg.sender, "Signer must be sender");

        // Update bot registry
        uint256 newCount = 0;
        for (uint256 i = 0; i < newBots.length; i++) {
            MEVBot storage bot = bots[newBots[i]];

            if (!bot.isBot) {
                bot.isBot = true;
                botList.push(newBots[i]);
                totalBotsDetected++;
                newCount++;
            }

            bot.confidence = 100; // Authorized node = high confidence
            bot.lastSeenBlock = block.number;
        }

        totalUpdates++;

        emit MEVBotsUpdated(msg.sender, newBots, newCount);
    }

    /**
     * @notice Remove a bot from registry (owner only)
     */
    function removeBot(address botAddress) external onlyOwner {
        bots[botAddress].isBot = false;
        bots[botAddress].confidence = 0;
        emit BotRemoved(botAddress);
    }

    /**
     * @notice Batch remove bots (owner only)
     */
    function removeBots(address[] calldata botAddresses) external onlyOwner {
        for (uint256 i = 0; i < botAddresses.length; i++) {
            bots[botAddresses[i]].isBot = false;
            bots[botAddresses[i]].confidence = 0;
        }
    }

    // ==================== NODE MANAGEMENT ====================

    /**
     * @notice Add authorized node (owner only)
     */
    function addNode(address node) external onlyOwner {
        require(node != address(0), "Zero address");
        require(!authorizedNodes[node], "Already authorized");

        authorizedNodes[node] = true;
        nodeList.push(node);

        emit NodeAdded(node);
    }

    /**
     * @notice Remove authorized node (owner only)
     */
    function removeNode(address node) external onlyOwner {
        require(authorizedNodes[node], "Not a node");

        authorizedNodes[node] = false;

        // Remove from array
        for (uint256 i = 0; i < nodeList.length; i++) {
            if (nodeList[i] == node) {
                nodeList[i] = nodeList[nodeList.length - 1];
                nodeList.pop();
                break;
            }
        }

        emit NodeRemoved(node);
    }

    /**
     * @notice Get all authorized nodes
     */
    function getNodes() external view returns (address[] memory) {
        return nodeList;
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @notice Check if an address is a known MEV bot
     * @param addr Address to check
     * @return isBot True if address is a known MEV bot
     * @return confidence Confidence score (0-100)
     */
    function isMEVBot(address addr) external view returns (bool isBot, uint256 confidence) {
        MEVBot storage bot = bots[addr];
        // Consider stale if not updated in 1000 blocks (~3.3 hours)
        bool isStale = (block.number - bot.lastSeenBlock) > 1000;
        return (bot.isBot && bot.confidence >= MIN_CONFIDENCE && !isStale, bot.confidence);
    }

    /**
     * @notice Get bot details
     */
    function getBotDetails(address botAddress) external view returns (MEVBot memory) {
        return bots[botAddress];
    }

    /**
     * @notice Get all registered bots
     */
    function getRegisteredBots() external view returns (address[] memory) {
        return botList;
    }

    /**
     * @notice Get oracle statistics
     */
    function getOracleStats() external view returns (
        uint256 nodes,
        uint256 updates,
        uint256 totalBots
    ) {
        nodes = nodeList.length;
        updates = totalUpdates;
        totalBots = totalBotsDetected;
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Emergency pause (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
