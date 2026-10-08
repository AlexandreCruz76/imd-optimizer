"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Navbar } from "../components/Navbar";
import { useWallet } from "../components/WalletProvider";

const SPREAD_PRESETS = [0.2, 0.5, 1.0];

const ROUTER_ABI = [
  "function executeCustomArbitrage(address venueBuy, address venueSell, address token, uint256 amountIn, uint256 minProfit) payable",
];

const IDENTITY_ABI = [
  "function identityTier(address) view returns (uint8)",
  "function swapFeeBps(address) view returns (uint256)",
  "function successFeeBps(address) view returns (uint256)",
];

const TIER_NAMES: Record<number, string> = {
  0: "T1 Buildercoin NFT",
  1: "T2 Identity (md)",
  2: "T3 $IMD/$BLD",
  3: "T4 Retail",
};

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

interface ArbHistory {
  timestamp: string;
  spread: number;
  winner: "hook" | "native";
}

interface ArbFeed {
  current: { spread: number; hookAPY: number; nativeAPY: number };
  history: ArbHistory[];
}

interface ArbConfig {
  optimizerRouter?: string;
  arbVenueBuy?: string;
  arbVenueSell?: string;
  standardToken?: string;
}

export default function ArbitragePage() {
  const { connected, signer, connect, address, provider } = useWallet();
  const [capitalAmount, setCapitalAmount] = useState("");
  const [capitalToken, setCapitalToken] = useState<"ETH" | "IMD">("ETH");
  const [targetSpread, setTargetSpread] = useState(0.5);
  const [maxGasCeiling, setMaxGasCeiling] = useState(50);
  const [armed, setArmed] = useState(false);
  const [feed, setFeed] = useState<ArbFeed | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [config, setConfig] = useState<ArbConfig>({});
  const [status, setStatus] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [identity, setIdentity] = useState<{
    addr: string | null;
    tier: number | null;
    feeBps: number | null;
    successBps: number | null;
  }>({ addr: null, tier: null, feeBps: null, successBps: null });

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/arbitrage")
        .then((r) => r.json())
        .then((d) => {
          if (!alive || d.error) return;
          setFeed(d);
          setUpdatedAt(
            new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        })
        .catch(() => {});
    load();
    const iv = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const routerAddr = config.optimizerRouter;
    if (!connected || !address || !provider || !routerAddr) return;
    let alive = true;
    (async () => {
      try {
        const r = new ethers.Contract(routerAddr, IDENTITY_ABI, provider);
        const [tier, feeBps, successBps] = await Promise.all([
          r
            .identityTier(address)
            .then((v: unknown) => Number(v))
            .catch(() => null),
          r
            .swapFeeBps(address)
            .then((v: unknown) => Number(v))
            .catch(() => null),
          r
            .successFeeBps(address)
            .then((v: unknown) => Number(v))
            .catch(() => null),
        ]);
        if (alive)
          setIdentity({ addr: address, tier, feeBps, successBps });
      } catch {
        if (alive)
          setIdentity({
            addr: address,
            tier: null,
            feeBps: null,
            successBps: null,
          });
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected, address, provider, config.optimizerRouter]);

  const grossSpread = feed?.current.spread ?? 0;
  const hookApy = feed?.current.hookAPY ?? 0;
  const nativeApy = feed?.current.nativeAPY ?? 0;
  const netCapturedEdge = grossSpread - targetSpread;

  async function handleArmExecute() {
    if (capitalToken !== "ETH") {
      setStatus("Execute exige capital em ETH (as venues são pagas em ETH).");
      return;
    }
    const amt = parseFloat(capitalAmount || "0");
    if (!armed) {
      if (amt <= 0) {
        setStatus("Informe o capital em ETH para arbitragem.");
        return;
      }
      if (
        !config.arbVenueBuy ||
        !config.arbVenueSell ||
        !config.standardToken
      ) {
        setStatus(
          "Venues ausentes: ARB_VENUE_BUY / ARB_VENUE_SELL / STANDARD_TOKEN no .env"
        );
        return;
      }
      if (!connected) await connect();
      setArmed(true);
      setStatus("Engine ARMED — clique novamente para executar on-chain.");
      return;
    }
    if (!connected) {
      await connect();
      return;
    }
    if (!signer || !config.optimizerRouter) {
      setStatus("Conecte a carteira para assinar a transação.");
      return;
    }
    setExecuting(true);
    setStatus(null);
    try {
      const router = new ethers.Contract(
        config.optimizerRouter,
        ROUTER_ABI,
        signer
      );
      const amountIn = ethers.parseEther(capitalAmount);
      const minProfit =
        (amountIn * BigInt(Math.round(targetSpread * 100))) / 10000n;
      const tx = await router.executeCustomArbitrage(
        config.arbVenueBuy,
        config.arbVenueSell,
        config.standardToken,
        amountIn,
        minProfit,
        { value: amountIn }
      );
      setStatus(`tx: ${tx.hash.slice(0, 18)}… — aguardando confirmação`);
      await tx.wait();
      setStatus(`confirmada on-chain: ${tx.hash.slice(0, 22)}…`);
      setArmed(false);
    } catch (err) {
      setStatus(
        `falha: ${
          err instanceof Error
            ? err.message.slice(0, 130)
            : "execução revertida (lock NFT / cooldown / venue)"
        }`
      );
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono">
      <Navbar />

      <main className="pt-20 pb-8 px-4 md:px-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Ambient scanlines */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_3px] opacity-20" />
        {/* Corner brackets */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-emerald-500/30" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-emerald-500/30" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-emerald-500/30" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-emerald-500/30" />
        </div>

        <div className="relative z-10 w-full max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-sm md:text-base font-mono text-white tracking-widest uppercase">
              ARBITRAGE TERMINAL
            </h1>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FEED: {feed ? "LIVE (30s)" : "CARREGANDO…"}
              </span>
              <span className="text-emerald-400">UPD: {updatedAt ?? "—"}</span>
            </div>
          </div>

          {/* Outer bezel container */}
          <div className="bg-[#070A0F]/90 border border-emerald-500/30 rounded-3xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT CARD: Execution Controls */}
              <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">EXECUTION CONTROLS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Identifier — Identity Tier on-chain */}
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                      IDENTIFIER · IDENTITY TIER (ON-CHAIN)
                    </span>
                    {connected && address ? (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {shortAddr(address)}
                      </span>
                    ) : (
                      <button
                        onClick={() => connect().catch(() => {})}
                        className="text-[10px] text-emerald-400 font-mono underline hover:text-emerald-300"
                      >
                        conectar carteira
                      </button>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-mono text-white">
                    {connected && address && identity.addr !== address
                      ? "consultando on-chain…"
                      : identity.addr === address && identity.tier !== null
                      ? `${TIER_NAMES[identity.tier] ?? `Tier ${identity.tier + 1}`}`
                      : connected
                      ? "identity não lido — build do router sem DEC-020?"
                      : "— (conecte para ler o tier)"}
                  </div>
                  {identity.addr === address && identity.feeBps !== null && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      swap fee {(identity.feeBps / 100).toFixed(2)}% · success
                      fee {((identity.successBps ?? 0) / 100).toFixed(2)}% (só
                      sobre o lucro)
                    </div>
                  )}
                </div>

                {/* Capital Input */}
                <div className="space-y-3">
                  <label className="text-xs text-slate-400 font-mono tracking-widest uppercase block">CAPITAL ALLOCATION</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={capitalToken}
                      onChange={(e) => setCapitalToken(e.target.value as "ETH" | "IMD")}
                      className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-emerald-500/50 focus:outline-none appearance-none"
                    >
                      <option value="ETH">Ξ ETH</option>
                      <option value="IMD">⚡ IMD</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={capitalAmount}
                      onChange={(e) => setCapitalAmount(e.target.value)}
                      placeholder="0.0000"
                      className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-2xl font-mono text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none"
                      min="0"
                      step={capitalToken === "ETH" ? "0.0001" : "0.01"}
                    />
                    <button
                      className="px-4 py-3 text-sm font-bold bg-slate-800/80 border border-slate-700/50 rounded-xl text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-all active:scale-95 whitespace-nowrap"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Target Spread */}
                <div className="space-y-3">
                  <label className="text-xs text-slate-400 font-mono tracking-widest uppercase block">TARGET SPREAD</label>
                  <div className="flex flex-wrap gap-2">
                    {SPREAD_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setTargetSpread(preset)}
                        className={`px-4 py-2 text-sm font-mono rounded-xl border transition-all ${
                          targetSpread === preset
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : "bg-slate-900/50 border-slate-700/50 text-slate-300 hover:border-emerald-500/30"
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                  <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/50 transition-all duration-300"
                      style={{ width: `${(targetSpread / 1.0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Max Gas Ceiling */}
                <div className="space-y-3">
                  <label className="text-xs text-slate-400 font-mono tracking-widest uppercase block">MAX GAS CEILING (GWEI)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={maxGasCeiling}
                      onChange={(e) => setMaxGasCeiling(Math.min(Math.max(parseInt(e.target.value) || 0, 1), 500))}
                      className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-2xl font-mono text-white focus:border-emerald-500/50 focus:outline-none"
                      min="1"
                      max="500"
                    />
                    <span className="text-slate-400 font-mono text-lg">GWEI</span>
                  </div>
                </div>

                {/* Arm Button */}
                <button
                  onClick={handleArmExecute}
                  disabled={executing}
                  className={`w-full font-bold py-3 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 ${
                    armed
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-slate-800 border border-emerald-500/50 text-emerald-400 hover:bg-slate-700"
                  }`}
                >
                  {executing
                    ? "EXECUTING ON-CHAIN…"
                    : armed
                    ? "▶ EXECUTE ATOMIC ARBITRAGE"
                    : "ARM ARBITRAGE ENGINE"}
                </button>
                {status && (
                  <div className="text-[11px] font-mono text-slate-400 break-all border border-slate-700/50 bg-slate-900/40 rounded-xl px-3 py-2">
                    {status}
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-500 leading-relaxed">
                  Requer Genesis Key NFT (lock por minBlockDelay) — o contrato
                  valida o lock, o cooldown anti-sandwich e as venues na
                  execução. minProfit = capital × target spread.
                </div>
              </div>

              {/* RIGHT CARD: Telemetry & Metrics */}
              <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-6 space-y-6 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">TELEMETRY & METRICS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Status Strip */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/40 border border-slate-700/50 rounded-xl">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">FEED</div>
                    <div className="text-sm font-mono text-emerald-400 font-bold">
                      {feed ? "LIVE (30s)" : "CARREGANDO…"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">UPDATED</div>
                    <div className="text-sm font-mono text-emerald-400">{updatedAt ?? "—"}</div>
                  </div>
                </div>

                {/* Math Breakdown */}
                <div className="space-y-2 border-t border-b border-slate-800/50 py-4">
                  <div className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-3">SPREAD BREAKDOWN (APY · The Graph / Indexer)</div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">SPREAD (HOOK − NATIVE)</span>
                    <span className="font-mono text-emerald-400 text-lg">{grossSpread.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">APY HOOK / NATIVE</span>
                    <span className="font-mono text-slate-300 text-base">{hookApy.toFixed(2)}% / {nativeApy.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">TARGET THRESHOLD</span>
                    <span className="font-mono text-slate-300 text-lg">{targetSpread.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-slate-700/50">
                    <span className="text-xs text-slate-400 font-mono uppercase">SPREAD − TARGET</span>
                    <span className="font-mono font-bold text-lg" style={{ color: netCapturedEdge > 0 ? "#00F58C" : "#FF567E" }}>
                      {netCapturedEdge > 0 ? "+" : ""}{netCapturedEdge.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Execution Log Table */}
                <div className="flex-1 overflow-y-auto">
                  <div className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-3">EXECUTION LOG — SNAPSHOTS REAIS (30s)</div>
                  <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700/50">
                          <th className="text-left py-2 px-3">WINNER</th>
                          <th className="py-2 px-3">SPREAD %</th>
                          <th className="py-2 px-3">HORA</th>
                          <th className="py-2 px-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feed && feed.history.length > 0 ? (
                          feed.history.slice(-6).reverse().map((log, i) => {
                            const actionable = Math.abs(log.spread) >= 2;
                            return (
                              <tr key={i} className="border-t border-slate-800/50 hover:bg-emerald-500/5">
                                <td className="py-2 px-3 text-slate-300">
                                  {log.winner === "hook" ? "ETH→IMD (Hook)" : "IMD→ETH (Native)"}
                                </td>
                                <td className="py-2 px-3 text-emerald-400">{log.spread >= 0 ? "+" : ""}{log.spread.toFixed(2)}%</td>
                                <td className="py-2 px-3 text-slate-400">
                                  {new Date(log.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    actionable
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  }`}>
                                    {actionable ? "ACTIONABLE" : "HOLD"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="border-t border-slate-800/50">
                            <td colSpan={4} className="py-4 px-3 text-center text-slate-500">
                              aguardando feed /api/arbitrage…
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}