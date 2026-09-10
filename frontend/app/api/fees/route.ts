import { NextResponse } from "next/server";

// In production, this would query the blockchain
// For now, return mock data

export async function GET() {
  const data = {
    protocolFees: {
      totalCollected: 2.45,
      pendingWithdraw: 0.87,
      totalWithdrawn: 1.58,
    },
    vaultStats: {
      totalAUM: 156.3,
      subscriberCount: 23,
      avgFee: 14.2,
    },
    tiers: {
      FREE: { count: 8, fee: 20 },
      BASIC: { count: 10, fee: 15 },
      PRO: { count: 4, fee: 10 },
      WHALE: { count: 1, fee: 5 },
    },
    recentFees: [
      { user: "0x1234...5678", amount: 0.125, tier: "PRO", timestamp: new Date(Date.now() - 7200000).toISOString() },
      { user: "0x8765...4321", amount: 0.089, tier: "BASIC", timestamp: new Date(Date.now() - 14400000).toISOString() },
      { user: "0xabcd...ef01", amount: 0.234, tier: "WHALE", timestamp: new Date(Date.now() - 21600000).toISOString() },
    ],
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(data);
}
