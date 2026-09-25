import { NextResponse } from "next/server";
import { HookPoolAnalyzer } from "@/lib/hookPoolAnalyzer";
import { CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  try {
    const analyzer = new HookPoolAnalyzer();
    const state = await analyzer.getPoolState();

    // Query user's liquidity position from the hook contract
    // The hook contract stores LP positions in a mapping
    const userLiq = await queryUserLiquidity(address);

    const hookLiqEth = state.ethInPool;
    const price = state.price;
    const shareOfPool = hookLiqEth > 0 ? (userLiq.eth / hookLiqEth) * 100 : 0;

    // Estimate P&L
    const entryPrice = userLiq.entryPrice || price;
    const currentPrice = price;
    const pnl = userLiq.eth > 0
      ? userLiq.eth * ((currentPrice - entryPrice) / entryPrice)
      : 0;
    const pnlPercent = entryPrice > 0
      ? ((currentPrice - entryPrice) / entryPrice) * 100
      : 0;

    return NextResponse.json({
      ethBalance: userLiq.eth.toFixed(6),
      imdBalance: userLiq.imd.toFixed(0),
      totalLiquidityEth: hookLiqEth.toFixed(4),
      shareOfPool: shareOfPool.toFixed(4),
      feeEarned: userLiq.feeEarned.toFixed(6),
      entryPrice: entryPrice.toFixed(2),
      currentPrice: currentPrice.toFixed(2),
      pnl: pnl.toFixed(6),
      pnlPercent: pnlPercent.toFixed(2),
    });
  } catch (error) {
    console.error("Failed to fetch user LP:", error);
    return NextResponse.json(
      { error: "Failed to fetch LP position", details: String(error) },
      { status: 500 }
    );
  }
}

async function queryUserLiquidity(address: string) {
  try {
    // Use Alchemy's trace_call or debug API to get user's position
    // For now, query the contract's events and state
    const rpcUrl = process.env.MAINNET_RPC_URL || "https://ethereum-rpc.publicnode.com";

    // Try to get user's liquidity from the hook contract
    // The hook contract stores positions in the ERC-4626 vault or directly
    const hookAddress = CONFIG.contracts.hook;

    // Query Deposited events for this user
    const depositTopic = "0xe8ed0a697f15301f06fd3d30bc896682e7826c5397076a3eda05844cfc356480";
    const userTopic = "0x00000000000000000000" + address.slice(2).toLowerCase();

    const depositLogs = await fetchLogs(rpcUrl, hookAddress, depositTopic, userTopic);

    let totalDeposited = 0;
    let totalShares = 0;

    for (const log of depositLogs) {
      const amount = parseInt(log.data.slice(0, 66), 16) / 1e18;
      const shares = parseInt("0x" + log.data.slice(66, 130), 16) / 1e18;
      totalDeposited += amount;
      totalShares += shares;
    }

    // Calculate current value based on shares
    const analyzer = new HookPoolAnalyzer();
    const state = await analyzer.getPoolState();
    const totalPoolLiq = state.ethInPool;

    // Estimate user's current ETH value
    const userEthValue = totalShares > 0
      ? (totalShares / (totalShares + totalPoolLiq * 1e18)) * totalPoolLiq
      : 0;

    // Estimate IMD value
    const price = state.price;
    const userImdValue = userEthValue * price;

    return {
      eth: totalDeposited > 0 ? userEthValue : 0,
      imd: totalDeposited > 0 ? userImdValue : 0,
      entryPrice: totalDeposited > 0 ? price : 0,
      feeEarned: 0, // Would need to query Claimed events
    };
  } catch (error) {
    console.error("Query user liquidity failed:", error);
    return { eth: 0, imd: 0, entryPrice: 0, feeEarned: 0 };
  }
}

async function fetchLogs(
  rpcUrl: string,
  address: string,
  topic0: string,
  topic1?: string
): Promise<any[]> {
  const topics = [topic0];
  if (topic1) topics.push(topic1);

  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x" + (25920000).toString(16), // Approximate hook deployment block
        toBlock: "latest",
        address: address,
        topics: topics,
      },
    ],
  };

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data.result || [];
}
