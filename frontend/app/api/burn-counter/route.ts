import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const HOOK_ABI = [
  "function totalIMDBurnedByOptimizer() view returns (uint256)",
];

/**
 * GET /api/burn-counter
 * Contador público DEC-017: $IMD queimado automaticamente pelo Optimizer
 * (OptimizerHookV2.totalIMDBurnedByOptimizer). Sem hook configurado →
 * available: false (front exibe "—").
 */
export async function GET() {
  const hookAddress = process.env.OPTIMIZER_HOOK_ADDRESS || "";
  const rpcUrl =
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

  if (!hookAddress) {
    return NextResponse.json({ available: false, totalIMDBurnedByOptimizer: null });
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const hook = new ethers.Contract(hookAddress, HOOK_ABI, provider);
    const total: bigint = await hook.totalIMDBurnedByOptimizer();
    return NextResponse.json({
      available: true,
      hookAddress,
      totalIMDBurnedByOptimizer: ethers.formatEther(total),
      totalWei: total.toString(),
    });
  } catch {
    return NextResponse.json({
      available: false,
      hookAddress,
      totalIMDBurnedByOptimizer: null,
    });
  }
}
