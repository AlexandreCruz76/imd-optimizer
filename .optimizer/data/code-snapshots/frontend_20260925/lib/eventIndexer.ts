/**
 * Custom Event Indexer for Uniswap V4 PoolManager
 * Reads Swap events directly from blockchain RPC
 * No dependency on The Graph
 */

import { ethers } from "ethers";

const POOL_MANAGER = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const STATE_VIEW = "0x7ffe42c4a5deea5b0fec41c94c136cf115597227";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Swap(bytes32 indexed poolId, indexed address sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 feeProtocol)
const SWAP_TOPIC = ethers.id("Swap(bytes32,address,int128,int128,uint160,uint128,int24,uint24)");

const STATE_VIEW_ABI = [
  "function getSlot0(bytes32) view returns(uint160,int24,uint24,uint128)",
  "function getLiquidity(bytes32) view returns(uint128)",
];

// Known pool IDs
const POOL_IDS = {
  hook: "0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704",
  native: "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3",
};

const FEE_RATE = 0.01; // 1% fee tier for both pools

interface PoolMetrics {
  volume24hUSD: number;
  fees24hUSD: number;
  txs24h: number;
  tvlUSD: number;
  apy: number;
}

export class EventIndexer {
  private provider: ethers.JsonRpcProvider;
  private cache: Map<string, { data: PoolMetrics; ts: number }> = new Map();
  private CACHE_TTL = 30000;
  private abiCoder = ethers.AbiCoder.defaultAbiCoder();

  constructor(rpcUrl?: string) {
    const url = rpcUrl || "https://ethereum.publicnode.com";
    this.provider = new ethers.JsonRpcProvider(url, 1);
  }

  /**
   * Encode poolId as a padded bytes32 topic for log filtering
   */
  private poolTopic(poolId: string): string {
    return this.abiCoder.encode(["bytes32"], [poolId]);
  }

  /**
   * Decode a single Swap event log
   */
  private decodeSwap(log: any, blockTimestamp: number) {
    const decoded = this.abiCoder.decode(
      ["int128", "int128", "uint160", "uint128", "int24", "uint24"],
      log.data
    );
    return {
      amount0: decoded[0],
      amount1: decoded[1],
      sqrtPriceX96: decoded[2],
      blockNumber: log.blockNumber,
      timestamp: blockTimestamp,
    };
  }

  /**
   * Get ETH price from CoinGecko (cached in-memory)
   */
  private ethPriceCache: { price: number; ts: number } = { price: 2500, ts: 0 };

  private async getETHPrice(): Promise<number> {
    if (Date.now() - this.ethPriceCache.ts < 300000) {
      return this.ethPriceCache.price;
    }
    try {
      const resp = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await resp.json();
      this.ethPriceCache = { price: data.ethereum?.usd || 2500, ts: Date.now() };
    } catch {}
    return this.ethPriceCache.price;
  }

  /**
   * Get TVL from StateView contract
   */
  private async getTVL(poolId: string): Promise<number> {
    try {
      const sv = new ethers.Contract(STATE_VIEW, STATE_VIEW_ABI, this.provider);
      const [slot0, liq] = await Promise.all([
        sv.getSlot0(poolId),
        sv.getLiquidity(poolId),
      ]);

      const sqrtP = Number(slot0[0]) / 2 ** 96;
      const liqNum = Number(liq);
      // token0 = WETH (18 dec), token1 = IMD (18 dec)
      // TVL in WETH = liquidity / sqrtPrice / 1e18
      const tvlWETH = liqNum / sqrtP / 1e18;
      const ethUsd = await this.getETHPrice();
      return tvlWETH * ethUsd;
    } catch {
      return 0;
    }
  }

  /**
   * Fetch 24h metrics for a pool using raw getLogs + topic filtering
   */
  async getPoolMetrics(poolId: string): Promise<PoolMetrics | null> {
    const cached = this.cache.get(poolId);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const latest = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - 7200); // ~24h

      const topic = this.poolTopic(poolId);

      // Fetch Swap events
      const swapLogs = await this.provider.getLogs({
        address: POOL_MANAGER,
        topics: [SWAP_TOPIC, topic],
        fromBlock,
        toBlock: latest,
      });

      // Get block timestamps
      const blockNums = [...new Set(swapLogs.map((l) => l.blockNumber))];
      const blocks = await Promise.all(
        blockNums.map((b) => this.provider.getBlock(b))
      );
      const tsMap = new Map(blockNums.map((b, i) => [b, blocks[i]?.timestamp || 0]));

      // Decode and calculate volume
      const ethUsd = await this.getETHPrice();
      let totalVolumeWETH = 0;
      const now = Math.floor(Date.now() / 1000);
      const cutoff = now - 86400;

      for (const log of swapLogs) {
        const ts = tsMap.get(log.blockNumber) || 0;
        if (ts < cutoff) continue;

        const decoded = this.abiCoder.decode(
          ["int128", "int128", "uint160", "uint128", "int24", "uint24"],
          log.data
        );
        // amount0 is in token0 (WETH, 18 decimals)
        // take absolute value since direction depends on swap side
        totalVolumeWETH += Math.abs(Number(decoded[0])) / 1e18;
      }

      const volume24hUSD = totalVolumeWETH * ethUsd;
      const fees24hUSD = volume24hUSD * FEE_RATE;
      const tvlUSD = await this.getTVL(poolId);
      const apy = tvlUSD > 0 ? (fees24hUSD * 365 / tvlUSD) * 100 : 0;

      const metrics: PoolMetrics = {
        volume24hUSD,
        fees24hUSD,
        txs24h: swapLogs.filter((l) => tsMap.get(l.blockNumber)! >= cutoff).length,
        tvlUSD,
        apy,
      };

      this.cache.set(poolId, { data: metrics, ts: Date.now() });
      return metrics;
    } catch (error) {
      console.error("EventIndexer error:", error);
      return null;
    }
  }

  /**
   * Fetch metrics for both pools
   */
  async fetchBothPools(): Promise<{
    hook: PoolMetrics | null;
    native: PoolMetrics | null;
  }> {
    const [hook, native] = await Promise.all([
      this.getPoolMetrics(POOL_IDS.hook),
      this.getPoolMetrics(POOL_IDS.native),
    ]);
    return { hook, native };
  }
}

let indexerInstance: EventIndexer | null = null;

export function getEventIndexer(): EventIndexer {
  if (!indexerInstance) {
    indexerInstance = new EventIndexer();
  }
  return indexerInstance;
}
