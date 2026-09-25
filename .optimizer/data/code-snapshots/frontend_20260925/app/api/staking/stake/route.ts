import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { amount, lockTier, address } = body;

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (![30, 90, 180].includes(lockTier)) {
    return NextResponse.json({ error: "Invalid lock tier" }, { status: 400 });
  }

  // TODO: Implement actual contract interaction
  const mockTxHash = "0x" + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

  return NextResponse.json({
    success: true,
    txHash: mockTxHash,
    amount,
    lockTier,
    message: `Staking ${amount} $BUILD for ${lockTier} days`,
  });
}
