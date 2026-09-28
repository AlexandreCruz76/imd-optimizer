const { ethers } = require("ethers");
const RPC = "https://ethereum.public.blockpi.network/v1/rpc/public";
const PM = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const TARGET = "0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba";
const HOOK = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";
const NATIVE = "0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704";
const SWAP = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";

const p = new ethers.JsonRpcProvider(RPC, 1, { staticNetwork: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmo = (pr, ms) => Promise.race([pr, new Promise((_, rj) => setTimeout(() => rj(new Error("timeout")), ms))]);

async function scan(pid, from, to) {
  const out = []; let start = from;
  while (start <= to) {
    const end = Math.min(start + 3999, to);
    for (let a = 0; a < 6; a++) {
      try { out.push(...await tmo(p.getLogs({ address: PM, topics: [SWAP, pid], fromBlock: start, toBlock: end }), 30000)); break; }
      catch (e) { if (a === 5) throw e; await sleep(1500 * (a + 1)); }
    }
    start = end + 1; await sleep(320);
  }
  return out.map(l => {
    const d = l.data.substring(2);
    let a0 = BigInt("0x" + d.substring(0, 64));
    if (a0 > (1n << 255n)) a0 -= (1n << 256n);
    return { block: l.blockNumber, tx: l.transactionHash, idx: l.logIndex,
      sender: ("0x" + l.topics[2].substring(26)).toLowerCase(), a0, dir: a0 > 0n ? "sell" : "buy" };
  });
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
          front_tx: txs[i].tx, victim_tx: vic[0].tx, back_tx: txs[j].tx });
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
          front_tx: txs[i].tx, victim_tx: vic[0].tx, back_tx: txs[i + 1].tx });
      }
    }
  }
  return atk;
}

(async () => {
  const latest = await tmo(p.getBlockNumber(), 15000);
  const R = { date: new Date().toISOString(), latest };

  console.error("[scan target]");
  const tgt = await scan(TARGET, 25800000, latest);
  console.error("[scan hook]");
  const hook = await scan(HOOK, 26029000, latest);
  console.error("[scan native]");
  const nat = await scan(NATIVE, 25887000, latest);

  const summ = (name, s, from) => {
    const atk = detect(s);
    const bots = {};
    for (const a of atk) bots[a.bot] = (bots[a.bot] || 0) + 1;
    return {
      pool: name, window: `${from}→${latest}`,
      swaps: s.length, first: s[0]?.block, senders: new Set(s.map(x => x.sender)).size,
      attacks_total: atk.length,
      sandwiches: atk.filter(a => a.type === "Sandwich").length,
      cross_block: atk.filter(a => a.type === "Cross-block").length,
      unique_bots: Object.keys(bots).length,
      top3_bots: Object.entries(bots).sort((a, b) => b[1] - a[1]).slice(0, 3),
      sample_sandwich: atk.find(a => a.type === "Sandwich") || null,
    };
  };

  const st = summ("ETH/USDT standard", tgt, 25800000);
  const sh = summ("IMD/ETH hook", hook, 26029000);
  const sn = summ("IMD/ETH native", nat, 25887000);

  const sT = new Set(tgt.map(x => x.sender)), sH = new Set(hook.map(x => x.sender)), sN = new Set(nat.map(x => x.sender));
  R.shared = {
    hook_x_native: [...sH].filter(a => sN.has(a)).length,
    hook_x_target: [...sH].filter(a => sT.has(a)).length,
    native_x_target: [...sN].filter(a => sT.has(a)).length,
    all_three: [...sH].filter(a => sN.has(a) && sT.has(a)).length,
  };
  R.pools = [st, sh, sn];
  console.log(JSON.stringify(R, null, 2));
})().catch(e => console.error("Fatal:", e));
