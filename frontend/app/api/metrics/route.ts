import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const ROUTER_ABI = [
  "function getStats() view returns (uint256,uint256,uint256,uint256,uint256)",
];
const HOOK_ABI = [
  "function totalIMDBurnedByOptimizer() view returns (uint256)",
];

/**
 * GET /api/metrics — Live Metrics Bar (DEC-020 / front_final).
 * Lê direto da chain: MEV Interceptado (OptimizerRouter.getStats) e
 * $IMD Auto-Burnado (OptimizerHookV2.totalIMDBurnedByOptimizer).
 * Sem contrato configurado → null (front exibe "—" — honestidade radical).
 */
export async function GET() {
  const rpcUrl =
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
  const routerAddress = process.env.OPTIMIZER_ROUTER_ADDRESS || "";
  const hookAddress = process.env.OPTIMIZER_HOOK_ADDRESS || "";

  let mevInterceptedEth: string | null = null;
  let imdBurned: string | null = null;

  if (routerAddress) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
      const stats = await router.getStats();
      mevInterceptedEth = ethers.formatEther(stats[1] as bigint);
    } catch {}
  }

  if (hookAddress) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const hook = new ethers.Contract(hookAddress, HOOK_ABI, provider);
      const total: bigint = await hook.totalIMDBurnedByOptimizer();
      imdBurned = ethers.formatEther(total);
    } catch {}
  }

  return NextResponse.json({
    mevInterceptedEth,
    imdBurned,
    deployed: Boolean(routerAddress && hookAddress),
  });
}
