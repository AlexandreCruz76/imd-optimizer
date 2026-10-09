import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { currentDeployment, ACTIVE_NETWORK } from "../../../lib/deployments";
import { queryFilterPaged } from "../../../lib/server/pagedLogs";
import { getReadProvider } from "../../../lib/server/provider";

export const dynamic = "force-dynamic";

const ROUTER_ABI = [
  "function getStats() view returns (uint256,uint256,uint256,uint256,uint256)",
  "function minBlockDelay() view returns (uint256)",
  "event MultiHopExecuted(address indexed user, address[] tokens, uint256 amountIn, uint256 finalOut, uint256 feeTotal, uint256 userOut, uint256 timestamp)",
];

const SWAP_IFACE = new ethers.Interface([
  "function executeMultiHop(address[] venues, address[] tokens, uint256 amountIn, uint256 minAmountOut) payable returns (uint256)",
  "function executeProtectedSellAndBurn(uint256 standardAmount, uint256 minAmountOut) payable returns (uint256)",
  "function executeCustomArbitrage(address token, address venueBuy, address venueSell, uint256 amountIn, uint256 minProfit) payable returns (uint256)",
]);

/** Argumento de slippage/proteção de cada função de swap do router. */
function minFromParsed(
  parsed: ethers.TransactionDescription
): bigint | null {
  if (parsed.name === "executeMultiHop")
    return parsed.args.minAmountOut as bigint;
  if (parsed.name === "executeProtectedSellAndBurn")
    return parsed.args.minAmountOut as bigint;
  if (parsed.name === "executeCustomArbitrage")
    return parsed.args.minProfit as bigint;
  return null;
}

const SEPOLIA_FROM_ROUTER = 11_700_000;
const SAMPLE = 10;

type Status = "pass" | "fail" | "warn" | "info";
interface MevTest {
  id: string;
  name: string;
  status: Status;
  detail: string;
}

interface SwapSample {
  tx: string;
  block: number;
  userOut: string;
  minAmountOut: string | null;
  decodedVia: "direct" | "trace" | null;
  txIndexInBlock: number | null;
  blockTxCount: number | null;
}

interface TraceCall {
  to?: string;
  input?: string;
  calls?: TraceCall[];
}

/** Acha a primeira call cujo input decodifica como função de swap do router. */
function findRouterCall(
  node: TraceCall,
  routerAddr: string
): TraceCall | null {
  if (
    node.to?.toLowerCase() === routerAddr.toLowerCase() &&
    node.input &&
    node.input.length > 10
  ) {
    try {
      const parsed = SWAP_IFACE.parseTransaction({ data: node.input });
      if (parsed && minFromParsed(parsed) !== null) return node;
    } catch {
      // não é função de swap — segue
    }
  }
  for (const c of node.calls ?? []) {
    const hit = findRouterCall(c, routerAddr);
    if (hit) return hit;
  }
  return null;
}

/**
 * Extrai minAmountOut de uma swap real.
 * - tx direto no router: decodifica o calldata.
 * - tx via deleGator 7702/DelegationManager (batch empacotado): usa
 *   debug_traceTransaction (callTracer) e decodifica a call interna.
 */
async function decodeMinOut(
  historical: ethers.JsonRpcProvider,
  routerAddr: string,
  txHash: string
): Promise<{ minOut: string | null; via: "direct" | "trace" | null }> {
  const tx = await historical.getTransaction(txHash);
  if (!tx?.data) return { minOut: null, via: null };

  if (tx.to && tx.to.toLowerCase() === routerAddr.toLowerCase()) {
    try {
      const parsed = SWAP_IFACE.parseTransaction({ data: tx.data });
      const v = parsed ? minFromParsed(parsed) : null;
      return v !== null
        ? { minOut: v.toString(), via: "direct" }
        : { minOut: null, via: null };
    } catch {
      return { minOut: null, via: null };
    }
  }

  try {
    const trace = (await historical.send("debug_traceTransaction", [
      txHash,
      { tracer: "callTracer" },
    ])) as TraceCall;
    const hit = findRouterCall(trace, routerAddr);
    if (!hit?.input) return { minOut: null, via: null };
    const parsed = SWAP_IFACE.parseTransaction({ data: hit.input });
    const v = parsed ? minFromParsed(parsed) : null;
    return v !== null
      ? { minOut: v.toString(), via: "trace" }
      : { minOut: null, via: null };
  } catch {
    return { minOut: null, via: null };
  }
}

