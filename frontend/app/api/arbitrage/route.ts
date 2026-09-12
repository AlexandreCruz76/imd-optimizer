import { NextResponse } from "next/server";
import { fetchBothPoolsFromGraph } from "@/lib/graphClient";

export const dynamic = "force-dynamic";

interface ArbitrageSnapshot {
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

// In-memory history (last 24h of snapshots)
const history: ArbitrageSnapshot[] = [];
const MAX_HISTORY = 1440; // 24h * 60min

function calculateAPY(fees24h: number, tvl: number): number {
  return tvl > 0 ? (fees24h * 365 / tvl) * 100 : 0;
}

export async function GET() {
  try {
    const apiKey = process.env.THE_GRAPH_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "THE_GRAPH_API_KEY not configured" },
        { status: 500 }
      );
    }

    const pools = await fetchBothPoolsFromGraph(apiKey);
    const hook = pools.hook;
    const native = pools.native;

    const hookAPY = hook ? calculateAPY(hook.fees24hUSD, hook.tvlUSD) : 0;
    const nativeAPY = native ? calculateAPY(native.fees24hUSD, native.tvlUSD) : 0;
    const spread = hookAPY - nativeAPY;

    const snapshot: ArbitrageSnapshot = {
      timestamp: new Date().toISOString(),
      hookAPY,
      nativeAPY,
      spread,
      winner: hookAPY > nativeAPY ? "hook" : "native",
      hookTVL: hook?.tvlUSD || 0,
      nativeTVL: native?.tvlUSD || 0,
      hookVol24h: hook?.volume24hUSD || 0,
      nativeVol24h: native?.volume24hUSD || 0,
      hookFees24h: hook?.fees24hUSD || 0,
      nativeFees24h: native?.fees24hUSD || 0,
      hookTxs: hook?.txs24h || 0,
      nativeTxs: native?.txs24h || 0,
      hookPair: hook?.pair || "ETH/IMD",
      nativePair: native?.pair || "ETH/IMD",
      hookFeeTier: hook?.feeTier || 10000,
      nativeFeeTier: native?.feeTier || 10000,
    };

    // Store snapshot
    history.push(snapshot);
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    // Calculate statistics
    const spreads = history.map((s) => s.spread);
    const avgSpread = spreads.length > 0
      ? spreads.reduce((a, b) => a + b, 0) / spreads.length
      : 0;
    const maxSpread = spreads.length > 0 ? Math.max(...spreads) : 0;
    const minSpread = spreads.length > 0 ? Math.min(...spreads) : 0;

    // Count wins
    const hookWins = history.filter((s) => s.winner === "hook").length;
    const nativeWins = history.filter((s) => s.winner === "native").length;

    // Simulate earnings for 10 ETH over history
    let hookEarnings = 0;
    let nativeEarnings = 0;
    let arbitrageEarnings = 0;
    const investmentETH = 10;

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      const hoursBetween =
        (new Date(curr.timestamp).getTime() -
          new Date(prev.timestamp).getTime()) /
        (1000 * 60 * 60);

      // Always in best pool
      const bestAPY = Math.max(prev.hookAPY, prev.nativeAPY);
      arbitrageEarnings += (investmentETH * bestAPY / 100 / 365 / 24) * hoursBetween;

      // Always in hook
      hookEarnings += (investmentETH * prev.hookAPY / 100 / 365 / 24) * hoursBetween;

      // Always in native
      nativeEarnings += (investmentETH * prev.nativeAPY / 100 / 365 / 24) * hoursBetween;
    }

    const arbitrageGainVsHook = hookEarnings > 0
      ? ((arbitrageEarnings - hookEarnings) / hookEarnings) * 100
      : 0;
    const arbitrageGainVsNative = nativeEarnings > 0
      ? ((arbitrageEarnings - nativeEarnings) / nativeEarnings) * 100
      : 0;

    // Migration threshold analysis
    const THRESHOLD = 2.0; // 2% spread needed to justify migration cost
    const migrationNeeded = Math.abs(spread) > THRESHOLD;
    const recommendedPool = spread > THRESHOLD ? "hook" : spread < -THRESHOLD ? "native" : "hold";

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
      simulation: {
        investmentETH,
        hookEarningsETH: hookEarnings.toFixed(4),
        nativeEarningsETH: nativeEarnings.toFixed(4),
        arbitrageEarningsETH: arbitrageEarnings.toFixed(4),
        arbitrageGainVsHookPct: arbitrageGainVsHook.toFixed(2),
        arbitrageGainVsNativePct: arbitrageGainVsNative.toFixed(2),
      },
      recommendation: {
        migrationNeeded,
        recommendedPool,
        spreadThreshold: THRESHOLD,
        currentSpread: spread.toFixed(2),
        reasoning:
          recommendedPool === "hook"
            ? `Hook Pool APY (${hookAPY.toFixed(1)}%) beats Native (${nativeAPY.toFixed(1)}%) by ${Math.abs(spread).toFixed(1)}%`
            : recommendedPool === "native"
            ? `Native Pool APY (${nativeAPY.toFixed(1)}%) beats Hook (${hookAPY.toFixed(1)}%) by ${Math.abs(spread).toFixed(1)}%`
            : `Spread (${Math.abs(spread).toFixed(1)}%) below threshold (${THRESHOLD}%) — stay in current pool`,
      },
      history: history.slice(-60), // Last 60 snapshots for chart
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Arbitrage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch arbitrage data", details: String(error) },
      { status: 500 }
    );
  }
}
