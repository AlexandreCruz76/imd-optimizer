const { ethers } = require("ethers");
const PM = "0x000000000004444c5dc75cB358380D2e3dE08A90";
const RPC = "https://ethereum.public.blockpi.network/v1/rpc/public";

function perms(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of perms(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

// ── 1. SWAP: achar assinatura que produz o topic conhecido ──
const KNOWN_SWAP = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const six = ["int256", "int256", "uint128", "uint160", "int24", "uint24"];
const seen = new Set(); let swapSig = null;
outer:
for (const p of perms(six)) {
  const sig = p.join(",");
  if (seen.has(sig)) continue; seen.add(sig);
  const t = ethers.id("Swap(bytes32,address," + sig + ")");
  if (t === KNOWN_SWAP) { swapSig = sig; break outer; }
}
console.log("SWAP signature:", swapSig || "NOT FOUND in permutations");

// ── 2. INITIALIZE / MODIFYLIQUIDITY: candidatos para testar online ──
const initCandidates = [
  "Initialize(bytes32,uint24,uint24)",
  "Initialize(bytes32,address,uint24,uint24,int24,uint160)",
  "Initialize(bytes32,address,uint24,uint24,int24)",
  "Initialize(bytes32,address,uint24,uint24)",
  "Initialize(bytes32,int24,uint24,uint24,uint160)",
];
const modCandidates = [
  "ModifyLiquidity(bytes32,address,int24,int24,int256)",
  "ModifyLiquidity(bytes32,address,int24,int24,int256,bytes32)",
  "ModifyLiquidity(bytes32,address,int24,int24,int256,int256)",
];

(async () => {
  const p = new ethers.JsonRpcProvider(RPC, 1, { staticNetwork: true });
  const latest = await p.getBlockNumber();

  for (const sig of initCandidates) {
    try {
      const logs = await p.getLogs({ address: PM, topics: [ethers.id(sig)], fromBlock: latest - 30000, toBlock: latest });
      console.log(`INIT test "${sig}" → ${logs.length} events/30k blk ${logs.length ? "✅" : ""}`);
    } catch (e) { console.log(`INIT test "${sig}" → ERR ${e.shortMessage || e.message}`); }
  }
  for (const sig of modCandidates) {
    try {
      const logs = await p.getLogs({ address: PM, topics: [ethers.id(sig)], fromBlock: latest - 3000, toBlock: latest });
      console.log(`MOD test "${sig}" → ${logs.length} events/3k blk ${logs.length ? "✅" : ""}`);
    } catch (e) { console.log(`MOD test "${sig}" → ERR ${e.shortMessage || e.message}`); }
  }

  // ── 3. Validar derivação de PoolId usando pool Hook conhecido ──
  const HOOK_POOL = "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3";
  const CAPPED = "0xc6c965bd164c483e87d0b550671798e9a3602840";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const IMD = "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const TARGET = "0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba";
  const mk = (c0, c1, f, t, h) => ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint24", "int24", "address"], [c0, c1, f, t, h]));
  const pairs = [{ n: "USDC/WETH", c0: USDC, c1: WETH }, { n: "USDC/IMD", c0: USDC, c1: IMD }, { n: "WETH/IMD", c0: WETH, c1: IMD }];
  const found = [];
  for (const pr of pairs) for (const f of [100, 500, 3000, 10000]) for (const t of [1, 10, 60, 200]) for (const h of [ethers.ZeroAddress, CAPPED]) {
    const id = mk(pr.c0, pr.c1, f, t, h);
    if (id === HOOK_POOL) found.push({ match: "HOOK CONHECIDO ✓", pair: pr.n, fee: f, tick: t, hooks: h });
    if (id === TARGET) found.push({ match: "TARGET 0x2287a962", pair: pr.n, fee: f, tick: t, hooks: h });
  }
  console.log("POOLID derivation matches:", JSON.stringify(found, null, 1));
})().catch(e => console.error(e));
