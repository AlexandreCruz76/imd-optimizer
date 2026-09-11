/**
 * Hook Pool Analyzer
 * 
 * Core analysis engine for the $IMD CappedBurnHook pool.
 * Fetches on-chain data and computes key metrics for optimization.
 */

import { CONFIG } from "./config";

// ───────────────────────── Types ─────────────────────────
export interface PoolState {
  block: number;
  timestamp: number;
  tick: number;
  price: number; // IMD per ETH
  imdUsd: number | null;
  ethUsd: number | null;
  
  // Liquidity
  ethInPool: number;
  imdInPool: number;
  inventoryCap: number;
  capFloor: number;
  capDecayPerDay: number;
  positionLiquidity: bigint;
  
  // Backstop
  backstopLower: number;
  backstopUpper: number;
  backstopLiquidity: bigint;
  backstopPrincipal: number;
  backstopConverted: number;
  
  // Fees & Rewards
  lpFee: number;
  rewardShareBps: number;
  feeTokenClaims: number;
  feeEthClaims: number;
  totalBurned: number;
  totalRewarded: number;
  
  // Retained ETH
  retainedEth: number;
  rebalanceThreshold: number;
  pendingRebalance: boolean;
  rebalanceEnabled: boolean;
  
  // Reference pool
  referenceTick: number;
  referenceLiquidity: number;
  
  // Hook share
  hookLiquidityShare: number;
  hookVolumeShare: number;
}

export interface SwapSummary {
  totalSwaps: number;
  buys: number;
  sells: number;
  buyEthIn: number;
  buyImdOut: number;
  sellImdIn: number;
  sellEthOut: number;
  volumeEth: number;
  netEthFlow: number;
  avgSwapSizeEth: number;
}

export interface TrimSummary {
  totalTrims: number;
  burned: number;
  rewarded: number;
  ethRetained: number;
  avgBurnPerTrim: number;
  avgRewardPerTrim: number;
}

export interface LPPosition {
  ethAmount: number;
  imdAmount: number;
  shareOfPool: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
}

export interface OptimizationResult {
  // Current state
  current: PoolState;
  
  // Projections
  projections: {
    days: number;
    estimatedFees: number;
    estimatedBurns: number;
    estimatedRewards: number;
    estimatedImpermanentLoss: number;
    netReturn: number;
    apy: number;
  }[];
  
  // Recommendations
  recommendations: {
    action: "hold" | "add" | "remove" | "rebalance";
    reason: string;
    optimalSize: number;
    optimalRange: { lower: number; upper: number };
    expectedImprovement: number;
  };
  
  // Metrics
  metrics: {
    currentApy: number;
    projectedApy: number;
    riskScore: number; // 0-100
    impermanentLossEstimate: number;
    burnContribution: number;
    rewardContribution: number;
  };
}

// ───────────────────────── RPC Helper ─────────────────────────
const TWO_255 = BigInt(1) << BigInt(255);
const TWO_256 = BigInt(1) << BigInt(256);

const word = (data: string, i: number): bigint => 
  BigInt("0x" + (data.slice(2 + 64 * i, 2 + 64 * (i + 1)) || "0"));

const signed = (v: bigint): bigint => 
  v >= TWO_255 ? v - TWO_256 : v;

const eth = (w: bigint): number => Number(w) / 1e18;
const num = (v: bigint): number => Number(v);
const tickPrice = (t: number): number => Math.pow(1.0001, t);
const sqrtAt = (t: number): number => Math.pow(1.0001, t / 2);

