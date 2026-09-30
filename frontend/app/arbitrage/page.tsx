"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../components/WalletProvider";

// Regra 2 (DEC-020): arbitragem atômica intra-par
const ROUTER_ABI = [
  "function identityTier(address) view returns (uint8)",
  "function successFeeBps(address) view returns (uint256)",
  "function minBlockDelay() view returns (uint256)",
  "function lastOperationBlock(address) view returns (uint256)",
  "function executeCustomArbitrage(address,address,address,uint256,uint256) payable returns (uint256,uint256,uint256)",
];

const TIER_LABELS = ["Alpha (Genesis Key)", "Partner (Identity md)", "Holder ($IMD/$BLD)", "Retail"];
const TIER_SUCCESS_FEE = ["5%", "10%", "20%", "25%"];

interface ArbData {
  current?: {
    hookAPY: number;
    nativeAPY: number;
    spread: number;
    hookTVL: number;
    nativeTVL: number;
    hookVol24h: number;
    nativeVol24h: number;
  };
  history?: { spread: number; timestamp: string }[];
  recommendation?: { currentSpread: string; reasoning: string };
}

interface Cfg {
  optimizerRouter?: string;
  standardToken?: string;
  rpcUrl?: string;
  arbVenueBuy?: string;
  arbVenueSell?: string;
}

