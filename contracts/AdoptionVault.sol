// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AdoptionVault
 * @notice Fundraising contract for IMD Protocol mainnet deployment
 * @dev Offers different support tiers with benefits for early adopters
 */
contract AdoptionVault {
    address public owner;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    enum Tier { SUPPORTER, BUILDER, SHARK, WHALE, FOUNDER }
    
    struct SupporterInfo {
        Tier tier;
        uint256 contributed;
        uint256 joinedAt;
        uint256 lastClaimAt;
        bool isActive;
        string message; // Optional message from supporter
    }
    
    struct TierConfig {
        uint256 minContribution;  // Minimum ETH to join
        uint256 feeDiscount;      // Fee discount in basis points (100 = 1%)
        uint256 revenueShare;     // Revenue share in basis points
        uint256 maxPositions;     // Max positions in vault
        bool earlyAccess;         // Early access to features
        bool governance;          // Governance rights
        string name;
        string description;
    }
    
    // Supporter tracking
    mapping(address => SupporterInfo) public supporters;
    address[] public supporterList;
    
    // Tier configurations
    mapping(Tier => TierConfig) public tierConfigs;
    
    // Fundraising goals
    uint256 public totalRaised;
    uint256 public goalAmount = 5 ether; // 5 ETH goal
    uint256 public minContribution = 0.01 ether; // 0.01 ETH minimum
    
    // Benefits distribution
    mapping(address => uint256) public pendingBenefits;
    uint256 public totalBenefitsDistributed;
    
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
        
        // Initialize tier configurations - Focus on VOLUME over large contributions
        tierConfigs[Tier.SUPPORTER] = TierConfig({
            minContribution: 0.005 ether,  // 0.005 ETH (~$12)
            feeDiscount: 300,        // 3% discount
            revenueShare: 50,        // 0.5% revenue share
            maxPositions: 1,
            earlyAccess: false,
            governance: false,
            name: "SEED",
            description: "Plant a seed - 3% fee discount, 0.5% revenue share"
        });
        
        tierConfigs[Tier.BUILDER] = TierConfig({
            minContribution: 0.01 ether,   // 0.01 ETH (~$25)
            feeDiscount: 500,        // 5% discount
            revenueShare: 100,       // 1% revenue share
            maxPositions: 2,
            earlyAccess: false,
            governance: false,
            name: "SPROUT",
            description: "Growing supporter - 5% fee discount, 1% revenue share"
        });
        
        tierConfigs[Tier.SHARK] = TierConfig({
            minContribution: 0.025 ether,  // 0.025 ETH (~$60)
            feeDiscount: 800,        // 8% discount
            revenueShare: 200,       // 2% revenue share
            maxPositions: 3,
            earlyAccess: true,
            governance: false,
            name: "LEAF",
            description: "Active supporter - 8% fee discount, 2% revenue share, early access"
        });
        
        tierConfigs[Tier.WHALE] = TierConfig({
            minContribution: 0.05 ether,   // 0.05 ETH (~$120)
            feeDiscount: 1200,       // 12% discount
            revenueShare: 350,       // 3.5% revenue share
            maxPositions: 5,
            earlyAccess: true,
            governance: true,
            name: "BRANCH",
            description: "Core supporter - 12% fee discount, 3.5% revenue share, governance"
        });
        
        tierConfigs[Tier.FOUNDER] = TierConfig({
            minContribution: 0.1 ether,    // 0.1 ETH (~$240)
            feeDiscount: 2000,       // 20% discount
            revenueShare: 500,       // 5% revenue share
            maxPositions: 10,
            earlyAccess: true,
            governance: true,
            name: "TRUNK",
            description: "Founding member - 20% fee discount, 5% revenue share, full governance"
        });
    }
    
    /**
     * @notice Join as a supporter with a specific tier
     * @param tier Tier to join
     * @param message Optional message
     */
    function joinTier(Tier tier, string calldata message) external payable {
        require(!supporters[msg.sender].isActive, "Already a supporter");
        require(msg.value >= tierConfigs[tier].minContribution, "Below minimum contribution");
        require(msg.value >= minContribution, "Below global minimum");
        
        TierConfig memory config = tierConfigs[tier];
        
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
        
        // Check if goal reached
        if (totalRaised >= goalAmount) {
            emit GoalReached(totalRaised, block.timestamp);
        }
    }
    
    /**
     * @notice Upgrade to a higher tier
     * @param newTier New tier to upgrade to
     */
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
    
    /**
     * @notice Claim accumulated benefits
     */
    function claimBenefits() external onlyActiveSupporter {
        uint256 amount = pendingBenefits[msg.sender];
        require(amount > 0, "No benefits to claim");
        
        pendingBenefits[msg.sender] = 0;
        totalBenefitsDistributed += amount;
        
        // Transfer ETH
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit BenefitsClaimed(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @notice Add benefits to a supporter (called by owner when revenue is generated)
     * @param supporter Address to add benefits to
     * @param amount Amount to add
     */
    function addBenefits(address supporter, uint256 amount) external onlyOwner {
        require(supporters[supporter].isActive, "Not a supporter");
        
        SupporterInfo storage info = supporters[supporter];
        TierConfig memory config = tierConfigs[info.tier];
        
        // Calculate benefits based on tier's revenue share
        uint256 benefits = (amount * config.revenueShare) / 10000;
        pendingBenefits[supporter] += benefits;
    }
    
    /**
     * @notice Distribute benefits to all supporters based on their tier
     * @param totalAmount Total amount to distribute
     */
    function distributeBenefits(uint256 totalAmount) external onlyOwner {
        require(totalAmount > 0, "Amount must be > 0");
        
        for (uint256 i = 0; i < supporterList.length; i++) {
            address supporter = supporterList[i];
            SupporterInfo storage info = supporters[supporter];
            
            if (info.isActive) {
                TierConfig memory config = tierConfigs[info.tier];
                uint256 benefits = (totalAmount * config.revenueShare) / 10000;
                pendingBenefits[supporter] += benefits;
            }
        }
    }
    
    /**
     * @notice Get supporter's tier benefits
     * @param supporter Address to check
     * @return tier Supporter's tier
     * @return feeDiscount Fee discount in basis points
     * @return revenueShare Revenue share in basis points
     * @return maxPositions Maximum positions allowed
     */
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
    
    /**
     * @notice Get tier configuration
     * @param tier Tier to check
     * @return config Tier configuration
     */
    function getTierConfig(Tier tier) external view returns (TierConfig memory) {
        return tierConfigs[tier];
    }
    
    /**
     * @notice Get total supporters
     * @return count Number of supporters
     */
    function getSupporterCount() external view returns (uint256 count) {
        return supporterList.length;
    }
    
    /**
     * @notice Get supporter list
     * @return list Array of supporter addresses
     */
    function getSupporterList() external view returns (address[] memory list) {
        return supporterList;
    }
    
    /**
     * @notice Withdraw funds (only after goal is reached)
     * @param to Address to send funds to
     * @param amount Amount to withdraw
     */
    function withdrawFunds(address to, uint256 amount) external onlyOwner {
        require(totalRaised >= goalAmount, "Goal not reached yet");
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");
        
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(to, amount, block.timestamp);
    }
    
    /**
     * @notice Update fundraising goal
     * @param newGoal New goal amount
     */
    function setGoal(uint256 newGoal) external onlyOwner {
        require(newGoal > 0, "Goal must be > 0");
        goalAmount = newGoal;
    }
    
    /**
     * @notice Update minimum contribution
     * @param newMin New minimum contribution
     */
    function setMinContribution(uint256 newMin) external onlyOwner {
        require(newMin > 0, "Minimum must be > 0");
        minContribution = newMin;
    }
    
    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
