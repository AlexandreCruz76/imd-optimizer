// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AdoptionVault
 * @notice Fundraising contract for IMD Protocol mainnet deployment — HARDENED VERSION
 * @dev Offers different support tiers with benefits for early adopters
 *
 * Security fixes applied:
 * - ReentrancyGuard on ETH transfers
 * - 2-step ownership transfer
 * - distributeBenefits with gas-safe batching
 * - Input validation
 */

// ───────────────────────── Reentrancy Guard (inline) ─────────────────────────
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract AdoptionVault is ReentrancyGuard {
    address public owner;
    address public pendingOwner;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    enum Tier { SUPPORTER, BUILDER, SHARK, WHALE, FOUNDER }
    
    struct SupporterInfo {
        Tier tier;
        uint256 contributed;
        uint256 joinedAt;
        uint256 lastClaimAt;
        bool isActive;
        string message;
    }
    
    struct TierConfig {
        uint256 minContribution;
        uint256 feeDiscount;
        uint256 revenueShare;
        uint256 maxPositions;
        bool earlyAccess;
        bool governance;
        string name;
        string description;
    }
    
    // Rastreamento de apoiadores
    mapping(address => SupporterInfo) public supporters;
    address[] public supporterList;
    
    // Configurações de tier
    mapping(Tier => TierConfig) public tierConfigs;
    
    // Metas de arrecadação
    uint256 public totalRaised;
    uint256 public goalAmount = 5 ether;
    uint256 public minContribution = 0.01 ether;
    
    // Distribuição de benefícios
    mapping(address => uint256) public pendingBenefits;
    uint256 public totalBenefitsDistributed;
    
    // Distribuição em lote segura para gas
    uint256 public lastDistributeIndex;
    
    // Events
    event SupporterJoined(
        address indexed supporter,
        Tier tier,
        uint256 amount,
        uint256 timestamp
    );
    event BenefitsClaimed(
        address indexed supporter,
        uint256 amount,
        uint256 timestamp
    );
    event GoalReached(uint256 totalRaised, uint256 timestamp);
    event FundsWithdrawn(address indexed to, uint256 amount, uint256 timestamp);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyActiveSupporter() {
        require(supporters[msg.sender].isActive, "Not an active supporter");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        tierConfigs[Tier.SUPPORTER] = TierConfig({
            minContribution: 0.005 ether,
            feeDiscount: 300,
            revenueShare: 50,
            maxPositions: 1,
            earlyAccess: false,
            governance: false,
            name: "SEED",
            description: "Plant a seed - 3% fee discount, 0.5% revenue share"
        });
        
        tierConfigs[Tier.BUILDER] = TierConfig({
            minContribution: 0.01 ether,
            feeDiscount: 500,
            revenueShare: 100,
            maxPositions: 2,
            earlyAccess: false,
            governance: false,
            name: "SPROUT",
            description: "Growing supporter - 5% fee discount, 1% revenue share"
        });
        
        tierConfigs[Tier.SHARK] = TierConfig({
            minContribution: 0.025 ether,
            feeDiscount: 800,
            revenueShare: 200,
            maxPositions: 3,
            earlyAccess: true,
            governance: false,
            name: "LEAF",
            description: "Active supporter - 8% fee discount, 2% revenue share, early access"
        });
        
        tierConfigs[Tier.WHALE] = TierConfig({
            minContribution: 0.05 ether,
            feeDiscount: 1200,
            revenueShare: 350,
            maxPositions: 5,
            earlyAccess: true,
            governance: true,
            name: "BRANCH",
            description: "Core supporter - 12% fee discount, 3.5% revenue share, governance"
        });
        
        tierConfigs[Tier.FOUNDER] = TierConfig({
            minContribution: 0.1 ether,
            feeDiscount: 2000,
            revenueShare: 500,
            maxPositions: 10,
            earlyAccess: true,
            governance: true,
            name: "TRUNK",
            description: "Founding member - 20% fee discount, 5% revenue share, full governance"
        });
    }
    
    // ───────────────────────── Ownership (2-step) ─────────────────────────
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        pendingOwner = _newOwner;
        emit OwnershipTransferStarted(owner, _newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }
    
    // ───────────────────────── Core Functions ─────────────────────────
    
    function joinTier(Tier tier, string calldata message) external payable {
        require(!supporters[msg.sender].isActive, "Already a supporter");
        require(msg.value >= tierConfigs[tier].minContribution, "Below minimum contribution");
        require(msg.value >= minContribution, "Below global minimum");
        
        supporters[msg.sender] = SupporterInfo({
            tier: tier,
            contributed: msg.value,
            joinedAt: block.timestamp,
            lastClaimAt: block.timestamp,
            isActive: true,
            message: message
        });
        
        supporterList.push(msg.sender);
        totalRaised += msg.value;
        
        emit SupporterJoined(msg.sender, tier, msg.value, block.timestamp);
        
        if (totalRaised >= goalAmount) {
            emit GoalReached(totalRaised, block.timestamp);
        }
    }
    
    function upgradeTier(Tier newTier) external payable {
        require(supporters[msg.sender].isActive, "Not a supporter");
        
        SupporterInfo storage info = supporters[msg.sender];
        TierConfig memory newConfig = tierConfigs[newTier];
        
        require(newTier > info.tier, "Can only upgrade to higher tier");
        require(msg.value >= newConfig.minContribution - info.contributed, "Insufficient upgrade payment");
        
        info.tier = newTier;
        info.contributed += msg.value;
        totalRaised += msg.value;
        
        emit SupporterJoined(msg.sender, newTier, msg.value, block.timestamp);
    }
    
    function claimBenefits() external onlyActiveSupporter nonReentrant {
        uint256 amount = pendingBenefits[msg.sender];
        require(amount > 0, "No benefits to claim");
        
        pendingBenefits[msg.sender] = 0;
        totalBenefitsDistributed += amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit BenefitsClaimed(msg.sender, amount, block.timestamp);
    }
    
    function addBenefits(address supporter, uint256 amount) external onlyOwner {
        require(supporters[supporter].isActive, "Not a supporter");
        require(amount > 0, "Amount must be > 0");
        
        SupporterInfo storage info = supporters[supporter];
        TierConfig memory config = tierConfigs[info.tier];
        
        uint256 benefits = (amount * config.revenueShare) / 10000;
        pendingBenefits[supporter] += benefits;
    }
    
    /**
     * @notice Distribuição em lote segura para gas — processa até _maxBatch apoiadores por chamada
     * @param totalAmount Valor total a distribuir
     * @param _maxBatch Máximo de apoiadores a processar por chamada (previne out-of-gas)
     */
    function distributeBenefits(uint256 totalAmount, uint256 _maxBatch) external onlyOwner {
        require(totalAmount > 0, "Amount must be > 0");
        require(_maxBatch > 0 && _maxBatch <= 200, "Batch must be 1-200");
        
        uint256 len = supporterList.length;
        uint256 start = lastDistributeIndex;
        uint256 end = start + _maxBatch;
        if (end > len) end = len;
        
        for (uint256 i = start; i < end; i++) {
            address supporter = supporterList[i];
            SupporterInfo storage info = supporters[supporter];
            
            if (info.isActive) {
                TierConfig memory config = tierConfigs[info.tier];
                uint256 benefits = (totalAmount * config.revenueShare) / 10000;
                pendingBenefits[supporter] += benefits;
            }
        }
        
        lastDistributeIndex = end;
        
        // Se chegamos ao final, resetar para próxima distribuição
        if (end >= len) {
            lastDistributeIndex = 0;
        }
    }
    
    // ───────────────────────── View Functions ─────────────────────────
    
    function getSupporterBenefits(address supporter) external view returns (
        Tier tier,
        uint256 feeDiscount,
        uint256 revenueShare,
        uint256 maxPositions
    ) {
        require(supporters[supporter].isActive, "Not a supporter");
        
        SupporterInfo memory info = supporters[supporter];
        TierConfig memory config = tierConfigs[info.tier];
        
        return (
            info.tier,
            config.feeDiscount,
            config.revenueShare,
            config.maxPositions
        );
    }
    
    function getTierConfig(Tier tier) external view returns (TierConfig memory) {
        return tierConfigs[tier];
    }
    
    function getSupporterCount() external view returns (uint256 count) {
        return supporterList.length;
    }
    
    function getSupporterList() external view returns (address[] memory list) {
        return supporterList;
    }
    
    function getDistributionProgress() external view returns (uint256 processed, uint256 total) {
        return (lastDistributeIndex, supporterList.length);
    }
    
    // ───────────────────────── Admin Functions ─────────────────────────
    
    function withdrawFunds(address to, uint256 amount) external onlyOwner nonReentrant {
        require(totalRaised >= goalAmount, "Goal not reached yet");
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");
        
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(to, amount, block.timestamp);
    }
    
    function setGoal(uint256 newGoal) external onlyOwner {
        require(newGoal > 0, "Goal must be > 0");
        goalAmount = newGoal;
    }
    
    function setMinContribution(uint256 newMin) external onlyOwner {
        require(newMin > 0, "Minimum must be > 0");
        minContribution = newMin;
    }
    
    receive() external payable {}
}
