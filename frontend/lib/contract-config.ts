// Sepolia Testnet Configuration
export const SEPOLIA_CONFIG = {
  network: "sepolia",
  chainId: 11155111,
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-rpc.publicnode.com",
  contractAddress: "0x4fAfa38104A1c61250B5EC2e1F0cC24C90F99240",
};

// Adoption Vault - Sepolia Testnet
export const ADOPTION_CONFIG = {
  network: "sepolia",
  chainId: 11155111,
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-rpc.publicnode.com",
  contractAddress: "0xf2BAD834Dc970aA5b2b8e7c0D4a0a8e42d7591Bc",
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

// Hardened ABI for OptimizerVaultTest (security fixes applied)
export const VAULT_ABI = [
  // View functions
  "function owner() view returns (address)",
  "function pendingOwner() view returns (address)",
  "function feeCollector() view returns (address)",
  "function paused() view returns (bool)",
  "function totalDeposits() view returns (uint256)",
  "function totalYield() view returns (uint256)",
  "function totalFeesCollected() view returns (uint256)",
  "function getContractBalance() view returns (uint256)",
  "function maxDepositPerUser() view returns (uint256)",
  
  // Position functions
  "function getPosition(address user) view returns (uint256 ethDeposited, uint256 shares, uint256 yieldEarned, uint256 lastClaimAt)",
  "function getSubscription(address user) view returns (uint8 tier, uint256 subscribedAt, uint256 expiresAt, bool active)",
  "function getTierInfo(uint8 tier) view returns (uint256 fee, uint256 cost, uint256 minDeposit)",
  "function getDailyYieldAdded(address user) view returns (uint256)",
  
  // State-changing functions
  "function subscribe(uint8 tier) payable",
  "function deposit() payable",
  "function withdraw(uint256 amount)",
  "function claimYield()",
  
  // Admin functions
  "function addYieldToUser(address user, uint256 amount)",
  "function setFeeCollector(address collector)",
  "function setMaxDepositPerUser(uint256 max)",
  "function sweepStuckFunds()",
  "function pause()",
  "function unpause()",
  "function transferOwnership(address newOwner)",
  "function acceptOwnership()",
  
  // Events
  "event Deposited(address indexed user, uint256 amount, uint256 shares)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 shares)",
  "event YieldClaimed(address indexed user, uint256 amount, uint256 fee)",
  "event Subscribed(address indexed user, uint8 tier, uint256 expiresAt)",
  "event YieldDistributed(uint256 amount)",
  "event Paused(address account)",
  "event Unpaused(address account)",
  "event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
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

// MigrationRouter - Sepolia Testnet
export const MIGRATION_CONFIG = {
  network: "sepolia",
  chainId: 11155111,
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-rpc.publicnode.com",
  contractAddress: process.env.MIGRATION_ROUTER_ADDRESS || "",
};

// MigrationRouter ABI
export const MIGRATION_ABI = [
  "function depositToHook() external payable",
  "function depositToNative() external payable",
  "function withdrawFromHook(uint256 amount) external",
  "function withdrawFromNative(uint256 amount) external",
  "function migrateToNative(uint256 spreadAtMigration) external",
  "function migrateToHook(uint256 spreadAtMigration) external",
  "function getUserBalance(address user) external view returns (uint256 hook, uint256 native, uint256 total)",
  "function getMigrationHistory(address user) external view returns (tuple(address user, address fromPool, address toPool, uint256 amount, uint256 timestamp, uint256 spreadAtMigration)[])",
  "function totalMigrations() external view returns (uint256)",
  "function totalVolumeMigrated() external view returns (uint256)",
  "function hookBalance(address) external view returns (uint256)",
  "function nativeBalance(address) external view returns (uint256)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "event Migrated(address indexed user, address indexed fromPool, address indexed toPool, uint256 amount, uint256 spreadAtMigration)",
  "event Deposited(address indexed user, address indexed pool, uint256 amount)",
  "event Withdrawn(address indexed user, address indexed pool, uint256 amount)",
];