let cache: { at: number; body: unknown } | null = null;
const TTL_MS = 60_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body);
  }

  const dep = currentDeployment();
  if (!dep) {
    const body = {
      network: ACTIVE_NETWORK,
      deployed: false,
      tests: [] as MevTest[],
      samples: [] as SwapSample[],
      summary: { pass: 0, fail: 0, warn: 0, info: 0 },
      note: "Sem contratos nesta rede — rastreio indisponível.",
    };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  }

  const provider = getReadProvider();
  // Fonte histórica única: ethpandaops (publicnode poda/rate-limita getLogs e
  // getTransaction antigos com erro 4444 "pruned history unavailable").
  const historical = provider;
  const router = new ethers.Contract(dep.optimizerRouter, ROUTER_ABI, provider);
  const tests: MevTest[] = [];
  const samples: SwapSample[] = [];

  // T1 — antifrontrun: minBlockDelay >= 1
  try {
    const d: bigint = await router.minBlockDelay();
    tests.push(
      d >= 1n
        ? {
            id: "mev-min-block-delay",
            name: "Proteção minBlockDelay ativa",
            status: "pass",
            detail: `Router exige ${d} bloco(s) de distância entre operações da mesma conta — reduz backrun no mesmo bloco.`,
          }
        : {
            id: "mev-min-block-delay",
            name: "Proteção minBlockDelay ativa",
            status: "fail",
            detail: "minBlockDelay = 0 — sem trava de sequência; ajustar no router antes da mainnet.",
          }
    );
  } catch {
    tests.push({
      id: "mev-min-block-delay",
      name: "Proteção minBlockDelay ativa",
      status: "fail",
      detail: "Leitura de minBlockDelay() falhou no router.",
    });
  }

  // T2 — MEV já interceptado registrado
  try {
    const stats: bigint[] = await router.getStats();
    const mev = stats[1];
    tests.push(
      mev > 0n
        ? {
            id: "mev-captured-recorded",
            name: "MEV interceptado registrado",
            status: "pass",
            detail: `totalMEVCaptured = ${ethers.formatEther(mev)} ETH.`,
          }
        : {
            id: "mev-captured-recorded",
            name: "MEV interceptado registrado",
            status: "warn",
            detail:
              "totalMEVCaptured = 0 — nenhum swap de venda interceptado ainda (normal em testnet ociosa).",
          }
    );
  } catch {
    tests.push({
      id: "mev-captured-recorded",
      name: "MEV interceptado registrado",
      status: "fail",
      detail: "getStats() falhou no router.",
    });
  }

  // T3/T4/T7 — amostra de swaps reais: slippage bound + honored + posição
  let decodedCount = 0;
  try {
    const latest = await provider.getBlockNumber();
    const events = await queryFilterPaged(
      router,
      "MultiHopExecuted",
      SEPOLIA_FROM_ROUTER,
      latest
    );
    const last = events.slice(-SAMPLE);
    let minOutOk = true;
    let honored = true;
    const perBlock = new Map<number, number>();

    for (const ev of last) {
      perBlock.set(ev.blockNumber, (perBlock.get(ev.blockNumber) ?? 0) + 1);
      const { minOut, via } = await decodeMinOut(
        historical,
        dep.optimizerRouter,
        ev.transactionHash
      );
      if (minOut !== null) decodedCount++;
      const args = (ev as ethers.EventLog).args as readonly bigint[];
      const userOut = args[3];
      if (minOut !== null) {
        if (BigInt(minOut) === 0n) minOutOk = false;
        else if (userOut < BigInt(minOut)) honored = false;
      }
      let txIndex: number | null = null;
      let blockTxCount: number | null = null;
      try {
        const blk = await historical.getBlock(ev.blockNumber, true);
        if (blk) {
          const txs = blk.transactions as ReadonlyArray<
            string | { hash: string }
          >;
          blockTxCount = txs.length;
          txIndex = txs.findIndex(
            (t) => (typeof t === "string" ? t : t.hash) === ev.transactionHash
          );
        }
      } catch {
        // info
      }
      samples.push({
        tx: ev.transactionHash,
        block: ev.blockNumber,
        userOut: userOut.toString(),
        minAmountOut: minOut,
        decodedVia: via,
        txIndexInBlock: txIndex,
        blockTxCount,
      });
    }

    if (last.length === 0) {
      tests.push({
        id: "mev-slippage-bound",
        name: "Slippage bound (minAmountOut > 0) nas swaps",
        status: "warn",
        detail:
          "Nenhuma MultiHopExecuted encontrada desde o deploy — sem swaps para auditar (testnet ociosa).",
      });
      tests.push({
        id: "mev-minout-honored",
        name: "minAmountOut honrado on-chain",
        status: "warn",
        detail: "Sem amostra — teste inconclusivo.",
      });
    } else if (decodedCount === 0) {
      tests.push({
        id: "mev-slippage-bound",
        name: "Slippage bound (minAmountOut > 0) nas swaps",
        status: "warn",
        detail:
          "Nenhum calldata decodificado na amostra (via direct/trace) — teste inconclusivo.",
      });
      tests.push({
        id: "mev-minout-honored",
        name: "minAmountOut honrado on-chain",
        status: "warn",
        detail: "Sem decode — teste inconclusivo.",
      });
    } else {
      tests.push(
        minOutOk
          ? {
              id: "mev-slippage-bound",
              name: "Slippage bound (minAmountOut > 0) nas swaps",
              status: "pass",
              detail: `${decodedCount}/${samples.length} swaps decodificadas com minAmountOut > 0 — executor não aceita preço pior que o limite.`,
            }
          : {
              id: "mev-slippage-bound",
              name: "Slippage bound (minAmountOut > 0) nas swaps",
              status: "fail",
              detail:
                "Há swap com minAmountOut = 0 — vetor de sandwich. Corrigir front/UX.",
            }
      );
      tests.push(
        honored
          ? {
              id: "mev-minout-honored",
              name: "minAmountOut honrado on-chain",
              status: "pass",
              detail: "userOut >= minAmountOut em todas as swaps decodificadas da amostra.",
            }
          : {
              id: "mev-minout-honored",
              name: "minAmountOut honrado on-chain",
              status: "fail",
              detail: "userOut < minAmountOut em alguma swap da amostra.",
            }
      );
    }

    const sameBlock = [...perBlock.values()].filter((c) => c > 1).length;
    tests.push(
      last.length === 0 || sameBlock === 0
        ? {
            id: "mev-same-block-window",
            name: "Sem janela de sandwich (swaps no mesmo bloco)",
            status: last.length === 0 ? "warn" : "pass",
            detail:
              last.length === 0
                ? "Sem swaps na amostra — inconclusivo."
                : "Nenhum bloco da amostra concentrou mais de uma swap do router.",
          }
        : {
            id: "mev-same-block-window",
            name: "Janela de sandwich (swaps no mesmo bloco)",
            status: "warn",
            detail: `${sameBlock} bloco(s) da amostra tiveram >1 swap — janela clássica de backrun; monitorar.`,
          }
    );

    tests.push({
      id: "mev-sample-size",
      name: "Amostra de rastreio",
      status: "info",
      detail: `${last.length} swap(s) rastreadas (${decodedCount} decodificadas) a partir do bloco ${SEPOLIA_FROM_ROUTER}.`,
    });
  } catch (err) {
    tests.push({
      id: "mev-swap-trace",
      name: "Rastreio de swaps recentes",
      status: "fail",
      detail: `queryFilter/getTransaction falhou — ${String(
        (err as Error)?.message ?? err
      ).slice(0, 140)}`,
    });
  }

  // T5 — liquidez do router para honrar saídas
  try {
    const bal = await provider.getBalance(dep.optimizerRouter);
    tests.push(
      bal > 0n
        ? {
            id: "mev-router-liquidity",
            name: "Router com liquidez (ETH)",
            status: "pass",
            detail: `Saldo ${ethers.formatEther(bal)} ETH — swaps de venda têm contraparte.`,
          }
        : {
            id: "mev-router-liquidity",
            name: "Router com liquidez (ETH)",
            status: "warn",
            detail: "Router sem saldo ETH — vendas revertam até recapitalizar.",
          }
    );
  } catch {
    tests.push({
      id: "mev-router-liquidity",
      name: "Router com liquidez (ETH)",
      status: "fail",
      detail: "getBalance(router) falhou.",
    });
  }

  // T6 — venue permissionless (mock): limitação conhecida, documentada
  tests.push({
    id: "mev-venue-permissionless",
    name: "Venues mock: hopSwap permissionless",
    status: "warn",
    detail:
      "MockUniswapV4Pool.hopSwap não restringe msg.sender (por design do mock) — na mainnet as venues devem exigir onlyRouter para bloquear rota direta que escapa das taxas/proteções.",
  });

  const summary = {
    pass: tests.filter((t) => t.status === "pass").length,
    fail: tests.filter((t) => t.status === "fail").length,
    warn: tests.filter((t) => t.status === "warn").length,
    info: tests.filter((t) => t.status === "info").length,
  };

  const body = {
    network: ACTIVE_NETWORK,
    deployed: true,
    router: dep.optimizerRouter,
    tests,
    samples,
    summary,
    fetchedAt: new Date().toISOString(),
  };
  cache = { at: Date.now(), body };
  return NextResponse.json(body);
}
