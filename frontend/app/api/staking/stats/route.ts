import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    totalDeposited: "0",
    totalBuilderScore: "0",
    totalPositions: 0,
    pendingRewards: "0",
    performanceFeeBps: 1500,
    stakerShareBps: 6000,
    lockTiers: {
      30: { multiplier: "1.00x", apy: "37%" },
      90: { multiplier: "1.35x", apy: "50%" },
      180: { multiplier: "1.85x", apy: "68.5%" },
    },
  });
}