// View function selectors
const SEL: Record<string, string> = {
  "poolId()": "0x3e0dc34e",
  "currentTick()": "0x065e5360",
  "tokensInPool()": "0x40e1e4c7",
  "inventoryCap()": "0xdb445ee8",
  "capFloor()": "0x6dd16b2c",
  "capDecayTokensPerDay()": "0x55e62941",
  "ethInPool()": "0x71d2cc5c",
  "retainedEth()": "0x9d3ec016",
  "feeTokenClaims()": "0xc8f6cd9a",
  "feeEthClaims()": "0x1c5ea67f",
  "totalBurned()": "0xd89135cd",
  "totalRewarded()": "0xaed29d07",
  "backstop()": "0x7dea1817",
  "backstopEthPrincipal()": "0xb4cc4bb1",
  "backstopConvertedEth()": "0x6723bad1",
  "deploymentFloorTick()": "0x5ae01c91",
  "refTick()": "0x7ac776be",
  "floorDecayTicksPerDay()": "0x26387ed6",
  "rebalanceEthThreshold()": "0xa1b66c03",
  "rebalanceEnabled()": "0x81fdec27",
  "keeperReward()": "0xa9ec75f6",
  "pendingRebalance()": "0x73588d61",
  "positionLiquidity()": "0x7211dc36",
  "lpFee()": "0x704ce43e",
  "rewardShareBps()": "0x9124b5c7",
  "slot0()": "0x3850c7bd",
  "getSlot0(bytes32)": "0xc815641c",
  "getLiquidity(bytes32)": "0xfa6793d5",
};

// Event topics
const TOPICS: Record<string, string> = {
  Swap: "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f",
  Trimmed: "0x32afb9555b0493ac0021ef7f6b122197e9e58510e694383410f667ec76e4f0fa",
};

// ───────────────────────── Chain Class ─────────────────────────
class Chain {
  private urls: string[];
  private i = 0;
  public calls = 0;

  constructor(urls: string[]) {
    this.urls = urls;
  }

  async rpc(method: string, params: unknown[]): Promise<any> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < this.urls.length * 2; attempt++) {
      const url = this.urls[this.i % this.urls.length];
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), CONFIG.rpc.timeoutMs);
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          signal: ctl.signal,
        });
        clearTimeout(timer);
        const j: any = await res.json();
        if (j.error) {
          const code = Number(j.error.code);
          const msg = String(j.error.message ?? "");
          if (code === 3 || /revert|invalid argument|cannot unmarshal/i.test(msg)) {
            throw Object.assign(new Error(`${url}: ${JSON.stringify(j.error)}`), { fatal: true });
          }
          throw new Error(`${url}: ${JSON.stringify(j.error)}`);
        }
        const r = j.result;
        if ((method === "eth_call" || method === "eth_blockNumber") && typeof r !== "string") {
          throw new Error(`${url}: bad ${method} result`);
        }
        if (method === "eth_getLogs" && !Array.isArray(r)) {
          throw new Error(`${url}: bad eth_getLogs result`);
        }
        this.calls++;
        return r;
      } catch (e) {
        if ((e as any)?.fatal) throw e;
        lastErr = e;
        this.i++;
      }
    }
    throw lastErr;
  }

  async call(to: string, sig: string, ...args: string[]): Promise<string> {
    const data = SEL[sig] + args.map((a) => a.slice(2).toLowerCase().padStart(64, "0")).join("");
    return this.rpc("eth_call", [{ to, data }, "latest"]);
  }

  async u(to: string, sig: string, ...args: string[]): Promise<bigint> {
    return word(await this.call(to, sig, ...args), 0);
  }

  async i24(to: string, sig: string): Promise<number> {
    return num(signed(await this.u(to, sig)));
  }

  async latest(): Promise<number> {
    return parseInt(await this.rpc("eth_blockNumber", []), 16);
  }

  async logs(address: string | string[] | null, topics: (string | null)[] | null, from: number, to: number): Promise<any[]> {
    const out: any[] = [];
    let a = from;
    const step = 3000;
    while (a <= to) {
      const b = Math.min(a + step - 1, to);
      try {
        const filter: any = { fromBlock: "0x" + a.toString(16), toBlock: "0x" + b.toString(16) };
        if (address) filter.address = address;
        if (topics) filter.topics = topics;
        out.push(...(await this.rpc("eth_getLogs", [filter])));
        a = b + 1;
      } catch (e) {
        if (step <= 200) throw e;
        // Shrink and retry
        a = Math.max(a, a + Math.floor((b - a) / 2));
      }
    }
    out.sort((x: any, y: any) => 
      parseInt(x.blockNumber, 16) - parseInt(y.blockNumber, 16) || 
      parseInt(x.logIndex, 16) - parseInt(y.logIndex, 16)
    );
    return out;
  }
}

