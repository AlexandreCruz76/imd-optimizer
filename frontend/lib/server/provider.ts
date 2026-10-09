import { ethers } from "ethers";

/**
 * Provider de leitura das APIs de agregação (dashboard / mev-trace).
 * ethpandaops (reth) é confiável para getLogs paginados + debug_traceTransaction.
 * O publicnode do Sepolia responde "pruned history unavailable" (4444)
 * de forma intermitente em getLogs longos — não usar como fonte primária aqui.
 * Override: READ_RPC_URL.
 */
export function getReadProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(
    process.env.READ_RPC_URL || "https://rpc.sepolia.ethpandaops.io"
  );
}
