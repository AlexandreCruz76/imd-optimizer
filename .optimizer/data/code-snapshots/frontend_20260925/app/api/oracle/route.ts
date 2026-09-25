import { NextResponse } from "next/server";

const RPC = "https://ethereum-rpc.publicnode.com";
const PM = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const SWAP_TOPIC = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";

const POOLS = [
  { id: "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3", name: "IMD/ETH", decimals: 18, nativeSymbol: "ETH", priceUSD: 2500, startBlock: 26029794, label: "CappedBurnHook" },
  { id: "0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba", name: "IMD/USDC", decimals: 6, nativeSymbol: "USDC", priceUSD: 1, startBlock: 26029696, label: "Standard (no hook)" },
];

let cachedData: any = null;
let lastUpdate = 0;
const CACHE_TTL = 120000;

function parseSwap(log: any) {
  const sender = ("0x" + log.topics[2].substring(26)).toLowerCase();
  const poolId = log.topics[1];
  const data = log.data.substring(2);
  const a0 = BigInt("0x" + data.substring(0, 64));
  const a1 = BigInt("0x" + data.substring(64, 128));
  const amount0 = a0 > (1n << 255n) ? a0 - (1n << 256n) : a0;
  const amount1 = a1 > (1n << 255n) ? a1 - (1n << 256n) : a1;
  return { block: log.blockNumber, sender, poolId, amount0, amount1, dir: amount0 > 0n ? "sell" : "buy", idx: log.logIndex, txHash: log.transactionHash };
}

function detectAttacks(swaps: any[], decimals: number, nativeSymbol: string, priceUSD: number) {
  const attacks: any[] = [];
  const divisor = BigInt(10 ** decimals);

  function isPair(buy: any, sell: any): boolean {
    const b = Number(buy.amount1 < 0n ? -buy.amount1 : buy.amount1) / Number(divisor);
    const s = Number(sell.amount1 < 0n ? -sell.amount1 : sell.amount1) / Number(divisor);
    if (b < 0.001 || s < 0.001) return false;
    return Math.min(b, s) / Math.max(b, s) > 0.3;
  }

  function profit(buy: any, sell: any): number {
    const b = Math.abs(Number(buy.amount1)) / Number(divisor);
    const s = Math.abs(Number(sell.amount1)) / Number(divisor);
    return Math.min(b, s) * 0.001;
  }

  // Same-block sandwich
  const byBlock: Record<string, any[]> = {};
  for (const s of swaps) {
    const key = s.block + "|" + s.poolId;
    if (!byBlock[key]) byBlock[key] = [];
    byBlock[key].push(s);
  }

  for (const [, txs] of Object.entries(byBlock)) {
    if (txs.length < 3) continue;
    txs.sort((a: any, b: any) => a.idx - b.idx);
    for (let i = 0; i < txs.length - 2; i++) {
      for (let j = i + 2; j < txs.length; j++) {
        if (txs[i].sender === txs[j].sender && txs[i].dir === "buy" && txs[j].dir === "sell" && isPair(txs[i], txs[j])) {
          const victims = txs.filter((t: any, idx: number) => idx > i && idx < j && t.sender !== txs[i].sender);
          if (victims.length > 0) {
            const p = profit(txs[i], txs[j]);
            attacks.push({
              block: txs[i].block, type: "Sandwich", bot: txs[i].sender,
              victim: victims[0].sender, profit_native: p, profit_usd: p * priceUSD,
              entryTX: txs[i].txHash, victimTX: victims[0].txHash, exitTX: txs[j].txHash,
            });
          }
        }
      }
    }
  }

  // Cross-block sandwich
  const bySender: Record<string, any[]> = {};
  for (const s of swaps) {
    if (!bySender[s.sender]) bySender[s.sender] = [];
    bySender[s.sender].push(s);
  }

  for (const [, txs] of Object.entries(bySender)) {
    if (txs.length < 2) continue;
    txs.sort((a: any, b: any) => a.block - b.block || a.idx - b.idx);
    for (let i = 0; i < txs.length - 1; i++) {
      if (txs[i].dir === "buy" && txs[i + 1].dir === "sell" &&
          Math.abs(txs[i].block - txs[i + 1].block) <= 3 && isPair(txs[i], txs[i + 1])) {
        const exists = attacks.some((a: any) => a.bot === txs[i].sender && a.block === txs[i].block);
        if (!exists) {
          const p = profit(txs[i], txs[i + 1]);
          if (p > 0.0001) {
            attacks.push({
              block: txs[i].block, type: "Cross-block", bot: txs[i].sender,
              profit_native: p, profit_usd: p * priceUSD,
              entryTX: txs[i].txHash, exitTX: txs[i + 1].txHash,
              blocks_span: txs[i + 1].block - txs[i].block,
            });
          }
        }
      }
    }
  }

  return attacks;
}