// ───────────────────────── Analyzer Class ─────────────────────────
export class HookPoolAnalyzer {
  private ch: Chain;
  private poolId: string = "";
  private initialized = false;

  constructor(rpcUrls?: string[]) {
    const urls = rpcUrls ?? [...CONFIG.rpc.publicEndpoints];
    // Shuffle for load balancing
    for (let i = urls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [urls[i], urls[j]] = [urls[j], urls[i]];
    }
    this.ch = new Chain(urls);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.poolId = "0x" + (await this.ch.call(CONFIG.contracts.hook, "poolId()")).slice(2, 66);
    this.initialized = true;
  }

  async getPoolState(): Promise<PoolState> {
    await this.init();
    const c = this.ch;
    const h = CONFIG.contracts.hook;
    const g = (s: string) => c.u(h, s);

    // Fetch all state in parallel
    const [
      block,
      tick,
      tokensInPool,
      inventoryCap,
      capFloor,
      capDecayPerDay,
      ethInPool,
      retainedEth,
      feeTokenClaims,
      feeEthClaims,
      totalBurned,
      totalRewarded,
      lpFee,
      rewardShareBps,
      positionLiquidity,
      rebalanceThreshold,
      rebalanceEnabled,
      pendingRebalance,
      backstopData,
      backstopPrincipal,
      backstopConverted,
      refTick,
    ] = await Promise.all([
      c.latest(),
      c.i24(h, "currentTick()"),
      g("tokensInPool()"),
      g("inventoryCap()"),
      g("capFloor()"),
      g("capDecayTokensPerDay()"),
      g("ethInPool()"),
      g("retainedEth()"),
      g("feeTokenClaims()"),
      g("feeEthClaims()"),
      g("totalBurned()"),
      g("totalRewarded()"),
      g("lpFee()"),
      g("rewardShareBps()"),
      g("positionLiquidity()"),
      g("rebalanceEthThreshold()"),
      g("rebalanceEnabled()"),
      g("pendingRebalance()"),
      c.call(h, "backstop()"),
      g("backstopEthPrincipal()"),
      g("backstopConvertedEth()"),
      c.i24(h, "refTick()"),
    ]);

    // Parse backstop
    const bs = backstopData;
    const backstopLower = num(signed(word(bs, 0)));
    const backstopUpper = num(signed(word(bs, 1)));
    const backstopLiq = word(bs, 2);

    // Get reference pool state
    const refSlot0 = await c.call(CONFIG.contracts.stateView, "getSlot0(bytes32)", CONFIG.contracts.referencePoolId);
    const referenceTick = num(signed(word(refSlot0, 1)));
    const referenceLiquidity = await c.u(CONFIG.contracts.stateView, "getLiquidity(bytes32)", CONFIG.contracts.referencePoolId);

    // Get ETH/USD price
    let ethUsd: number | null = null;
    try {
      const sq = await c.u(CONFIG.contracts.ethUsdcV3, "slot0()");
      const p = Number(sq) / 2 ** 96;
      ethUsd = 1e12 / (p * p);
    } catch {
      // Ignore if unavailable
    }

    const price = tickPrice(tick);
    const imdUsd = ethUsd ? ethUsd / price : null;

    // Calculate hook liquidity share
    const hl = Number(positionLiquidity);
    const rl = Number(referenceLiquidity);
    const hookLiquidityShare = hl / (hl + rl);

    return {
      block,
      timestamp: Date.now(),
      tick,
      price,
      imdUsd,
      ethUsd,
      ethInPool: eth(ethInPool),
      imdInPool: eth(tokensInPool),
      inventoryCap: eth(inventoryCap),
      capFloor: eth(capFloor),
      capDecayPerDay: eth(capDecayPerDay),
      positionLiquidity,
      backstopLower,
      backstopUpper,
      backstopLiquidity: backstopLiq,
      backstopPrincipal: eth(backstopPrincipal),
      backstopConverted: eth(backstopConverted),
      lpFee: num(lpFee) / 1e6,
      rewardShareBps: num(rewardShareBps),
      feeTokenClaims: eth(feeTokenClaims),
      feeEthClaims: eth(feeEthClaims),
      totalBurned: eth(totalBurned),
      totalRewarded: eth(totalRewarded),
      retainedEth: eth(retainedEth),
      rebalanceThreshold: eth(rebalanceThreshold),
      pendingRebalance: pendingRebalance === BigInt(1),
      rebalanceEnabled: rebalanceEnabled === BigInt(1),
      referenceTick,
      referenceLiquidity: eth(referenceLiquidity),
      hookLiquidityShare,
      hookVolumeShare: 0, // Will be calculated from swaps
    };
  }

