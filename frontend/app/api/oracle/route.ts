import { NextResponse } from "next/server";

const RPC = "https://ethereum-rpc.publicnode.com";
const PM = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const SWAP_TOPIC = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const IMD_POOL = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";
const STD_POOL = "0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba";

let cachedData: any = null;
let lastUpdate = 0;
const CACHE_TTL = 60000;

async function fetchOracleData() {
  const now = Date.now();
  if (cachedData && now - lastUpdate < CACHE_TTL) return cachedData;

  const { ethers } = await import("ethers");
  const provider = new ethers.JsonRpcProvider(RPC, 1);
  const latest = await provider.getBlockNumber();

  const logs = await provider.getLogs({
    address: PM,
    topics: [SWAP_TOPIC],
    fromBlock: latest - 500,
    toBlock: latest,
  });

  const swaps: any[] = [];
  for (const log of logs) {
    const sender = ("0x" + log.topics[2].substring(26)).toLowerCase();
    const poolId = log.topics[1];
    const dataNoPrefix = log.data.substring(2);
    const amount0Raw = BigInt("0x" + dataNoPrefix.substring(0, 64));
    const amount1Raw = BigInt("0x" + dataNoPrefix.substring(64, 128));
    const amount0 = amount0Raw > (1n << 255n) ? amount0Raw - (1n << 256n) : amount0Raw;
    const amount1 = amount1Raw > (1n << 255n) ? amount1Raw - (1n << 256n) : amount1Raw;
    const dir: "buy" | "sell" = amount0 > 0n ? "sell" : "buy";

    swaps.push({ block: log.blockNumber, sender, poolId, amount0, amount1, dir, idx: log.logIndex });
  }

  const imdSwaps = swaps.filter((s) => s.poolId === IMD_POOL);
  const stdSwaps = swaps.filter((s) => s.poolId === STD_POOL);
  const allBuys = swaps.filter((s) => s.dir === "buy").length;
  const allSells = swaps.filter((s) => s.dir === "sell").length;

  const imdTraders: Record<string, number> = {};
  for (const s of imdSwaps) imdTraders[s.sender] = (imdTraders[s.sender] || 0) + 1;
  const stdTraders: Record<string, number> = {};
  for (const s of stdSwaps) stdTraders[s.sender] = (stdTraders[s.sender] || 0) + 1;

  const imdAddrs = new Set(imdSwaps.map((s) => s.sender));
  const stdAddrs = new Set(stdSwaps.map((s) => s.sender));
  const shared = [...imdAddrs].filter((a) => stdAddrs.has(a));

  // ─── MEV DETECTION ON ALL POOLS ───
  const attacks: any[] = [];
  const botStats: Record<string, any> = {};

  function isSandwichPair(buySwap: any, sellSwap: any): boolean {
    const buyAmt = Math.abs(Number(buySwap.amount1)) / 1e18;
    const sellAmt = Math.abs(Number(sellSwap.amount1)) / 1e18;
    if (buyAmt < 0.001 || sellAmt < 0.001) return false;
    const ratio = Math.min(buyAmt, sellAmt) / Math.max(buyAmt, sellAmt);
    return ratio > 0.5;
  }

  function estimateProfit(buySwap: any, sellSwap: any): number {
    const buyAmt = Math.abs(Number(buySwap.amount1)) / 1e18;
    const sellAmt = Math.abs(Number(sellSwap.amount1)) / 1e18;
    const volume = Math.min(buyAmt, sellAmt);
    const raw = volume * 0.001;
    return Math.min(raw, 10);
  }

  // Same-block sandwich: group by block+pool
  const byBlockPool: Record<string, any[]> = {};
  for (const s of swaps) {
    const key = s.block + "|" + s.poolId;
    if (!byBlockPool[key]) byBlockPool[key] = [];
    byBlockPool[key].push(s);
  }

  for (const [, txs] of Object.entries(byBlockPool)) {
    if (txs.length < 3) continue;
    txs.sort((a: any, b: any) => a.idx - b.idx);

    for (let i = 0; i < txs.length - 2; i++) {
      for (let j = i + 2; j < txs.length; j++) {
        if (txs[i].sender === txs[j].sender && txs[i].dir === "buy" && txs[j].dir === "sell" &&
            isSandwichPair(txs[i], txs[j])) {
          const victims = txs.filter((t: any, idx: number) => idx > i && idx < j && t.sender !== txs[i].sender);
          if (victims.length > 0) {
            const profitEth = estimateProfit(txs[i], txs[j]);
            const victimLoss = profitEth / victims.length;

            attacks.push({
              block: txs[i].block, type: "Sandwich", bot: txs[i].sender,
              victim: victims[0].sender, pool: txs[i].poolId,
              profit_eth: profitEth, victim_loss_eth: victimLoss,
            });
            if (!botStats[txs[i].sender]) botStats[txs[i].sender] = { count: 0, profit: 0, types: new Set(), pools: new Set() };
            botStats[txs[i].sender].count++;
            botStats[txs[i].sender].profit += profitEth;
            botStats[txs[i].sender].types.add("Sandwich");
            botStats[txs[i].sender].pools.add(txs[i].poolId);
          }
        }
      }
    }
  }

  // Cross-block sandwich: same sender+pool, BUY→SELL within 3 blocks
  const bySenderPool: Record<string, any[]> = {};
  for (const s of swaps) {
    const key = s.sender + "|" + s.poolId;
    if (!bySenderPool[key]) bySenderPool[key] = [];
    bySenderPool[key].push(s);
  }

  for (const [, txs] of Object.entries(bySenderPool)) {
    if (txs.length < 2) continue;
    txs.sort((a: any, b: any) => a.block - b.block || a.idx - b.idx);
    for (let i = 0; i < txs.length - 1; i++) {
      if (txs[i].dir === "buy" && txs[i + 1].dir === "sell" &&
          txs[i].poolId === txs[i + 1].poolId &&
          Math.abs(txs[i].block - txs[i + 1].block) <= 3 &&
          isSandwichPair(txs[i], txs[i + 1])) {
        // Must have OTHER traders between the two
        const victims = swaps.filter((s: any) =>
          s.sender !== txs[i].sender && s.poolId === txs[i].poolId &&
          s.block >= txs[i].block && s.block <= txs[i + 1].block &&
          s.sender !== txs[i + 1].sender
        );
        if (victims.length > 0) {
          const exists = attacks.some((a: any) => a.bot === txs[i].sender && a.block === txs[i].block && a.type === "Sandwich");
          if (!exists) {
            const profitEth = estimateProfit(txs[i], txs[i + 1]);
            if (profitEth > 0.0001) {
              attacks.push({
                block: txs[i].block, type: "Cross-block Sandwich", bot: txs[i].sender,
                pool: txs[i].poolId, profit_eth: profitEth, victim_loss_eth: profitEth * 0.7,
                blocks_span: txs[i + 1].block - txs[i].block,
              });
              if (!botStats[txs[i].sender]) botStats[txs[i].sender] = { count: 0, profit: 0, types: new Set(), pools: new Set() };
              botStats[txs[i].sender].count++;
              botStats[txs[i].sender].profit += profitEth;
              botStats[txs[i].sender].types.add("Cross-block Sandwich");
              botStats[txs[i].sender].pools.add(txs[i].poolId);
            }
          }
        }
      }
    }
  }

  const totalMEVExtracted = attacks.reduce((s: number, a: any) => s + a.profit_eth, 0);
  const totalVictimLoss = attacks.reduce((s: number, a: any) => s + a.victim_loss_eth, 0);
  const shieldableValue = totalMEVExtracted;
  const blocksPerYear = (365 * 24 * 60 * 60) / 12;
  const estimatedAnnualLoss = shieldableValue * (blocksPerYear / 500);
  const lpFeeLoss = totalVictimLoss * 0.01;

  const leaderboard = Object.entries(botStats)
    .map(([addr, s]: [string, any]) => ({
      address: addr, type: [...s.types].join(" | "), attacks: s.count,
      estimated_profit_eth: s.profit.toFixed(6), pools_active: s.pools.size,
    }))
    .sort((a: any, b: any) => parseFloat(b.estimated_profit_eth) - parseFloat(a.estimated_profit_eth));

  cachedData = {
    status: "live", chain: 1, last_block: latest,
    timestamp: new Date().toISOString(), scan_blocks: 500,
    direction_debug: { total_buys: allBuys, total_sells: allSells },
    imd: {
      swaps: imdSwaps.length, traders: Object.keys(imdTraders).length,
      top5: Object.entries(imdTraders).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([addr, swaps]) => ({ addr, swaps })),
    },
    standard: {
      swaps: stdSwaps.length, traders: Object.keys(stdTraders).length,
      top5: Object.entries(stdTraders).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([addr, swaps]) => ({ addr, swaps })),
    },
    cross_pool: { shared_bots: shared.length, addresses: shared },
    mev: {
      attacks_detected: attacks.length,
      sandwich_attacks: attacks.filter((a: any) => a.type === "Sandwich").length,
      cross_block_sandwiches: attacks.filter((a: any) => a.type === "Cross-block Sandwich").length,
      bots_detected: Object.keys(botStats).length,
      leaderboard: leaderboard.slice(0, 10),
      attack_samples: attacks.slice(0, 10),
    },
    losses: {
      total_mev_extracted_eth: totalMEVExtracted.toFixed(6),
      total_victim_loss_eth: totalVictimLoss.toFixed(6),
      lp_fee_loss_eth: lpFeeLoss.toFixed(6),
      shieldable_value_eth: shieldableValue.toFixed(6),
      estimated_annual_loss_eth: estimatedAnnualLoss.toFixed(2),
      estimated_annual_loss_usd: (estimatedAnnualLoss * 2500).toFixed(0),
    },
    recommendation: {
      action: attacks.length > 0 ? "ACTIVATE_HOOK" : "PREVENTIVE_DEPLOY",
      priority: attacks.length > 10 ? "CRITICAL" : attacks.length > 0 ? "HIGH" : "MEDIUM",
      reason: attacks.length > 0
        ? `${attacks.length} sandwich attacks detected across ${new Set(attacks.map((a: any) => a.pool)).size} pools`
        : "No active attacks, but market makers create MEV opportunity",
      shieldable_value_eth: shieldableValue.toFixed(6),
      hook_address: "0xc6c965bd164c483e87d0b550671798e9a3602840",
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
