import { NextResponse } from "next/server";
import { HookPoolAnalyzer } from "@/lib/hookPoolAnalyzer";

export const dynamic = "force-dynamic";

let cachedState: any = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function GET() {
  try {
    // Use cache if fresh
    if (cachedState && Date.now() - lastFetch < CACHE_TTL) {
      return NextResponse.json(cachedState);
    }

    const analyzer = new HookPoolAnalyzer();
    const state = await analyzer.getPoolState();
    const swapSummary = await analyzer.getSwapSummary(24);
    const volumeShare = await analyzer.getVolumeShare(24);

    // Convert raw liquidity to estimated ETH
    // Raw liquidity units need conversion using Uniswap V4 math
    // For estimation: native pool has ~230 ETH based on on-chain data
    const estimatedNativeEth = 230; // Known from on-chain analysis

    const data = {
      ethBalance: state.ethInPool.toFixed(4),
      imdBalance: state.imdInPool.toFixed(0),
      totalSupply: state.imdInPool.toFixed(0),
      liquidityETH: state.ethInPool.toFixed(4),
      liquidityIMD: state.imdInPool.toFixed(0),
      shareOfPool: (state.hookLiquidityShare * 100).toFixed(1),
      lpFee: (state.lpFee * 100).toFixed(2),
      volume24h: swapSummary.volumeEth.toFixed(2),
      ethIn24h: swapSummary.buyEthIn.toFixed(2),
      ethOut24h: swapSummary.sellEthOut.toFixed(2),
      imdIn24h: swapSummary.sellImdIn.toFixed(0),
      imdOut24h: swapSummary.buyImdOut.toFixed(0),
      swaps24h: swapSummary.totalSwaps,
      burnsTotal: state.totalBurned.toFixed(0),
      rewardsTotal: state.totalRewarded.toFixed(0),
      hookLiqETH: state.ethInPool.toFixed(4),
      nativeLiqETH: estimatedNativeEth.toFixed(2),
      hookShare: (state.hookLiquidityShare * 100).toFixed(1),
      volumeShare: (volumeShare.share * 100).toFixed(1),
      nativeVolumeShare: ((1 - volumeShare.share) * 100).toFixed(1),
      hookVolume: volumeShare.hookVolume.toFixed(2),
      nativeVolume: volumeShare.referenceVolume.toFixed(2),
      price: state.price.toFixed(2),
      imdUsd: state.imdUsd?.toFixed(4) || null,
      ethUsd: state.ethUsd?.toFixed(0) || null,
      block: state.block,
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