  async getSwapSummary(hours: number = 24): Promise<SwapSummary> {
    await this.init();
    const latest = await this.ch.latest();
    const from = Math.max(CONFIG.pool.openBlock, latest - Math.round(hours * CONFIG.pool.blocksPerHour));

    // V4 Swap event does NOT include poolId as a topic, so we cannot filter by pool.
    // Instead, use the Hook contract's Trimmed events (pool-specific) and
    // feeEthClaims delta for volume estimation.

    // 1. Get Trimmed events from Hook contract (these ARE pool-specific)
    const trimLogs = await this.ch.logs(
      CONFIG.contracts.hook,
      [TOPICS.Trimmed],
      from,
      latest
    );

    let burned = 0;
    let rewarded = 0;
    let ethRetained = 0;

    for (const l of trimLogs) {
      burned += eth(word(l.data, 1));
      rewarded += eth(word(l.data, 2));
      ethRetained += eth(word(l.data, 3));
    }

    // 2. Read feeEthClaims at current block and at from block to get delta
    const feeEthNow = await this.ch.u(CONFIG.contracts.hook, "feeEthClaims()");
    const feeEthPast = await this.ch.call(
      CONFIG.contracts.hook,
      "feeEthClaims()",
    ).then((r) => word(r, 0)).catch(() => BigInt(0));

    // Note: eth_call with block tag requires a different approach
    // For now, use the on-chain state values which are cumulative
    // The hook contract exposes: feeEthClaims, feeTokenClaims, totalBurned, totalRewarded

    // Estimate volume from Trimmed events:
    // Each trim captures ETH retained as fees. Total volume ≈ ethRetained / lpFee
    const lpFee = 0.01; // 1%
    const hookVolume = ethRetained > 0 ? ethRetained / lpFee : 0;

    // Swaps: count of Trimmed events is NOT the same as swap count
    // Each trim happens after one or more swaps trigger the cap
    // Use trimLogs.length as a lower bound for activity
    const totalSwaps = trimLogs.length;

    return {
      totalSwaps,
      buys: 0,  // Cannot determine from Trimmed events alone
      sells: 0,
      buyEthIn: hookVolume / 2,   // Split 50/50 as rough estimate
      buyImdOut: 0,
      sellImdIn: 0,
      sellEthOut: hookVolume / 2,
      volumeEth: hookVolume,
      netEthFlow: 0,
      avgSwapSizeEth: totalSwaps > 0 ? hookVolume / totalSwaps : 0,
    };
  }

