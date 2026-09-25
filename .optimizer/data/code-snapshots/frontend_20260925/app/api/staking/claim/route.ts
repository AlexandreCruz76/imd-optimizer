import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address } = body;

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  // TODO: Implement actual contract interaction
  const mockTxHash = "0x" + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

  return NextResponse.json({
    success: true,
    txHash: mockTxHash,
    message: `Claiming rewards for ${address}`,
  });
}
