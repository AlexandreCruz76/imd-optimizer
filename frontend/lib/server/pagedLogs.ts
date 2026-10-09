import { ethers } from "ethers";

/**
 * queryFilter paginado — RPCs públicos limitam eth_getLogs
 * (publicnode: 50k blocos, ethpandaops: 30k). Chunk 20k cabe nos dois.
 */
export const LOGS_CHUNK = 20_000;

export async function queryFilterPaged(
  contract: ethers.Contract,
  filter: ethers.ContractEventName,
  fromBlock: number,
  toBlock: number,
  chunk: number = LOGS_CHUNK
): Promise<(ethers.Log | ethers.EventLog)[]> {
  const out: (ethers.Log | ethers.EventLog)[] = [];
  for (let start = fromBlock; start <= toBlock; start += chunk) {
    const end = Math.min(start + chunk - 1, toBlock);
    out.push(...(await contract.queryFilter(filter, start, end)));
  }
  return out;
}