  async getTrimSummary(hours: number = 24): Promise<TrimSummary> {
    await this.init();
    const latest = await this.ch.latest();
    const from = Math.max(CONFIG.pool.openBlock, latest - Math.round(hours * CONFIG.pool.blocksPerHour));
    const to = latest;

    const logs = await this.ch.logs(
      CONFIG.contracts.hook,
      [TOPICS.Trimmed],
      from,
      to
    );

    let burned = 0;
    let rewarded = 0;
    let ethRetained = 0;

    for (const l of logs) {
      burned += eth(word(l.data, 1));
      rewarded += eth(word(l.data, 2));
      ethRetained += eth(word(l.data, 3));
    }

    return {
      totalTrims: logs.length,
      burned,
      rewarded,
      ethRetained,
      avgBurnPerTrim: logs.length > 0 ? burned / logs.length : 0,
      avgRewardPerTrim: logs.length > 0 ? rewarded / logs.length : 0,
    };
  }

  async getVolumeShare(hours: number = 24): Promise<{ hookVolume: number; referenceVolume: number; share: number }> {
    await this.init();
    const latest = await this.ch.latest();
    const from = Math.max(CONFIG.pool.openBlock, latest - Math.round(hours * CONFIG.pool.blocksPerHour));

    // V4 Swap events cannot be filtered by poolId (not in topics).
    // Use Hook contract Trimmed events to get real hook pool volume.
    const trimLogs = await this.ch.logs(
      CONFIG.contracts.hook,
      [TOPICS.Trimmed],
      from,
      latest
    );

    let hookEthRetained = 0;
    let hookTrimVolume = 0;
    for (const l of trimLogs) {
      hookEthRetained += eth(word(l.data, 3));
      hookTrimVolume += eth(word(l.data, 0));
    }

    const lpFee = 0.01;
    // hookTrimVolume is the raw ETH that flowed through trimmed swaps
    // ethRetained is the fee portion
    // Total estimated volume = ethRetained / lpFee
    const hookVolume = hookEthRetained > 0 ? hookEthRetained / lpFee : 0;

    // Native pool volume cannot be reliably estimated from on-chain data
    // without an indexer (The Graph, etc). Mark as unavailable.
    const referenceVolume = 0;

    const total = hookVolume + referenceVolume;

    return {
      hookVolume,
      referenceVolume,
      share: total > 0 ? hookVolume / total : 1.0,
    };
  }

  async calculateOptimalPosition(
    state: PoolState,
    swapSummary: SwapSummary,
    trimSummary: TrimSummary,
    investmentEth: number
  ): Promise<LPPosition> {
    // For a full-range position (safest for optimizer)
    const tickLower = -887220; // Min tick
    const tickUpper = 887220;  // Max tick

    // Calculate share of pool
    const totalEthInPool = state.ethInPool + state.backstopPrincipal;
    const shareOfPool = investmentEth / (totalEthInPool + investmentEth);

    // Calculate proportional liquidity (simplified)
    // In reality, this would use the Uniswap V4 position math
    const liquidity = BigInt(Math.floor(investmentEth * 1e18 * Math.sqrt(state.price)));

    // Calculate proportional IMD needed
    const imdAmount = investmentEth * state.price;

    return {
      ethAmount: investmentEth,
      imdAmount,
      shareOfPool,
      tickLower,
      tickUpper,
      liquidity,
    };
  }

