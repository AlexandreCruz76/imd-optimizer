/**
 * On-Chain Pool Data Fetcher
 * Reads directly from Uniswap V4 StateView contract
 * Fallback when The Graph is down
 */

import { ethers } from "ethers";

const STATE_VIEW_ADDRESS = "0x7ffe42c4a5deea5b0fec41c94c136cf115597227";

const STATE_VIEW_ABI = [
  "function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFees, uint128 unlocked)",
  "function getLiquidity(bytes32 poolId) external view returns (uint128 liquidity)",
];

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// IMD token address on Ethereum mainnet (18 decimals)
const IMD_ADDRESS = "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Pool IDs
const HOOK_POOL_ID = "0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704";
const NATIVE_POOL_ID = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";

export interface OnChainPoolData {
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
  tvlETH: number;
  tvlUSD: number;
  tvlIMD: number;
  price: number;
  fee: number;
}

export class OnChainFetcher {
  private provider: ethers.JsonRpcProvider;
  private stateView: ethers.Contract;

  constructor(rpcUrl?: string) {
    const url = rpcUrl || process.env.ETHEREUM_RPC_URL || "https://ethereum.publicnode.com";
    this.provider = new ethers.JsonRpcProvider(url, 1);
    this.stateView = new ethers.Contract(STATE_VIEW_ADDRESS, STATE_VIEW_ABI, this.provider);
  }

  /**
   * Fetch ETH price from a known DEX price (CoinGecko-like)
   */
  async getETHPrice(): Promise<number> {
    try {
      const resp = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await resp.json();
      return data.ethereum?.usd || 2500;
    } catch {
      return 2500; // fallback
    }
  }

  /**
   * Get pool state directly from StateView contract
   *
   * Uniswap V4 formula:
   *   sqrtPrice = sqrtPriceX96 / 2^96
   *   L = liquidity (from StateView)
   *   token0_raw = L / sqrtPrice   (WETH, both 18 decimals)
   *   token1_raw = L * sqrtPrice   (IMD, 18 decimals)
   */
  async getPoolState(poolId: string): Promise<OnChainPoolData | null> {
    try {
      const [sqrtPriceX96, tick] = await this.stateView.getSlot0(poolId);
      const liquidity = await this.stateView.getLiquidity(poolId);

      const sqrtP = Number(sqrtPriceX96) / 2 ** 96;
      const liq = Number(liquidity);

      // Both WETH and IMD are 18 decimals
      const token0_raw = liq / sqrtP;
      const token1_raw = liq * sqrtP;

      const tvlWETH = token0_raw / 1e18;
      const tvlIMD = token1_raw / 1e18;

      const ethUsd = await this.getETHPrice();
      const tvlUSD = tvlWETH * ethUsd;

      // Price: IMD per WETH = token1 / token0
      const price = tvlIMD > 0 && tvlWETH > 0 ? tvlIMD / tvlWETH : sqrtP * sqrtP;

      return {
        sqrtPriceX96,
        tick: Number(tick),
        liquidity,
        tvlETH: tvlWETH,
        tvlUSD,
        tvlIMD,
        price,
        fee: 10000,
      };
    } catch (error) {
      console.error("On-chain fetch failed for pool", poolId, error);
      return null;
    }
  }

  /**
   * Fetch both Hook and Native pool data
   */
  async fetchBothPools(): Promise<{
    hook: OnChainPoolData | null;
    native: OnChainPoolData | null;
  }> {
    const [hook, native] = await Promise.all([
      this.getPoolState(HOOK_POOL_ID),
      this.getPoolState(NATIVE_POOL_ID),
    ]);
    return { hook, native };
  }
}

let fetcherInstance: OnChainFetcher | null = null;

export function getOnChainFetcher(): OnChainFetcher {
  if (!fetcherInstance) {
    fetcherInstance = new OnChainFetcher();
  }
  return fetcherInstance;
}
