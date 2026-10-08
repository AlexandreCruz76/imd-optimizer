import { NextResponse } from "next/server";
import { fetchBothPoolsFromGraph } from "@/lib/graphClient";
import { getEventIndexer } from "@/lib/eventIndexer";

export const dynamic = "force-dynamic";

interface Snapshot {
  timestamp: string;
  hookAPY: number;
  nativeAPY: number;
  spread: number;
  winner: "hook" | "native";
  hookTVL: number;
  nativeTVL: number;
  hookVol24h: number;
  nativeVol24h: number;
  hookFees24h: number;
  nativeFees24h: number;
  hookTxs: number;
  nativeTxs: number;
  hookPair: string;
  nativePair: string;
  hookFeeTier: number;
  nativeFeeTier: number;
}

const history: Snapshot[] = [];
const MAX_HISTORY = 1440;

function calcAPY(fees: number, tvl: number) {
  return tvl > 0 ? (fees * 365 / tvl) * 100 : 0;
}

async function fetchData() {
  // Try Graph first
  const apiKey = process.env.THE_GRAPH_API_KEY || "";
  let hookTv = 0, hookVol = 0, hookFees = 0, hookTxs = 0;
  let nativeTv = 0, nativeVol = 0, nativeFees = 0, nativeTxs = 0;
  let useGraph = false;

  if (apiKey) {
    try {
      const pools = await fetchBothPoolsFromGraph(apiKey);
      if (pools.hook || pools.native) {
        useGraph = true;
        if (pools.hook) {
          hookTv = pools.hook.tvlUSD;
          hookVol = pools.hook.volume24hUSD;
          hookFees = pools.hook.fees24hUSD;
          hookTxs = pools.hook.txs24h;
        }
        if (pools.native) {
          nativeTv = pools.native.tvlUSD;
          nativeVol = pools.native.volume24hUSD;
          nativeFees = pools.native.fees24hUSD;
          nativeTxs = pools.native.txs24h;
        }
      }
    } catch {}
  }

  // Fallback to Event Indexer
  if (!useGraph) {
    try {
      const indexer = getEventIndexer();
      const [h, n] = await Promise.all([
        indexer.getPoolMetrics("0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704"),
        indexer.getPoolMetrics("0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3"),
      ]);
      if (h) { hookTv = h.tvlUSD; hookVol = h.volume24hUSD; hookFees = h.fees24hUSD; hookTxs = h.txs24h; }
      if (n) { nativeTv = n.tvlUSD; nativeVol = n.volume24hUSD; nativeFees = n.fees24hUSD; nativeTxs = n.txs24h; }
    } catch {}
  }

  const hookAPY = calcAPY(hookFees, hookTv);
  const nativeAPY = calcAPY(nativeFees, nativeTv);
  const spread = hookAPY - nativeAPY;

  return { hookTv, hookVol, hookFees, hookTxs, nativeTv, nativeVol, nativeFees, nativeTxs, hookAPY, nativeAPY, spread };
}

export async function GET() {
  try {
    const d = await fetchData();

    const snapshot: Snapshot = {
      timestamp: new Date().toISOString(),
      hookAPY: d.hookAPY,
      nativeAPY: d.nativeAPY,
      spread: d.spread,
      winner: d.hookAPY > d.nativeAPY ? "hook" : "native",
      hookTVL: d.hookTv,
      nativeTVL: d.nativeTv,
      hookVol24h: d.hookVol,
      nativeVol24h: d.nativeVol,
      hookFees24h: d.hookFees,
      nativeFees24h: d.nativeFees,
      hookTxs: d.hookTxs,
      nativeTxs: d.nativeTxs,
      hookPair: "ETH/IMD",
      nativePair: "ETH/IMD",
      hookFeeTier: 500,
      nativeFeeTier: 500,
    };

    history.push(snapshot);
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

    // Stats
    const spreads = history.map((s) => s.spread);
    const avgSpread = spreads.length > 0 ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0;
    const maxSpread = spreads.length > 0 ? Math.max(...spreads) : 0;
    const minSpread = spreads.length > 0 ? Math.min(...spreads) : 0;
    const hookWins = history.filter((s) => s.winner === "hook").length;
    const nativeWins = history.filter((s) => s.winner === "native").length;

    const THRESHOLD = 2.0;
    const recommendedPool = d.spread > THRESHOLD ? "hook" : d.spread < -THRESHOLD ? "native" : "hold";

    return NextResponse.json({
      current: snapshot,
      stats: {
        snapshotsCollected: history.length,
        avgSpread: avgSpread.toFixed(2),
        maxSpread: maxSpread.toFixed(2),
        minSpread: minSpread.toFixed(2),
        hookWins,
        nativeWins,
        hookWinRate: history.length > 0 ? ((hookWins / history.length) * 100).toFixed(1) : "0",
        nativeWinRate: history.length > 0 ? ((nativeWins / history.length) * 100).toFixed(1) : "0",
      },
      recommendation: {
        migrationNeeded: Math.abs(d.spread) > THRESHOLD,
        recommendedPool,
        spreadThreshold: THRESHOLD,
        currentSpread: d.spread.toFixed(2),
        reasoning:
          recommendedPool === "hook"
            ? `Hook APY (${d.hookAPY.toFixed(1)}%) beats Native (${d.nativeAPY.toFixed(1)}%) by ${Math.abs(d.spread).toFixed(1)}%`
            : recommendedPool === "native"
            ? `Native APY (${d.nativeAPY.toFixed(1)}%) beats Hook (${d.hookAPY.toFixed(1)}%) by ${Math.abs(d.spread).toFixed(1)}%`
            : `Spread (${Math.abs(d.spread).toFixed(1)}%) below threshold (${THRESHOLD}%) — hold position`,
      },
      history: history.slice(-60),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Arbitrage API error:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}