  async analyze(investmentEth: number = 10): Promise<OptimizationResult> {
    await this.init();

    // Fetch all data
    const state = await this.getPoolState();
    const swapSummary = await this.getSwapSummary(CONFIG.optimizer.analysisWindowHours);
    const trimSummary = await this.getTrimSummary(CONFIG.optimizer.analysisWindowHours);
    const volumeShare = await this.getVolumeShare(CONFIG.optimizer.analysisWindowHours);

    // Update state with volume share
    state.hookVolumeShare = volumeShare.share;

    // Calculate current APY
    const hoursAnalyzed = CONFIG.optimizer.analysisWindowHours;
    const feesPerHour = swapSummary.volumeEth * state.lpFee / hoursAnalyzed;
    const annualizedFees = feesPerHour * 8760; // 24 * 365
    const currentApy = state.ethInPool > 0 ? annualizedFees / state.ethInPool : 0;

    // Calculate optimal position
    const position = await this.calculateOptimalPosition(state, swapSummary, trimSummary, investmentEth);

    // Generate projections
    const projections = CONFIG.optimizer.projectionDays.map((days) => {
      const dailyVolume = swapSummary.volumeEth / (hoursAnalyzed / 24);
      const dailyFees = dailyVolume * state.lpFee * position.shareOfPool;
      const estimatedFees = dailyFees * days;

      const dailyBurns = trimSummary.burned / (hoursAnalyzed / 24);
      const estimatedBurns = dailyBurns * position.shareOfPool * days;

      const dailyRewards = trimSummary.rewarded / (hoursAnalyzed / 24);
      const estimatedRewards = dailyRewards * position.shareOfPool * days;

      // Simplified impermanent loss estimate (for full-range, IL is minimal)
      const estimatedImpermanentLoss = investmentEth * 0.01 * Math.sqrt(days / 30); // Rough estimate

      const netReturn = estimatedFees + estimatedRewards - estimatedImpermanentLoss;
      const apy = days > 0 ? (netReturn / investmentEth) * (365 / days) : 0;

      return {
        days,
        estimatedFees,
        estimatedBurns,
        estimatedRewards,
        estimatedImpermanentLoss,
        netReturn,
        apy,
      };
    });

    // Generate recommendations
    const recommendedProjection = projections.find((p) => p.days === 30) ?? projections[0];
    let action: "hold" | "add" | "remove" | "rebalance" = "hold";
    let reason = "Current position is optimal";
    let expectedImprovement = 0;

    if (state.hookLiquidityShare < 0.3) {
      action = "add";
      reason = `Hook pool has only ${(state.hookLiquidityShare * 100).toFixed(1)}% liquidity share. Adding liquidity improves protocol health and earns fees.`;
      expectedImprovement = (0.3 - state.hookLiquidityShare) * 100;
    } else if (state.hookLiquidityShare > 0.7) {
      action = "remove";
      reason = `Hook pool has ${(state.hookLiquidityShare * 100).toFixed(1)}% liquidity share. Consider diversifying.`;
    } else if (recommendedProjection.apy < 0.05) {
      action = "add";
      reason = `Current APY is ${(recommendedProjection.apy * 100).toFixed(1)}%. Adding more liquidity increases fee earnings.`;
      expectedImprovement = 5 - recommendedProjection.apy * 100;
    }

    // Risk score (0-100, lower is better)
    const riskScore = Math.min(100, Math.max(0,
      (1 - state.hookLiquidityShare) * 30 + // Lower liquidity = higher risk
      (state.pendingRebalance ? 20 : 0) + // Pending rebalance = moderate risk
      (state.retainedEth < state.rebalanceThreshold ? 10 : 0) + // Low retained ETH
      (1 - volumeShare.share) * 40 // Lower volume share = higher risk
    ));

    return {
      current: state,
      projections,
      recommendations: {
        action,
        reason,
        optimalSize: investmentEth,
        optimalRange: { lower: position.tickLower, upper: position.tickUpper },
        expectedImprovement,
      },
      metrics: {
        currentApy,
        projectedApy: recommendedProjection.apy,
        riskScore,
        impermanentLossEstimate: recommendedProjection.estimatedImpermanentLoss,
        burnContribution: recommendedProjection.estimatedBurns,
        rewardContribution: recommendedProjection.estimatedRewards,
      },
    };
  }
}

export default HookPoolAnalyzer;
