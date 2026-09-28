const { ethers } = require("ethers");
const BPI = "https://ethereum.public.blockpi.network/v1/rpc/public";
const FB = "https://rpc.flashbots.net";
const PM = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const TARGET = "0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba";
const HOOK_POOL = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";
const NATIVE_POOL = "0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704";
const SWAP_TOPIC = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const IMD = "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7";
const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const USDT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const p1 = new ethers.JsonRpcProvider(BPI, 1, { staticNetwork: true });
const p2 = new ethers.JsonRpcProvider(FB, 1, { staticNetwork: true });
const tmo = (p, ms) => Promise.race([p, new Promise((_, rj) => setTimeout(() => rj(new Error("timeout")), ms))]);

const tok = async (addr, p) => {
  try {
    const c = new ethers.Contract(addr, ["function symbol() view returns (string)", "function decimals() view returns (uint8)"], p);
    const [s, d] = await tmo(Promise.all([c.symbol(), c.decimals()]), 12000);
    return `${s}(${Number(d)}d)`;
  } catch { return "?"; }
};

(async () => {
  const R = {};

  // 1. CONTAGEM CRUZADA: mesmo range nos 2 RPCs
  const f = 25940000, t = 25944000;
  for (const [name, p] of [["blockpi", p1], ["flashbots", p2]]) {
    try {
      const logs = await tmo(p.getLogs({ address: PM, topics: [SWAP_TOPIC, TARGET], fromBlock: f, toBlock: t }), 30000);
      R["count_" + name + `_range_${f}_${t}`] = logs.length;
    } catch (e) { R["count_" + name] = "ERR " + e.message.slice(0, 60); }
  }

  // 2. START REAL: varredura de 25930000 ate 25940000 nos 2 RPCs
  const f2 = 25930000, t2 = 25940000;
  for (const [name, p] of [["blockpi", p1], ["flashbots", p2]]) {
    try {
      const logs = await tmo(p.getLogs({ address: PM, topics: [SWAP_TOPIC, TARGET], fromBlock: f2, toBlock: t2 }), 30000);
      R["start_" + name] = { count: logs.length, first: logs[0]?.blockNumber, first_tx: logs[0]?.transactionHash };
    } catch (e) { R["start_" + name] = "ERR " + e.message.slice(0, 60); }
  }

  // 3. IDENTIDADE DO PAR: 3 receipts do TARGET (inicio, meio, fim)
  const midTx = "0x" + ""; // preenchido abaixo
  const sample = [];
  for (const [from, to] of [[25936004, 25936100], [25999000, 25999100], [26062200, 26062251]]) {
    try {
      const logs = await tmo(p1.getLogs({ address: PM, topics: [SWAP_TOPIC, TARGET], fromBlock: from, toBlock: to }), 30000);
      if (logs.length) sample.push(logs[0].transactionHash);
    } catch {}
  }
  R.pair_identity = [];
  for (const tx of sample) {
    try {
      const rc = await tmo(p1.getTransactionReceipt(tx), 20000);
      const taddrs = [...new Set(rc.logs.filter(l => l.topics[0] === TRANSFER_TOPIC).map(l => l.address))];
      const detail = [];
      for (const a of taddrs.slice(0, 6)) detail.push(`${await tok(a, p1)} @ ${a}`);
      // valor nativo na tx (ETH)
      const txo = await tmo(p1.getTransaction(tx), 15000);
      R.pair_identity.push({ tx, block: rc.blockNumber, native_value_eth: Number(ethers.formatEther(txo.value || 0n)), transfers: detail });
    } catch (e) { R.pair_identity.push({ tx, err: e.message.slice(0, 60) }); }
  }

  // 4. HOOK POOL par (valida metodo): 1 receipt
  try {
    const logs = await tmo(p1.getLogs({ address: PM, topics: [SWAP_TOPIC, HOOK_POOL], fromBlock: 26062000, toBlock: 26062251 }), 30000);
    if (logs.length) {
      const rc = await tmo(p1.getTransactionReceipt(logs[0].transactionHash), 20000);
      const taddrs = [...new Set(rc.logs.filter(l => l.topics[0] === TRANSFER_TOPIC).map(l => l.address))];
      const detail = [];
      for (const a of taddrs.slice(0, 6)) detail.push(`${await tok(a, p1)} @ ${a}`);
      R.hook_pool_identity = { tx: logs[0].transactionHash, transfers: detail };
    }
  } catch (e) { R.hook_pool_identity = "ERR " + e.message.slice(0, 60); }

  // 5. NATIVE POOL (claim: IMD/ETH sem hook) contagem
  try {
    const logs = await tmo(p1.getLogs({ address: PM, topics: [SWAP_TOPIC, NATIVE_POOL], fromBlock: 25800000, toBlock: 26062251 }), 60000);
    R.native_pool = { count: logs.length, first: logs[0]?.blockNumber };
  } catch (e) {
    try {
      const logs = await tmo(p2.getLogs({ address: PM, topics: [SWAP_TOPIC, NATIVE_POOL], fromBlock: 25800000, toBlock: 26062251 }), 60000);
      R.native_pool = { count: logs.length, first: logs[0]?.blockNumber };
    } catch (e2) { R.native_pool = "ERR " + e2.message.slice(0, 60); }
  }

  // 6. EXISTE pool IMD/USDC ATIVA? Varre txs com USDC→PM nas e transfere poolIds
  try {
    const SETTLE_USDC = TRANSFER_TOPIC;
    const logs = await tmo(p1.getLogs({ address: USDC, topics: [SETTLE_USDC, null, "0x" + PM.slice(2).padStart(64, "0")] , fromBlock: 26050000, toBlock: 26062251 }), 45000);
    const txs = [...new Set(logs.map(l => l.transactionHash))].slice(0, 40);
    const poolsSeen = {};
    for (const tx of txs) {
      try {
        const rc = await tmo(p1.getTransactionReceipt(tx), 15000);
        for (const lg of rc.logs) {
          if (lg.address.toLowerCase() === PM.toLowerCase() && lg.topics[0] === SWAP_TOPIC) {
            const pid = lg.topics[1];
            poolsSeen[pid] = poolsSeen[pid] || { tx, swaps: 0 };
            poolsSeen[pid].swaps++;
          }
        }
      } catch {}
    }
    R.usdc_active_pools = [];
    for (const [pid, info] of Object.entries(poolsSeen).slice(0, 12)) {
      const rc = await tmo(p1.getTransactionReceipt(info.tx), 15000);
      const taddrs = [...new Set(rc.logs.filter(l => l.topics[0] === TRANSFER_TOPIC).map(l => l.address))].slice(0, 5);
      const detail = [];
      for (const a of taddrs) detail.push(await tok(a, p1));
      R.usdc_active_pools.push({ pool_id: pid, tokens: detail });
    }
    R.usdc_pool_question = R.usdc_active_pools.some(p => p.tokens.some(s => s.startsWith("IMD")))
      ? "EXISTE pool USDC ativa com IMD"
      : "NENHUMA pool USDC recente envolve IMD (nas " + txs.length + " txs USDC verificadas)";
  } catch (e) { R.usdc_active_pools = "ERR " + e.message.slice(0, 80); }

  console.log(JSON.stringify(R, null, 2));
})().catch(e => console.error("Fatal:", e));
