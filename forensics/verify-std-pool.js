const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPCS = ["https://rpc.flashbots.net", "https://ethereum.public.blockpi.network/v1/rpc/public"];
const PM = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const TARGET = "0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba";
const HOOK_POOL = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";
const SWAP_TOPIC = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const MOD_TOPIC = ethers.id("ModifyLiquidity(bytes32,address,int24,int24,int256,bytes32)");
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const OUT = path.join(__dirname, "results", "verify-std-pool-result.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

let rpcIdx = 0;
function provider() { return new ethers.JsonRpcProvider(RPCS[rpcIdx], 1, { staticNetwork: true }); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withTimeout(p, ms, label) {
  return Promise.race([p, new Promise((_, rj) => setTimeout(() => rj(new Error("timeout: " + label)), ms))]);
}

async function logsChunked(filter, from, to, size = 4000) {
  const out = []; let start = from, n = 0;
  while (start <= to) {
    const end = Math.min(start + size - 1, to);
    let ok = false;
    for (let attempt = 0; attempt < RPCS.length && !ok; attempt++) {
      try {
        const logs = await withTimeout(provider().getLogs({ ...filter, fromBlock: start, toBlock: end }), 25000, `logs ${start}-${end}`);
        out.push(...logs); ok = true;
      } catch (e) {
        console.error(`  [fail ${RPCS[rpcIdx]} ${start}-${end}] ${e.message.slice(0, 50)} → switch`);
        rpcIdx = (rpcIdx + 1) % RPCS.length;
        await sleep(500);
      }
    }
    if (!ok) { if (size <= 100) throw new Error("chunk impossible " + start); size = Math.floor(size / 2); console.error(`  [reduce→${size}]`); continue; }
    start = end + 1;
    if (++n % 10 === 0) console.error(`  ...${start}/${to}`);
    await sleep(200);
  }
  return out;
}

function dec(l) {
  const d = l.data.substring(2);
  let a0 = BigInt("0x" + d.substring(0, 64)), a1 = BigInt("0x" + d.substring(64, 128));
  if (a0 > (1n << 255n)) a0 -= (1n << 256n);
  if (a1 > (1n << 255n)) a1 -= (1n << 256n);
  return { block: l.blockNumber, tx: l.transactionHash, idx: l.logIndex,
    sender: ("0x" + l.topics[2].substring(26)).toLowerCase(), a0, a1, dir: a0 > 0n ? "sell" : "buy" };
}

async function tokenInfo(addr) {
  try {
    const c = new ethers.Contract(addr, ["function symbol() view returns (string)", "function decimals() view returns (uint8)"], provider());
    const [s, d] = await withTimeout(Promise.all([c.symbol(), c.decimals()]), 15000, "token " + addr);
    return { addr, symbol: s, decimals: Number(d) };
  } catch { return { addr, symbol: "?" }; }
}

function detectMev(swaps) {
  const attacks = [];
  const byBlock = {};
  for (const s of swaps) (byBlock[s.block] = byBlock[s.block] || []).push(s);
  for (const txs of Object.values(byBlock)) {
    if (txs.length < 3) continue;
    txs.sort((a, b) => a.idx - b.idx);
    for (let i = 0; i < txs.length - 2; i++) for (let j = i + 2; j < txs.length; j++) {
      if (txs[i].sender === txs[j].sender && txs[i].dir === "buy" && txs[j].dir === "sell") {
        const vic = txs.slice(i + 1, j).filter(t => t.sender !== txs[i].sender);
        if (vic.length) attacks.push({ type: "Sandwich", block: txs[i].block, bot: txs[i].sender,
          front_tx: txs[i].tx, victim: vic[0].sender, victim_tx: vic[0].tx, back_tx: txs[j].tx });
      }
    }
  }
  const bySender = {};
  for (const s of swaps) (bySender[s.sender] = bySender[s.sender] || []).push(s);
  for (const txs of Object.values(bySender)) {
    txs.sort((a, b) => a.block - b.block || a.idx - b.idx);
    for (let i = 0; i < txs.length - 1; i++) {
      if (txs[i].dir === "buy" && txs[i + 1].dir === "sell" && Math.abs(txs[i].block - txs[i + 1].block) <= 3) {
        if (attacks.some(a => a.front_tx === txs[i].tx)) continue;
        const vic = swaps.filter(s => s.sender !== txs[i].sender && s.block >= txs[i].block && s.block <= txs[i + 1].block);
        if (vic.length) attacks.push({ type: "Cross-block", block: txs[i].block, bot: txs[i].sender,
          front_tx: txs[i].tx, victim: vic[0].sender, victim_tx: vic[0].tx, back_tx: txs[i + 1].tx,
          span: txs[i + 1].block - txs[i].block });
      }
    }
  }
  return attacks;
}

(async () => {
  const latest = await withTimeout(provider().getBlockNumber(), 15000, "blockNumber");
  const R = { date: new Date().toISOString(), latest_block: latest, scan_range: `25800000 -> ${latest}` };

  // A. SWAPS TARGET (completo)
  console.error("[A] TARGET swaps full...");
  const tSw = (await logsChunked({ address: PM, topics: [SWAP_TOPIC, TARGET] }, 25800000, latest)).map(dec);
  let v0 = 0n, v1 = 0n;
  for (const s of tSw) { v0 += (s.a0 < 0n ? -s.a0 : s.a0); v1 += (s.a1 < 0n ? -s.a1 : s.a1); }
  R.target_swaps = {
    count: tSw.length, first_block: tSw[0]?.block, last_block: tSw[tSw.length - 1]?.block,
    distinct_senders: new Set(tSw.map(s => s.sender)).size,
    sum_abs_amount0: v0.toString(), sum_abs_amount1: v1.toString(),
    first_tx: tSw[0]?.tx, last_tx: tSw[tSw.length - 1]?.tx,
  };
  console.error("   count =", tSw.length);

  // B. SWAPS HOOK POOL (desde criacao documentada)
  console.error("[B] HOOK_POOL swaps desde 26029000...");
  const hSw = (await logsChunked({ address: PM, topics: [SWAP_TOPIC, HOOK_POOL] }, 26029000, latest)).map(dec);
  R.hook_pool_swaps = {
    count: hSw.length, first_block: hSw[0]?.block, last_block: hSw[hSw.length - 1]?.block,
    distinct_senders: new Set(hSw.map(s => s.sender)).size,
  };
  console.error("   count =", hSw.length);

  // C. LIQUIDITY TARGET
  console.error("[C] TARGET modifyliquidity...");
  const firstBlock = Math.min(tSw[0]?.block ?? 25800000, 25800000);
  const mods = await logsChunked({ address: PM, topics: [MOD_TOPIC, TARGET] }, firstBlock, latest);
  const prov = new Set(); let net = 0n; const liqByProvider = {};
  for (const l of mods) {
    const p = ("0x" + l.topics[2].substring(26)).toLowerCase();
    prov.add(p); liqByProvider[p] = (liqByProvider[p] || 0) + 1;
    let d = BigInt("0x" + l.data.substring(2).substring(128, 192));
    if (d > (1n << 255n)) d -= (1n << 256n);
    net += d;
  }
  R.target_liquidity = { events: mods.length, providers: prov.size, net_delta: net.toString(),
    top_providers: Object.entries(liqByProvider).sort((a, b) => b[1] - a[1]).slice(0, 5),
    last_tx: mods[mods.length - 1]?.transactionHash };
  console.error("   ", JSON.stringify(R.target_liquidity));

  // D. TOKENS via receipt
  console.error("[D] tokens...");
  const sampleTx = tSw.length ? tSw[tSw.length - 1].tx : (mods[mods.length - 1]?.transactionHash);
  if (sampleTx) {
    const rcpt = await withTimeout(provider().getTransactionReceipt(sampleTx), 20000, "receipt");
    const addrs = [...new Set(rcpt.logs.filter(l => l.topics[0] === TRANSFER_TOPIC).map(l => l.address))].slice(0, 8);
    R.tokens = { tx: sampleTx, block: rcpt.blockNumber, list: [] };
    for (const a of addrs) R.tokens.list.push(await tokenInfo(a));
    console.error("   ", JSON.stringify(R.tokens.list));
  }

  // E. CROSS-POOL
  const tSet = new Set(tSw.map(s => s.sender)), hSet = new Set(hSw.map(s => s.sender));
  const shared = [...tSet].filter(a => hSet.has(a));
  R.cross_pool = { target_senders: tSet.size, hook_senders: hSet.size, shared: shared.length, shared_addresses: shared.slice(0, 10) };

  // F. MEV no TARGET
  console.error("[F] MEV detection...");
  const attacks = detectMev(tSw);
  const byBot = {};
  for (const a of attacks) byBot[a.bot] = (byBot[a.bot] || 0) + 1;
  R.mev_on_target = {
    total: attacks.length,
    sandwiches: attacks.filter(a => a.type === "Sandwich").length,
    cross_block: attacks.filter(a => a.type === "Cross-block").length,
    unique_bots: Object.keys(byBot).length,
    top_bots: Object.entries(byBot).sort((a, b) => b[1] - a[1]).slice(0, 10),
    samples: attacks.slice(0, 15),
  };
  console.error("   total =", attacks.length);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.log("\n===== RESULTADO (tambem salvo em " + OUT + ") =====");
  console.log(JSON.stringify(R, null, 2));
})().catch(e => { console.error("Fatal:", e); process.exit(1); });
