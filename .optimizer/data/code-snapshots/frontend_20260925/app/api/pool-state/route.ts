import { NextResponse } from "next/server";
import { HookPoolAnalyzer } from "@/lib/hookPoolAnalyzer";
import { fetchBothPoolsFromGraph } from "@/lib/graphClient";
import { getOnChainFetcher } from "@/lib/onChainFetcher";
import { getEventIndexer } from "@/lib/eventIndexer";

export const dynamic = "force-dynamic";

let cachedState: any = null;
let lastFetch = 0;
const CACHE_TTL = 30000;

export async function GET() {
  try {
    if (cachedState && Date.now() - lastFetch < CACHE_TTL) {
      return NextResponse.json(cachedState);
    }

    const analyzer = new HookPoolAnalyzer();
    const state = await analyzer.getPoolState();
    const swapSummary = await analyzer.getSwapSummary(24);

    // === DATA SOURCES (priority order) ===
    // 1. The Graph (best data, but indexers may be down)
    // 2. Custom Event Indexer (Swap events from PoolManager)
    // 3. On-chain StateView (TVL only, no volume)

    const apiKey = process.env.THE_GRAPH_API_KEY || "";
    let graphHook: any = null;
    let graphNative: any = null;
    let graphFailed = false;

    // SOURCE 1: The Graph
    if (apiKey) {
      try {
        const pools = await fetchBothPoolsFromGraph(apiKey);
        graphHook = pools.hook;
        graphNative = pools.native;
        if (!graphHook && !graphNative) graphFailed = true;
      } catch (e) {
        console.error("Graph failed:", e);
        graphFailed = true;
      }
    } else {
      graphFailed = true;
    }

    // SOURCE 2: Custom Event Indexer (Swap events)
    let eventHook: any = null;
    let eventNative: any = null;

    if (graphFailed || (graphHook?.tvlUSD === 0 && graphNative?.tvlUSD === 0)) {
      try {
        const indexer = getEventIndexer();
        const [hookMetrics, nativeMetrics] = await Promise.all([
          indexer.getPoolMetrics("0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704"),
          indexer.getPoolMetrics("0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3"),
        ]);

        if (hookMetrics) {
          eventHook = {
            tvlUSD: hookMetrics.tvlUSD,
            volume24hUSD: hookMetrics.volume24hUSD,
            fees24hUSD: hookMetrics.fees24hUSD,
            txs24h: hookMetrics.txs24h,
            apy: hookMetrics.apy,
            pair: "ETH/IMD",
            feeTier: 10000,
          };
        }

        if (nativeMetrics) {
          eventNative = {
            tvlUSD: nativeMetrics.tvlUSD,
            volume24hUSD: nativeMetrics.volume24hUSD,
            fees24hUSD: nativeMetrics.fees24hUSD,
            txs24h: nativeMetrics.txs24h,
            apy: nativeMetrics.apy,
            pair: "ETH/IMD",
            feeTier: 10000,
          };
        }
      } catch (e) {
        console.error("Event indexer failed:", e);
      }
    }

    // SOURCE 3: On-chain StateView (TVL only)
    let stateHook: any = null;
    let stateNative: any = null;

    if (!graphHook && !eventHook) {
      try {
        const fetcher = getOnChainFetcher();
        const pools = await fetcher.fetchBothPools();
        if (pools.hook) {
          stateHook = {
            tvlUSD: pools.hook.tvlUSD,
            volume24hUSD: 0,
            fees24hUSD: 0,
            txs24h: 0,
            apy: 0,
            pair: "ETH/IMD",
            feeTier: 10000,
          };
        }
        if (pools.native) {
          stateNative = {
            tvlUSD: pools.native.tvlUSD,
            volume24hUSD: 0,
            fees24hUSD: 0,
            txs24h: 0,
            apy: 0,
            pair: "ETH/IMD",
            feeTier: 10000,
          };
        }
      } catch (e) {
        console.error("StateView also failed:", e);
      }
    }

    // === MERGE DATA (Graph > Event > StateView) ===
    const hook = graphHook || eventHook || stateHook || {};
    const native = graphNative || eventNative || stateNative || {};

    const dataSource = graphHook ? "graph" : eventHook ? "event-indexer" : "stateview";

    const data = {
      // Legacy fields (HookPoolAnalyzer)
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

      // Hook pool
      hookTVL: (hook.tvlUSD || 0).toFixed(0),
      hookVolumeUSD: (hook.volume24hUSD || 0).toFixed(0),
      hookFeesUSD: (hook.fees24hUSD || 0).toFixed(2),
      hookTxs24h: hook.txs24h || 0,
      hookAPY: (hook.apy || 0).toFixed(1),
      hookPair: hook.pair || "ETH/IMD",
      hookFeeTier: hook.feeTier || 10000,

      // Native pool
      nativeTVL: (native.tvlUSD || 0).toFixed(0),
      nativeVolumeUSD: (native.volume24hUSD || 0).toFixed(0),
      nativeFeesUSD: (native.fees24hUSD || 0).toFixed(2),
      nativeTxs24h: native.txs24h || 0,
      nativeAPY: (native.apy || 0).toFixed(1),
      nativePair: native.pair || "ETH/IMD",
      nativeFeeTier: native.feeTier || 10000,

      // Comparison
      spreadAPY: ((hook.apy || 0) - (native.apy || 0)).toFixed(1),
      hookTVLratio: ((hook.tvlUSD || 0) / Math.max(native.tvlUSD || 1, 1)).toFixed(2),
      hookVolRatio: ((hook.volume24hUSD || 0) / Math.max(native.volume24hUSD || 1, 1)).toFixed(2),

      // Metadata
      dataSource,
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
