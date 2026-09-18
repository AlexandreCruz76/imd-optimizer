import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tier, address } = body;

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  if (tier !== "GENESIS" && tier !== "BACKER") {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // TODO: Implement actual contract interaction
  // For now, return mock tx hash
  const mockTxHash = "0x" + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

  return NextResponse.json({
    success: true,
    txHash: mockTxHash,
    tier,
    price: tier === "GENESIS" ? "0.5 ETH" : "1 ETH",
    message: `Minting ${tier} key for ${address}`,
  });
}