export default function ArbitragePage() {
  const { connected, address, signer, chainId } = useWallet();
  const [data, setData] = useState<ArbData>({});
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [keys, setKeys] = useState<{ for: string; list: { tier: string }[] }>({
    for: "",
    list: [],
  });
  const [tierIdx, setTierIdx] = useState(3);
  const [amount, setAmount] = useState("0.1");
  const [minProfit, setMinProfit] = useState("0.001");
  const [executing, setExecuting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    fetch("/api/arbitrage")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => {});
    return () => clearInterval(id);
  }, [loadData]);

  // NFT lock: Genesis/Backer key destrava o botão (Tier 1 → 5% success fee)
  // `keysFor` guarda a carteira dona da lista — evita setState síncrono no efeito
  useEffect(() => {
    if (!connected || !address) return;
    let alive = true;
    fetch(`/api/nft/keys?address=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setKeys({ for: address, list: d.keys || [] });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [connected, address]);

  // Success Fee do Tier (identityTier/successFeeBps on-chain)
  useEffect(() => {
    if (!cfg?.optimizerRouter || !cfg.rpcUrl || chainId !== 11155111) return;
    let alive = true;
    try {
      const p = new ethers.JsonRpcProvider(cfg.rpcUrl);
      const router = new ethers.Contract(cfg.optimizerRouter, ROUTER_ABI, p);
      const who = address || ethers.ZeroAddress;
      Promise.all([router.identityTier(who), router.successFeeBps(who)])
        .then(([t, f]) => {
          if (!alive) return;
          setTierIdx(Number(t));
          void f;
        })
        .catch(() => {});
    } catch {}
    return () => {
      alive = false;
    };
  }, [cfg, address, chainId]);

  const routerAddr = cfg?.optimizerRouter || "";
  const venueBuy = cfg?.arbVenueBuy || "";
  const venueSell = cfg?.arbVenueSell || "";
  const standardAddr = cfg?.standardToken || "";
  const venuesReady = Boolean(routerAddr && venueBuy && venueSell && standardAddr);
  const realMode = chainId === 11155111 && venuesReady;
  const hasGenesisKey =
    connected &&
    Boolean(address) &&
    keys.for === address &&
    keys.list.some((k) => k.tier === "GENESIS" || k.tier === "BACKER");
  const locked = !hasGenesisKey;

  const cur = data.current;
  const spread = cur?.spread ?? 0;
  const isPositive = spread > 0;
  const history = data.history || [];

  async function handleExecute() {
    if (!signer || !address || !realMode) return;
    setExecuting(true);
    setError(null);
    setTxHash(null);
    try {
      const amt = ethers.parseEther(amount || "0");
      const min = ethers.parseEther(minProfit || "0");
      const router = new ethers.Contract(routerAddr, ROUTER_ABI, signer);
      const tx = await router.executeCustomArbitrage(
        venueBuy,
        venueSell,
        standardAddr,
        amt,
        min,
        { value: amt }
      );
      setTxHash(tx.hash as string);
      await tx.wait();
      loadData();
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string };
      setError(e.shortMessage || e.message || "Arbitrage failed");
    } finally {
      setExecuting(false);
    }
  }

  // Sparkline do spread (histórico real da API)
  const sparkPath = (() => {
    if (history.length < 2) return "";
    const vals = history.map((h) => h.spread);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    return vals
      .map((v, i) => {
        const x = (i / (vals.length - 1)) * 100;
        const y = 30 - ((v - min) / range) * 28;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  })();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tick">
              Atomic Arbitrage — Pool A vs Pool B
            </h1>
            <p className="text-[var(--color-muted)] mt-1">
              Intra-pair $IMD/ETH · Δ Positivo · Flash Accounting · Success Fee só
              sobre o lucro (5%–25%)
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1 opacity-70">
              Spread escaneado/estimado a partir de dados públicos (The Graph /
              indexer) — não é previsão garantida.
            </p>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="text-[var(--color-muted)]">YOUR TIER</div>
            <div className="text-[#00F58C]">
              Tier {tierIdx + 1} · {TIER_LABELS[tierIdx]}
            </div>
            <div className="text-[#FFB000]">
              Success Fee: {TIER_SUCCESS_FEE[tierIdx]}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {!venuesReady && (
          <div className="mb-6 p-3 rounded-xl border border-[#FFB000]/40 bg-[#FFB000]/10 text-xs text-[#FFB000] font-mono">
            ⚠ Contratos de arbitragem ainda não configurados — defina
            OPTIMIZER_ROUTER_ADDRESS, ARB_VENUE_BUY_ADDRESS,
            ARB_VENUE_SELL_ADDRESS e STANDARD_TOKEN_ADDRESS no .env
          </div>
        )}
        {venuesReady && chainId !== 11155111 && (
          <div className="mb-6 p-3 rounded-xl border border-[#FFB000]/40 bg-[#FFB000]/10 text-xs text-[#FFB000] font-mono">
            ⚠ Conecte a carteira à Sepolia Testnet para executar
          </div>
        )}

        {/* Comparison Cards — dados reais da API */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pool A: sem hook */}
          <div className="glass-card p-6 rounded-3xl border border-white/[0.08] bg-[#0A0E14] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-[#6B7A88] tracking-wider">
                  POOL A · sem hook (V4 Vanilla)
                </div>
                <div className="text-xl font-bold text-[#E8E8E8]">
                  APY {cur ? cur.nativeAPY.toFixed(2) : "—"}%
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#6B7A88]">
                $IMD/ETH
              </span>
            </div>
            <div className="space-y-1 text-xs text-[#6B7A88]">
              <div>TVL: ${cur ? cur.nativeTVL.toLocaleString() : "—"}</div>
              <div>Volume 24h: ${cur ? cur.nativeVol24h.toLocaleString() : "—"}</div>
              <div>LP Fee: 0.05% (500 bps)</div>
            </div>
          </div>

          {/* Pool B: com hook */}
          <div className="glass-card p-6 rounded-3xl border border-[#00F58C]/60 bg-[#0A0E14] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-[#00F58C]/70 tracking-wider">
                  POOL B · com Meta Hook (V4)
                </div>
                <div className="text-xl font-bold text-[#00F58C]">
                  APY {cur ? cur.hookAPY.toFixed(2) : "—"}%
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-[#00F58C]/10 border border-[#00F58C]/40 text-[#00F58C]">
                $IMD/ETH
              </span>
            </div>
            <div className="space-y-1 text-xs text-[#00F58C]/70">
              <div>TVL: ${cur ? cur.hookTVL.toLocaleString() : "—"}</div>
              <div>Volume 24h: ${cur ? cur.hookVol24h.toLocaleString() : "—"}</div>
              <div>LP Fee: 0.05% + captura de MEV</div>
            </div>
          </div>
        </div>

        {/* Spread + chart */}
        <div className="mb-8 p-6 rounded-3xl border border-white/[0.08] bg-[#0A0E14]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-[#6B7A88] tracking-widest">
                SPREAD (APY Pool B − Pool A)
              </div>
              <div
                className="text-3xl font-bold"
                style={{ color: isPositive ? "#00F58C" : "#FF567E" }}
              >
                {cur ? `${spread > 0 ? "+" : ""}${spread.toFixed(2)}%` : "—"}
              </div>
            </div>
            <div className="text-right text-xs text-[#6B7A88] font-mono">
              {data.recommendation?.reasoning || "Aguardando dados…"}
            </div>
          </div>
          {sparkPath && (
            <svg
              viewBox="0 0 100 32"
              preserveAspectRatio="none"
              className="w-full h-16"
              role="img"
              aria-label="Histórico de spread Pool A vs Pool B"
            >
              <path
                d={sparkPath}
                fill="none"
                stroke={isPositive ? "#00F58C" : "#FF567E"}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          <div className="text-[10px] text-[#6B7A88] mt-2 font-mono">
            {history.length} snapshots · atualiza a cada 30s
          </div>
        </div>

        {/* Execute panel */}
        <div className="mb-8 p-6 rounded-3xl border border-[#00F58C]/40 bg-[#0A0E14]">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-5">
            <label className="flex-1">
              <span className="text-xs text-[#6B7A88] tracking-wider">
                PRINCIPAL (ETH)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full bg-[#0B0E14] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-[#E8E8E8] focus:border-[#00F58C]/60 outline-none"
              />
            </label>
            <label className="flex-1">
              <span className="text-xs text-[#6B7A88] tracking-wider">
                LUCRO MÍNIMO (ETH) — minProfit
              </span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={minProfit}
                onChange={(e) => setMinProfit(e.target.value)}
                className="mt-1 w-full bg-[#0B0E14] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-[#E8E8E8] focus:border-[#00F58C]/60 outline-none"
              />
            </label>
            <div className="text-xs font-mono text-[#6B7A88] pb-2">
              Success Fee estimada:{" "}
              <span className="text-[#FFB000]">{TIER_SUCCESS_FEE[tierIdx]}</span>{" "}
              sobre o lucro
            </div>
          </div>

          {/* NFT lock visual */}
          {locked && (
            <div className="mb-4 p-3 rounded-xl border border-[#FFB000]/40 bg-[#FFB000]/10 text-xs text-[#FFB000]">
              🔒 NFT LOCKED — execute liberado com Buildercoin NFT (Genesis /
              Backer). Sem NFT o contrato cobra o tier base (25% de success
              fee).
            </div>
          )}

          <button
            onClick={handleExecute}
            disabled={executing || !realMode || locked || !connected}
            className={`w-full py-4 rounded-xl font-bold tracking-widest text-sm transition-all ${
              !executing && realMode && !locked && connected
                ? "bg-[#00F58C] text-[#0B0E14] hover:bg-[#00d97a] shadow-[0_0_30px_rgba(0,245,140,0.3)]"
                : "bg-white/[0.06] text-[#6B7A88] cursor-not-allowed"
            }`}
          >
            {executing
              ? "EXECUTING ATOMIC ARBITRAGE..."
              : locked
              ? "🔒 EXECUTE ATOMIC ARBITRAGE (NFT REQUIRED)"
              : "▶ EXECUTE ATOMIC ARBITRAGE"}
          </button>

          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 text-xs text-[#00F58C] font-mono hover:underline"
            >
              ✓ Tx: {txHash.slice(0, 24)}… (Sepolia Etherscan)
            </a>
          )}
        </div>

        {/* Regra 2 — como funciona */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <h2 className="text-sm text-[#00F58C] font-bold mb-4 tracking-widest">
            COMO FUNCIONA (REGRA 2 · DEC-020)
          </h2>
          <div className="space-y-3 text-sm text-[#6B7A88]">
            <div>1. Escaneamos o spread entre Pool A (sem hook) e Pool B (hook) do mesmo par</div>
            <div>2. executeCustomArbitrage compra ETH → $IMD na venue barata (flash accounting no mesmo tx)</div>
            <div>3. Vende $IMD → ETH na venue cara — Delta Positivo (Δ) medido on-chain</div>
            <div>4. Success Fee SOMENTE sobre o lucro (Tier 1: 5% … Tier 4: 25%) → OptimizerVault.receiveYield (split 60/20/15/5)</div>
            <div>5. Sem lucro ou abaixo de minProfit → a transação reverte; nada é cobrado</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 terminal-panel p-3 border border-[#ff0040]">
            <div className="text-xs text-[#ff0040]">ERROR: {error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
