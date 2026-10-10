import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const ROUTER_ABI = [
  "function getStats() view returns (uint256,uint256,uint256,uint256,uint256)",
];
const HOOK_ABI = [
  "function totalIMDBurnedByOptimizer() view returns (uint256)",
  "function oracleQueries() view returns (uint256)",
  "function oracleBotHits() view returns (uint256)",
  "event ETHForwardedToVault(uint256 amount, uint256 timestamp)",
];
// Janela de logs do Meta Hook (deploy do hook no teste stress, ~bloco 11882280)
const SEPOLIA_FROM_HOOK = 11_882_000;

/**
 * GET /api/metrics — Live Metrics Bar (DEC-020 / front_final).
 * Lê direto da chain:
 * - mevForwardedEth/mevInterceptedEth: soma dos eventos ETHForwardedToVault
 *   do OptimizerHookV2 (ETH real confisco → Cofre). Fallback legado:
 *   OptimizerRouter.getStats()[1] (contador sem incremento no deploy atual).
 * - imdBurned/oracleQueries/oracleBotHits: contadores públicos do hook.
 * Sem contrato configurado → null (front exibe "—" — honestidade radical).
 */
export async function GET() {
  const rpcUrl =
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
  const routerAddress = process.env.OPTIMIZER_ROUTER_ADDRESS || "";
  const hookAddress = process.env.OPTIMIZER_HOOK_ADDRESS || "";

  let mevForwardedEth: string | null = null;
  let mevInterceptedEth: string | null = null;
  let imdBurned: string | null = null;
  let oracleQueries: string | null = null;
  let oracleBotHits: string | null = null;

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
      const [total, q, b] = (await Promise.all([
        hook.totalIMDBurnedByOptimizer(),
        hook.oracleQueries(),
        hook.oracleBotHits(),
      ])) as [bigint, bigint, bigint];
      imdBurned = ethers.formatEther(total);
      oracleQueries = q.toString();
      oracleBotHits = b.toString();
      const logs = await hook.queryFilter(
        "ETHForwardedToVault",
        SEPOLIA_FROM_HOOK
      );
      let sum = 0n;
      for (const l of logs) if ("args" in l && l.args) sum += l.args[0] as bigint;
      mevForwardedEth = ethers.formatEther(sum);
      mevInterceptedEth = mevForwardedEth;
    } catch {}
  }

  return NextResponse.json({
    mevInterceptedEth,
    mevForwardedEth,
    imdBurned,
    oracleQueries,
    oracleBotHits,
    hookAddress: hookAddress || null,
    deployed: Boolean(routerAddress && hookAddress),
  });
}
