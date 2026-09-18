import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    mintOpen: true,
    totalMinted: 0,
    maxSupply: 100,
    genesisPrice: "0.5",
    backerPrice: "1.0",
    targetRaise: "50-100 ETH",
  });
}
