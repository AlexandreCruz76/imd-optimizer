import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, pool, ethAmount, imdAmount, sharePercent } = body;

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const eth = parseFloat(ethAmount);
  if (!eth || eth <= 0) {
    return NextResponse.json({ error: "Invalid ETH amount" }, { status: 400 });
  }

  // Mock response — in production, this deposits into the V4 hook pool
  // (PoolManager.modifyLiquidity via the OptimizerHook).
  const mockTxHash =
    "0x" +
    Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  return NextResponse.json({
    success: true,
    txHash: mockTxHash,
    pool: pool || "hook",
    ethAmount: ethAmount,
    imdAmount: imdAmount || null,
    sharePercent: sharePercent || null,
    message: `Liquidity queued for ${ethAmount} ETH on ${pool || "hook"} pool`,
  });
}
