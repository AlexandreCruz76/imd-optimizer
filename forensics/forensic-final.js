const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC = "https://ethereum.public.blockpi.network/v1/rpc/public";
const PM = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const TARGET = "0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba";
const HOOK_POOL = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";
const NATIVE_POOL = "0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704";
const SWAP_TOPIC = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const MOD_TOPIC = ethers.id("ModifyLiquidity(bytes32,address,int24,int24,int256,bytes32)");
const INIT_TOPIC = ethers.id("Initialize(bytes32,uint24,uint24)");
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const IMD = "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7";
const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const OUT = path.join(__dirname, "results", "forensic-final-result.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const p = new ethers.JsonRpcProvider(RPC, 1, { staticNetwork: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmo = (pr, ms) => Promise.race([pr, new Promise((_, rj) => setTimeout(() => rj(new Error("timeout")), ms))]);

async function getLogs(filter, from, to, size = 4000) {
  const out = []; let start = from, delay = 300;
  while (start <= to) {
    const end = Math.min(start + size - 1, to);
    for (let att = 0; att < 8; att++) {
      try {
        out.push(...await tmo(p.getLogs({ ...filter, fromBlock: start, toBlock: end }), 30000));
        break;
      } catch (e) {
        const m = e.message || "";
        if (att === 7) throw e;
        delay = Math.min(delay * 2, 8000);
        console.error(`  [retry ${att + 1}] ${start}-${end}: ${m.slice(0, 50)} → sleep ${delay}`);
        await sleep(delay);
      }
    }
    start = end + 1;
    await sleep(350);
    if (Math.floor((start - from) / 4000) % 15 === 0) console.error(`  ...${start}/${to}`);
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

function detect(swaps) {
  const atk = [];
  const byBlock = {};
  for (const s of swaps) (byBlock[s.block] = byBlock[s.block] || []).push(s);
  for (const txs of Object.values(byBlock)) {
    if (txs.length < 3) continue;
    txs.sort((a, b) => a.idx - b.idx);
    for (let i = 0; i < txs.length - 2; i++) for (let j = i + 2; j < txs.length; j++) {
      if (txs[i].sender === txs[j].sender && txs[i].dir === "buy" && txs[j].dir === "sell") {
        const vic = txs.slice(i + 1, j).filter(t => t.sender !== txs[i].sender);
        if (vic.length) atk.push({ type: "Sandwich", block: txs[i].block, bot: txs[i].sender,
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
        if (atk.some(a => a.front_tx === txs[i].tx)) continue;
        const vic = swaps.filter(s => s.sender !== txs[i].sender && s.block >= txs[i].block && s.block <= txs[i + 1].block);
        if (vic.length) atk.push({ type: "Cross-block", block: txs[i].block, bot: txs[i].sender,
          front_tx: txs[i].tx, victim: vic[0].sender, victim_tx: vic[0].tx, back_tx: txs[i + 1].tx, span: txs[i + 1].block - txs[i].block });
      }
    }
  }
  return atk;
}

(async () => {
  const latest = await tmo(p.getBlockNumber(), 15000);
  const R = { date: new Date().toISOString(), rpc: RPC, latest_block: latest, scan_range: "25800000→" + latest };

  console.error("[1] TARGET swaps FULL");
  const tSw = (await getLogs({ address: PM, topics: [SWAP_TOPIC, TARGET] }, 25800000, latest)).map(dec);
  let v0 = 0n, v1 = 0n;
  for (const s of tSw) { v0 += (s.a0 < 0n ? -s.a0 : s.a0); v1 += (s.a1 < 0n ? -s.a1 : s.a1); }
  R.target = {
    swaps: tSw.length, first_block: tSw[0]?.block, last_block: tSw[tSw.length - 1]?.block,
    senders: new Set(tSw.map(s => s.sender)).size,
    sum_abs_amount0_18dec: v0.toString(), sum_abs_amount1_6dec: v1.toString(),
    implied_price: Number(v1 / 1000000n) / (Number(v0) / 1e18),
    first_tx: tSw[0]?.tx, last_tx: tSw[tSw.length - 1]?.tx,
  };
  console.error("   ", JSON.stringify(R.target));

  console.error("[2] HOOK swaps desde 26029000");
  const hSw = (await getLogs({ address: PM, topics: [SWAP_TOPIC, HOOK_POOL] }, 26029000, latest)).map(dec);
  R.hook = { swaps: hSw.length, first_block: hSw[0]?.block, senders: new Set(hSw.map(s => s.sender)).size };

  console.error("[3] NATIVE POOL swaps");
  try {
    const nSw = (await getLogs({ address: PM, topics: [SWAP_TOPIC, NATIVE_POOL] }, 25800000, latest)).map(dec);
    R.native_pool = { swaps: nSw.length, first_block: nSw[0]?.block, senders: new Set(nSw.map(s => s.sender)).size };
  } catch (e) { R.native_pool = "ERR " + e.message.slice(0, 70); }

  console.error("[4] TARGET liquidity");
  const mods = await getLogs({ address: PM, topics: [MOD_TOPIC, TARGET] }, 25800000, latest);
  const prov = new Set(); let net = 0n;
  for (const l of mods) {
    prov.add(("0x" + l.topics[2].substring(26)).toLowerCase());
    let d = BigInt("0x" + l.data.substring(2).substring(128, 192));
    if (d > (1n << 255n)) d -= (1n << 256n);
    net += d;
  }
  R.target_liquidity = { events: mods.length, providers: prov.size, net_delta: net.toString() };

  console.error("[5] Initialize TARGET (criacao)");
  try {
    const inits = await tmo(p.getLogs({ address: PM, topics: [INIT_TOPIC, TARGET] }, 24000000, latest), 40000);
    R.initialize = inits.map(l => ({ block: l.blockNumber, tx: l.transactionHash }));
  } catch (e) {
    try {
      const inits = await tmo(p.getLogs({ address: PM, topics: [INIT_TOPIC, TARGET] }, 25700000, latest), 40000);
      R.initialize = inits.map(l => ({ block: l.blockNumber, tx: l.transactionHash }));
    } catch (e2) { R.initialize = "ERR " + e2.message.slice(0, 70); }
  }

  console.error("[6] MEV detection");
  const atk = detect(tSw);
  const byBot = {};
  for (const a of atk) byBot[a.bot] = (byBot[a.bot] || 0) + 1;
  R.mev = {
    total: atk.length,
    sandwiches: atk.filter(a => a.type === "Sandwich").length,
    cross_block: atk.filter(a => a.type === "Cross-block").length,
    unique_bots: Object.keys(byBot).length,
    top_bots: Object.entries(byBot).sort((a, b) => b[1] - a[1]).slice(0, 10),
    verified_samples: atk.filter(a => a.type === "Sandwich").slice(0, 10),
  };

  console.error("[7] USDC pools discovery (3000 blocos)");
  await sleep(2000);
  try {
    const pmTopic = "0x" + PM.slice(2).padStart(64, "0");
    const usdcLogs = await tmo(p.getLogs({ address: USDC, topics: [TRANSFER_TOPIC, null, pmTopic] }, latest - 3000, latest), 40000);
    const txs = [...new Set(usdcLogs.map(l => l.transactionHash))].slice(0, 30);
    const pools = {};
    for (const tx of txs) {
      await sleep(350);
      try {
        const rc = await tmo(p.getTransactionReceipt(tx), 20000);
        for (const lg of rc.logs) {
          if (lg.address.toLowerCase() === PM.toLowerCase() && lg.topics[0] === SWAP_TOPIC) {
            pools[lg.topics[1]] = pools[lg.topics[1]] || { tx, n: 0 };
            pools[lg.topics[1]].n++;
          }
        }
      } catch {}
    }
    R.usdc_pools_recent = [];
    for (const [pid, info] of Object.entries(pools)) {
      await sleep(350);
      try {
        const rc = await tmo(p.getTransactionReceipt(info.tx), 20000);
        const addrs = [...new Set(rc.logs.filter(l => l.topics[0] === TRANSFER_TOPIC).map(l => l.address))].slice(0, 6);
        const syms = [];
        for (const a of addrs) {
          try { const c = new ethers.Contract(a, ["function symbol() view returns (string)"], p); syms.push(await tmo(c.symbol(), 10000)); }
          catch { syms.push("?"); }
        }
        R.usdc_pools_recent.push({ pool: pid, swaps_in_sample_tx: info.n, tokens_in_tx: syms, involves_imd: syms.some(s => s.toUpperCase().includes("IMD")) });
      } catch {}
    }
    R.imd_usdc_exists_recent = R.usdc_pools_recent.some(x => x.involves_imd);
  } catch (e) { R.usdc_pools_recent = "ERR " + e.message.slice(0, 70); }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.log("\n===== FINAL =====");
  console.log(JSON.stringify(R, null, 2));
})().catch(e => { console.error("Fatal:", e); process.exit(1); });