async function fetchOracleData() {
  const now = Date.now();
  if (cachedData && now - lastUpdate < CACHE_TTL) return cachedData;

  const { ethers } = await import("ethers");
  const provider = new ethers.JsonRpcProvider(RPC, 1);
  const latest = await provider.getBlockNumber();
  const chunk = 200;

  const poolResults: any[] = [];

  for (const pool of POOLS) {
    const allLogs: any[] = [];
    const fromBlock = pool.startBlock;

    // Scan in chunks from pool creation to now
    for (let from = fromBlock; from <= latest; from += chunk) {
      const to = Math.min(from + chunk - 1, latest);
      try {
        const logs = await provider.getLogs({
          address: PM, topics: [SWAP_TOPIC, pool.id],
          fromBlock: from, toBlock: to,
        });
        allLogs.push(...logs);
      } catch {}
      await new Promise((r) => setTimeout(r, 120));
    }

    const swaps = allLogs.map(parseSwap);
    const attacks = detectAttacks(swaps, pool.decimals, pool.nativeSymbol, pool.priceUSD);

    const traders: Record<string, number> = {};
    for (const s of swaps) traders[s.sender] = (traders[s.sender] || 0) + 1;

    const buys = swaps.filter((s) => s.dir === "buy").length;
    const sells = swaps.filter((s) => s.dir === "sell").length;
    const totalProfitNative = attacks.reduce((s: number, a: any) => s + a.profit_native, 0);
    const totalProfitUSD = attacks.reduce((s: number, a: any) => s + a.profit_usd, 0);
    const totalRecoverableNative = totalProfitNative * 0.85;
    const totalRecoverableUSD = totalProfitUSD * 0.85;
    const botStats: Record<string, any> = {};
    for (const a of attacks) {
      if (!botStats[a.bot]) botStats[a.bot] = { count: 0, profit_native: 0, profit_usd: 0, types: new Set() };
      botStats[a.bot].count++;
      botStats[a.bot].profit_native += a.profit_native;
      botStats[a.bot].profit_usd += a.profit_usd;
      botStats[a.bot].types.add(a.type);
    }

    const leaderboard = Object.entries(botStats)
      .map(([addr, s]: [string, any]) => ({
        address: addr, type: [...s.types].join(" | "), attacks: s.count,
        profit_native: s.profit_native.toFixed(6), profit_usd: s.profit_usd.toFixed(2),
      }))
      .sort((a: any, b: any) => parseFloat(b.profit_usd) - parseFloat(a.profit_usd));

    poolResults.push({
      pool: { id: pool.id, name: pool.name, label: pool.label, startBlock: pool.startBlock, nativeSymbol: pool.nativeSymbol },
      swaps: { total: swaps.length, buys, sells, traders: Object.keys(traders).length },
      mev: {
        attacks_detected: attacks.length,
        sandwich: attacks.filter((a) => a.type === "Sandwich").length,
        cross_block: attacks.filter((a) => a.type === "Cross-block").length,
        bots: Object.keys(botStats).length,
        leaderboard,
        attack_samples: attacks,
      },
      losses: {
        total_mev_native: totalProfitNative.toFixed(6),
        total_mev_usd: totalProfitUSD.toFixed(2),
        total_recoverable_native: totalRecoverableNative.toFixed(6),
        total_recoverable_usd: totalRecoverableUSD.toFixed(2),
        estimated_annual_usd: (totalProfitUSD * (365 * 24 * 60 * 60 / 12) / (latest - pool.startBlock)).toFixed(0),
      },
    });
  }

  // Summary across both pools
  const totalAttacks = poolResults.reduce((s: number, p: any) => s + p.mev.attacks_detected, 0);
  const totalMEV_USD = poolResults.reduce((s: number, p: any) => s + parseFloat(p.losses.total_mev_usd), 0);
  const totalRecoverable_USD = poolResults.reduce((s: number, p: any) => s + parseFloat(p.losses.total_recoverable_usd), 0);
  const totalSwaps = poolResults.reduce((s: number, p: any) => s + p.swaps.total, 0);

  cachedData = {
    status: "live", chain: 1, last_block: latest,
    timestamp: new Date().toISOString(),
    scan_from: "pool_creation",
    scan_blocks: latest - 26029696,
    summary: {
      total_swaps: totalSwaps,
      total_attacks: totalAttacks,
      total_bots: poolResults.reduce((s: number, p: any) => s + p.mev.bots, 0),
      total_mev_usd: totalMEV_USD.toFixed(2),
      total_recoverable_usd: totalRecoverable_USD.toFixed(2),
    },
    pools: poolResults,
    report_generated: new Date().toISOString(),
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
