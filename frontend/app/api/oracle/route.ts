import { NextResponse } from "next/server";

const RPC = "https://ethereum-rpc.publicnode.com";
const PM = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const SWAP_TOPIC = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const IMD_POOL = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";
const STD_POOL = "0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba";
const KNOWN = new Set(["0x0000000aa232009084bd71a5797d089aa4edfad4"]);

// Cache
let cachedData: any = null;
let lastUpdate = 0;
const CACHE_TTL = 60000;

async function fetchOracleData() {
  const now = Date.now();
  if (cachedData && now - lastUpdate < CACHE_TTL) return cachedData;

  // Use public provider
  const provider = new (await import("ethers")).JsonRpcProvider(RPC, 1);
  const latest = await provider.getBlockNumber();

  const logs = await provider.getLogs({
    address: PM,
    topics: [SWAP_TOPIC],
    fromBlock: latest - 500,
    toBlock: latest,
  });

  const swaps = [];
  for (const log of logs) {
    const sender = ("0x" + log.topics[2].substring(26)).toLowerCase();
    if (KNOWN.has(sender)) continue;
    const a0 = BigInt("0x" + log.data.substring(2, 66));
    const a1 = BigInt("0x" + log.data.substring(66, 130));
    swaps.push({
      block: log.blockNumber,
      sender,
      poolId: log.topics[1],
      a0,
      a1,
      dir: a0 < 0n ? "sell" : "buy",
    });
  }

  const imdSwaps = swaps.filter((s: any) => s.poolId === IMD_POOL);
  const stdSwaps = swaps.filter((s: any) => s.poolId === STD_POOL);

  const imdTraders: Record<string, number> = {};
  for (const s of imdSwaps) {
    imdTraders[s.sender] = (imdTraders[s.sender] || 0) + 1;
  }

  const stdTraders: Record<string, number> = {};
  for (const s of stdSwaps) {
    stdTraders[s.sender] = (stdTraders[s.sender] || 0) + 1;
  }

  const imdAddrs = new Set(imdSwaps.map((s: any) => s.sender));
  const stdAddrs = new Set(stdSwaps.map((s: any) => s.sender));
  const shared = [...imdAddrs].filter((a) => stdAddrs.has(a));

  cachedData = {
    status: "live",
    chain: 1,
    last_block: latest,
    timestamp: new Date().toISOString(),
    imd: {
      swaps: imdSwaps.length,
      traders: Object.keys(imdTraders).length,
      top5: Object.entries(imdTraders)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([addr, swaps]) => ({ addr, swaps })),
    },
    standard: {
      swaps: stdSwaps.length,
      traders: Object.keys(stdTraders).length,
      top5: Object.entries(stdTraders)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([addr, swaps]) => ({ addr, swaps })),
    },
    cross_pool: {
      shared_bots: shared.length,
      addresses: shared,
    },
  };
  lastUpdate = now;
  return cachedData;
}

export async function GET() {
  try {
    const data = await fetchOracleData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
