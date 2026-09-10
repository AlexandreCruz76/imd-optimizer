/**
 * Hook Pool Optimizer - Configuration
 * 
 * Central configuration for the $IMD CappedBurnHook optimizer.
 * All contract addresses and parameters are defined here.
 */

export const CONFIG = {
  // ───────────────────────── Contracts (Ethereum Mainnet) ─────────────────────────
  contracts: {
    hook: "0xc6c965bd164c483e87d0b550671798e9a3602840",
    poolManager: "0x000000000004444c5dc75cB358380D2e3dE08A90",
    stateView: "0x7ffe42c4a5deea5b0fec41c94c136cf115597227",
    imd: "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",
    distributor: "0x9046739e1535b40efbe6ab3f45d0024b690eca30",
    dripper: "0xe6d3de6daeaf327fca42745f1998fcd989e00884",
    vault: "0x9efa934d9fad4ae28c998a40195646b965a97247",
    burnExecutor: "0xe29386719C155B6847aD5a4E97C6674f10ffc750",
    referencePoolId: "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3",
    ethUsdcV3: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
  },

  // ───────────────────────── Pool Parameters ─────────────────────────
  pool: {
    openBlock: 25887180,
    blocksPerHour: 300, // 12s blocks
    lpFeeBps: 100, // 1% LP fee
    rewardShareBps: 1500, // 15% of trims to rewards
  },

  // ───────────────────────── Optimizer Settings ─────────────────────────
  optimizer: {
    // Performance fee for the optimizer (15% of extra yield)
    performanceFeeBps: 1500,
    
    // Minimum LP position size (in ETH)
    minPositionEth: 1,
    
    // Maximum recommended position size (in ETH)
    maxPositionEth: 100,
    
    // Rebalancing threshold (percent change in APY to trigger rebalance)
    rebalanceThresholdBps: 500, // 5%
    
    // Analysis window (hours)
    analysisWindowHours: 168, // 7 days
    
    // Projection periods (days)
    projectionDays: [7, 30, 90, 365],
  },

  // ───────────────────────── RPC Configuration ─────────────────────────
  rpc: {
    publicEndpoints: [
      "https://ethereum-rpc.publicnode.com",
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://1rpc.io/eth",
      "https://eth.drpc.org",
      "https://cloudflare-eth.com",
      "https://rpc.flashbots.net",
      "https://ethereum.blockpi.network/v1/rpc/public",
      "https://rpc.mevblocker.io",
    ],
    timeoutMs: 45000,
    maxRetries: 3,
  },

  // ───────────────────────── Display Settings ─────────────────────────
  display: {
    decimals: {
      eth: 4,
      imd: 2,
      percent: 2,
      price: 2,
    },
    currency: "USD",
  },
} as const;

export type Config = typeof CONFIG;
