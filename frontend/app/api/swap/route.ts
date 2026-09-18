import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { standardAmount, minAmountOut, address } = body;

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  if (!standardAmount || parseFloat(standardAmount) <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Resposta simulada — em produção, interagir com o contrato OptimizerRouter
  const mockTxHash = "0x" + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

  return NextResponse.json({
    success: true,
    txHash: mockTxHash,
    standardAmount,
    ethReceived: (parseFloat(standardAmount) * 0.99).toFixed(4),
    mevCaptured: (parseFloat(standardAmount) * 0.02).toFixed(4),
    burnAmount: (parseFloat(standardAmount) * 0.02).toFixed(4),
    yieldDistributed: (parseFloat(standardAmount) * 0.001).toFixed(4),
    message: `Venda protegida e queima executada para ${standardAmount} $STANDARD`,
  });
}
