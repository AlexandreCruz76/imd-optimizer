/**
 * The Graph Client
 * Queries Uniswap V4 subgraph for pool data.
 */

import https from "https";

const V4_SUBGRAPH_ID = "DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G";
const POOL_MANAGER = "0x000000000004444c5dc75cB358380D2e3dE08A90";

function graphQuery(apiKey: string, query: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const endpoint = `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${V4_SUBGRAPH_ID}`;
    const body = JSON.stringify({ query });
    const u = new URL(endpoint);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            const j = JSON.parse(d);
            if (j.errors) reject(new Error(JSON.stringify(j.errors)));
            else resolve(j.data);
          } catch (e) {
            reject(new Error("Graph parse error: " + d.substring(0, 200)));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export interface GraphPoolData {
  id: string;
  pair: string;
  feeTier: number;
  hooks: string | null;
  liquidity: string;
  tvlUSD: number;
  volume24hUSD: number;
  fees24hUSD: number;
  txs24h: number;
  apy: number;
}

export async function fetchPoolFromGraph(
  apiKey: string,
  poolId: string
): Promise<GraphPoolData | null> {
  if (!apiKey) return null;

  const q = `{
    pool(id: "${poolId}") {
      id
      token0 { symbol }
      token1 { symbol }
      feeTier
      hooks
      liquidity
      poolDayData(first: 1, orderBy: date, orderDirection: desc) {
        volumeUSD
        feesUSD
        txCount
        tvlUSD
      }
    }
  }`;

  try {
    const data = await graphQuery(apiKey, q);
    if (!data?.pool) return null;

    const p = data.pool;
    const day = p.poolDayData?.[0];
    const tvl = parseFloat(day?.tvlUSD || "0");
    const fees24h = parseFloat(day?.feesUSD || "0");
    const apy = tvl > 0 ? (fees24h * 365 / tvl) * 100 : 0;

    return {
      id: p.id,
      pair: `${p.token0?.symbol}/${p.token1?.symbol}`,
      feeTier: p.feeTier,
      hooks: p.hooks,
      liquidity: p.liquidity,
      tvlUSD: tvl,
      volume24hUSD: parseFloat(day?.volumeUSD || "0"),
      fees24hUSD: fees24h,
      txs24h: parseInt(day?.txCount || "0"),
      apy,
    };
  } catch (e) {
    console.error("Graph query failed for pool", poolId, e);
    return null;
  }
}

export async function fetchBothPoolsFromGraph(apiKey: string) {
  const hookPoolId = "0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704";
  const nativePoolId = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";

  const [hook, native] = await Promise.all([
    fetchPoolFromGraph(apiKey, hookPoolId),
    fetchPoolFromGraph(apiKey, nativePoolId),
  ]);

  return { hook, native };
}
