// Sepolia Testnet Configuration
export const SEPOLIA_CONFIG = {
  network: "sepolia",
  chainId: 11155111,
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-rpc.publicnode.com",
  contractAddress: "0x0AdC673633abdAa6e668009d10572cB2786b8B12",
};

// Adoption Vault - Sepolia Testnet
export const ADOPTION_CONFIG = {
  network: "sepolia",
  chainId: 11155111,
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-rpc.publicnode.com",
  contractAddress: "0x8Ef2DdCb0211003c23535aD0c6Ee3303f54193aF",
};

// Adoption Vault ABI
export const ADOPTION_ABI = [
  // View functions
  "function owner() view returns (address)",
  "function goalAmount() view returns (uint256)",
  "function minContribution() view returns (uint256)",
  "function totalRaised() view returns (uint256)",
  "function getSupporterCount() view returns (uint256)",
  "function getTierConfig(uint8 tier) view returns (tuple(uint256 minContribution, uint256 feeDiscount, uint256 revenueShare, uint256 maxPositions, bool earlyAccess, bool governance, string name, string description))",
  "function supporters(address) view returns (uint8 tier, uint256 contributed, uint256 joinedAt, uint256 lastClaimAt, bool isActive, string message)",
  "function pendingBenefits(address) view returns (uint256)",
  
  // State-changing functions
  "function joinTier(uint8 tier, string message) payable",
  "function upgradeTier(uint8 tier) payable",
  "function claimBenefits()",
  "function getSupporterBenefits(address supporter) view returns (uint8 tier, uint256 feeDiscount, uint256 revenueShare, uint256 maxPositions)",
  
  // Events
  "event SupporterJoined(address indexed supporter, uint8 tier, uint256 amount, uint256 timestamp)",
  "event BenefitsClaimed(address indexed supporter, uint256 amount, uint256 timestamp)",
  "event GoalReached(uint256 totalRaised, uint256 timestamp)",
];

// Simplified ABI for OptimizerVaultTest
export const VAULT_ABI = [
  // View functions
  "function owner() view returns (address)",
  "function feeCollector() view returns (address)",
  "function totalDeposits() view returns (uint256)",
  "function totalYield() view returns (uint256)",
  "function totalFeesCollected() view returns (uint256)",
  "function getContractBalance() view returns (uint256)",
  
  // Position functions
  "function getPosition(address user) view returns (uint256 ethDeposited, uint256 shares, uint256 yieldEarned, uint256 lastClaimAt)",
  "function getSubscription(address user) view returns (uint8 tier, uint256 subscribedAt, uint256 expiresAt, bool active)",
  "function getTierInfo(uint8 tier) view returns (uint256 fee, uint256 cost, uint256 minDeposit)",
  
  // State-changing functions
  "function subscribe(uint8 tier) payable",
  "function deposit() payable",
  "function withdraw(uint256 amount)",
  "function claimYield()",
  
  // Admin functions
  "function addYieldToUser(address user, uint256 amount)",
  "function distributeYield()",
  
  // Events
  "event Deposited(address indexed user, uint256 amount, uint256 shares)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 shares)",
  "event YieldClaimed(address indexed user, uint256 amount, uint256 fee)",
  "event Subscribed(address indexed user, uint8 tier, uint256 expiresAt)",
];

// Tier names mapping
export const TIER_NAMES = ["FREE", "BASIC", "PRO", "WHALE"];

// Tier fees (basis points)
export const TIER_FEES = [2000, 1500, 1000, 500]; // 20%, 15%, 10%, 5%

// Tier costs (wei)
export const TIER_COSTS = [
  "0",
  "50000000000000000", // 0.05 ETH
  "200000000000000000", // 0.2 ETH
  "500000000000000000", // 0.5 ETH
];

// Tier minimum deposits (wei)
export const TIER_MIN_DEPOSIT = [
  "10000000000000000", // 0.01 ETH
  "100000000000000000", // 0.1 ETH
  "1000000000000000000", // 1 ETH
  "10000000000000000000", // 10 ETH
];
