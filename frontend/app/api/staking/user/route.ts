import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  return NextResponse.json({
    address,
    userTotalStaked: "0",
    userBuilderScore: "0",
    userPositions: [],
    pendingRewards: "0",
  });
}
