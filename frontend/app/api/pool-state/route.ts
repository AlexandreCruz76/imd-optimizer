import { NextResponse } from "next/server";
import { HookPoolAnalyzer } from "@/lib/hookPoolAnalyzer";
import { fetchBothPoolsFromGraph } from "@/lib/graphClient";

export const dynamic = "force-dynamic";

let cachedState: any = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 60 seconds

export async function GET() {
  try {
    // Use cache if fresh
    if (cachedState && Date.now() - lastFetch < CACHE_TTL) {
      return NextResponse.json(cachedState);
    }

    const analyzer = new HookPoolAnalyzer();
    const state = await analyzer.getPoolState();
    const swapSummary = await analyzer.getSwapSummary(24);

    // Fetch real data from The Graph for both pools
    const apiKey = process.env.THE_GRAPH_API_KEY || "";
    let graphHook: any = null;
    let graphNative: any = null;

    if (apiKey) {
      try {
        const pools = await fetchBothPoolsFromGraph(apiKey);
        graphHook = pools.hook;
        graphNative = pools.native;
      } catch (e) {
        console.error("Graph fetch failed:", e);
      }
    }

    // Use Graph data if available, fallback to on-chain estimates
    const nativeVolUSD = graphNative?.volume24hUSD || 0;
    const nativeTVL = graphNative?.tvlUSD || 0;
    const nativeFees24h = graphNative?.fees24hUSD || 0;
    const nativeTxs = graphNative?.txs24h || 0;
    const nativeAPY = graphNative?.apy || 0;

    const hookVolUSD = graphHook?.volume24hUSD || 0;
    const hookTVL = graphHook?.tvlUSD || 0;
    const hookFees24h = graphHook?.fees24hUSD || 0;
    const hookTxs = graphHook?.txs24h || 0;
    const hookAPY = graphHook?.apy || 0;

    const data = {
      // Hook pool (on-chain data)
      ethBalance: state.ethInPool.toFixed(4),
      imdBalance: state.imdInPool.toFixed(0),
      liquidityETH: state.ethInPool.toFixed(4),
      liquidityIMD: state.imdInPool.toFixed(0),
      lpFee: (state.lpFee * 100).toFixed(2),
      price: state.price.toFixed(2),
      imdUsd: state.imdUsd?.toFixed(4) || null,
      ethUsd: state.ethUsd?.toFixed(0) || null,
      burnsTotal: state.totalBurned.toFixed(0),
      rewardsTotal: state.totalRewarded.toFixed(0),
      swaps24h: swapSummary.totalSwaps,
      block: state.block,

      // Hook pool (The Graph)
      hookTVL: hookTVL.toFixed(0),
      hookVolumeUSD: hookVolUSD.toFixed(0),
      hookFeesUSD: hookFees24h.toFixed(2),
      hookTxs24h: hookTxs,
      hookAPY: hookAPY.toFixed(1),
      hookPair: graphHook?.pair || "ETH/IMD",
      hookFeeTier: graphHook?.feeTier || 10000,

      // Native pool (The Graph)
      nativeTVL: nativeTVL.toFixed(0),
      nativeVolumeUSD: nativeVolUSD.toFixed(0),
      nativeFeesUSD: nativeFees24h.toFixed(2),
      nativeTxs24h: nativeTxs,
      nativeAPY: nativeAPY.toFixed(1),
      nativePair: graphNative?.pair || "ETH/IMD",
      nativeFeeTier: graphNative?.feeTier || 10000,

      // Comparison
      spreadAPY: (hookAPY - nativeAPY).toFixed(1),
      hookTVLratio: (hookTVL / Math.max(nativeTVL, 1)).toFixed(2),
      hookVolRatio: (hookVolUSD / Math.max(nativeVolUSD, 1)).toFixed(2),

      timestamp: new Date().toISOString(),
    };

    cachedState = data;
    lastFetch = Date.now();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch pool state:", error);
    return NextResponse.json(
      { error: "Failed to fetch pool state", details: String(error) },
      { status: 500 }
    );
  }
}
