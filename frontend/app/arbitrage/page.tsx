"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { Navbar } from "../components/Navbar";
import { useWallet } from "../components/WalletProvider";

interface ArbConfig {
  optimizerRouter: string;
  standardToken: string;
  genesisKey: string;
  arbVenueBuy: string;
  arbVenueSell: string;
  rpcUrl: string;
}

interface ArbSnapshot {
  timestamp: string;
  hookAPY: number;
  nativeAPY: number;
  spread: number;
  winner: "hook" | "native";
  hookTVL: number;
  nativeTVL: number;
}

interface ArbHistoryRow {
  timestamp: string;
  spread: number;
  winner: "hook" | "native";
}

interface TxLog {
  time: string;
  label: string;
  status: "OK" | "ERR" | "INFO";
}

const ROUTER_ABI = [
  "function executeCustomArbitrage(address venueBuy, address venueSell, address token, uint256 amountIn, uint256 minProfit) payable",
  "function identityTier(address user) view returns (uint8)",
  "function successFeeBps(address user) view returns (uint256)",
];

export default function ArbitragePage() {
  const { connected, address, signer, connect } = useWallet();
  const [capital, setCapital] = useState("0.01");
  const [targetSpread, setTargetSpread] = useState("0.5");
  const [maxGas, setMaxGas] = useState("0.005");
  const [config, setConfig] = useState<ArbConfig | null>(null);
  const [arb, setArb] = useState<ArbSnapshot | null>(null);
  const [history, setHistory] = useState<ArbHistoryRow[]>([]);
  const [successFeeBps, setSuccessFeeBps] = useState<number | null>(null);
  const [tier, setTier] = useState<number | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<TxLog[]>([]);

  const pushLog = useCallback((label: string, status: TxLog["status"]) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, label, status }, ...prev].slice(0, 8));
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c: ArbConfig) => setConfig(c))
      .catch(() => pushLog("config indisponível", "ERR"));
  }, [pushLog]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/arbitrage")
        .then((r) => r.json())
        .then((data) => {
          if (!alive) return;
          if (data.current) setArb(data.current);
          if (Array.isArray(data.history)) {
            setHistory(data.history.slice(-8).reverse());
          }
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!connected || !address || !config?.genesisKey) return;
    let alive = true;
    fetch(`/api/nft/keys?address=${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (alive) setHasKey(Boolean(data.deployed && data.keys?.length));
      })
      .catch(() => {
        if (alive) setHasKey(false);
      });
    return () => {
      alive = false;
    };
  }, [connected, address, config]);

  useEffect(() => {
    if (!connected || !address || !config?.optimizerRouter) return;
    let alive = true;
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const router = new ethers.Contract(config.optimizerRouter, ROUTER_ABI, provider);
    Promise.all([router.identityTier(address), router.successFeeBps(address)])
      .then(([t, b]) => {
        if (!alive) return;
        setTier(Number(t));
        setSuccessFeeBps(Number(b));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [connected, address, config]);

  const unlocked = hasKey === true;
  const lockReason = !connected
    ? "Conecte a carteira para verificar sua Genesis Key (NFT)"
    : hasKey === null
    ? "Verificando sua Genesis Key…"
    : !config?.genesisKey
    ? "GenesisKey não configurado no .env (GENESIS_KEY_ADDRESS)"
    : !hasKey
    ? "BLOQUEADO — arbitragem exige Genesis Key NFT (Tier 1/2)"
    : null;

  const spreadPct = arb ? Math.abs(arb.spread) : 0;
  const grossSpread = (parseFloat(capital || "0") * Math.max(spreadPct, parseFloat(targetSpread)) / 100).toFixed(4);
  const gasFriction = (parseFloat(maxGas || "0") * 1.2).toFixed(4);
  const netEdge = (parseFloat(grossSpread) - parseFloat(gasFriction)).toFixed(4);
  const minProfitEth = (
    (parseFloat(capital || "0") * parseFloat(targetSpread || "0")) /
    100
  ).toFixed(6);

  async function execute() {
    if (!connected) {
      await connect();
      return;
    }
    if (!unlocked || !config || !signer) {
      pushLog(lockReason || "estado inválido", "ERR");
      return;
    }
    if (!config.arbVenueBuy || !config.arbVenueSell || !config.standardToken) {
      pushLog(
        "venues ausentes: ARB_VENUE_BUY/SELL e STANDARD_TOKEN no .env",
        "ERR"
      );
      return;
    }
    setExecuting(true);
    try {
      const router = new ethers.Contract(config.optimizerRouter, ROUTER_ABI, signer);
      const amountIn = ethers.parseEther(capital || "0");
      const minProfit = ethers.parseEther(minProfitEth || "0");
      pushLog(`enviando executeCustomArbitrage (${capital} ETH)…`, "INFO");
      const tx = await router.executeCustomArbitrage(
        config.arbVenueBuy,
        config.arbVenueSell,
        config.standardToken,
        amountIn,
        minProfit,
        { value: amountIn }
      );
      pushLog(`tx enviada: ${tx.hash.slice(0, 18)}…`, "OK");
      await tx.wait();
      pushLog("tx confirmada on-chain", "OK");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message.slice(0, 90) : "falha na execução";
      pushLog(msg, "ERR");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#04070C] text-emerald-400 font-mono">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-[#070A0F]/90 border border-emerald-500/30 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-8 border-b border-emerald-500/20 pb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-emerald-400">
                ARBITRAGE TERMINAL
              </h1>
              <p className="text-emerald-500/60 text-sm mt-1 tracking-widest">
                INTRA-PAIR SCANNER — POOL A (SEM HOOK) VS POOL B (COM HOOK)
              </p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div
                className={`w-2 h-2 rounded-full ${
                  arb ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              ></div>
              <span className="text-xs text-emerald-500/70">
                {arb ? "FEED: LIVE (30s)" : "FEED: CARREGANDO…"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Execution Controls */}
            <div className="bg-[#090D14]/80 border border-emerald-500/20 rounded-2xl p-6">
              <h2 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-6 uppercase">
                EXECUTION CONTROLS
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs text-emerald-500/60 mb-2 tracking-wider">
                    CAPITAL ALLOCATION (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    className="w-full bg-[#04070C] border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 placeholder-emerald-500/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    placeholder="0.01"
                  />
                </div>

                <div>
                  <label className="block text-xs text-emerald-500/60 mb-2 tracking-wider">
                    SPREAD MÍNIMO ALVO (MIN PROFIT)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {["0.2", "0.5", "1.0"].map((spread) => (
                      <button
                        key={spread}
                        onClick={() => setTargetSpread(spread)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider border ${
                          targetSpread === spread
                            ? "bg-emerald-500 text-black border-emerald-500"
                            : "bg-transparent text-emerald-500/70 border-emerald-500/30 hover:border-emerald-500/50"
                        }`}
                      >
                        {spread}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={targetSpread}
                    onChange={(e) => setTargetSpread(e.target.value)}
                    className="w-full h-2 bg-[#04070C] rounded-lg appearance-none accent-emerald-500"
                  />
                  <p className="text-xs text-emerald-500/40 mt-1 text-right">
                    MIN PROFIT NA TX: {minProfitEth} ETH
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-emerald-500/60 mb-2 tracking-wider">
                    GAS ESTIMATE (ETH, REFERÊNCIA)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={maxGas}
                    onChange={(e) => setMaxGas(e.target.value)}
                    className="w-full bg-[#04070C] border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 placeholder-emerald-500/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    placeholder="0.005"
                  />
                </div>

                <div className="bg-[#04070C] border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-xs text-emerald-500/50 tracking-wider mb-1">
                    SUCCESS FEE (SEU TIER — SÓ SOBRE O LUCRO)
                  </div>
                  <div className="text-lg font-bold text-emerald-400">
                    {connected
                      ? successFeeBps !== null
                        ? `${(successFeeBps / 100).toFixed(2)}% · TIER ${tier ?? "?"}`
                        : "lendo no router…"
                      : "conecte a carteira"}
                    <span className="text-xs text-emerald-500/50 font-normal ml-2">
                      (faixa DEC-020: 5%–25%)
                    </span>
                  </div>
                </div>

                {/* NFT Lock */}
                {lockReason && (
                  <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4">
                    <div className="text-xs font-bold tracking-widest text-amber-400 mb-1">
                      🔒 THE SPEAR — BLOQUEADO
                    </div>
                    <div className="text-xs text-amber-500/70">{lockReason}</div>
                    <a
                      href="/nft-mint"
                      className="inline-block mt-2 text-xs font-bold text-emerald-400 underline hover:text-emerald-300"
                    >
                      MINTAR GENESIS KEY →
                    </a>
                  </div>
                )}

                <button
                  onClick={execute}
                  disabled={executing || (connected && !unlocked)}
                  className={`w-full py-4 rounded-xl font-bold text-lg tracking-widest transition-all active:scale-95 ${
                    executing
                      ? "bg-amber-500 text-black"
                      : connected && !unlocked
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(0,245,140,0.35)]"
                  }`}
                >
                  {executing
                    ? "EXECUTING…"
                    : !connected
                    ? "CONNECT WALLET"
                    : "▶ EXECUTE ATOMIC ARBITRAGE"}
                </button>

                <p className="text-[10px] text-emerald-500/40 leading-relaxed">
                  Executa executeCustomArbitrage(venueBuy, venueSell, STANDARD,
                  amountIn, minProfit) no OptimizerRouter — atômico, reverts se o
                  spread estiver abaixo do mínimo. Spread exibido é escaneado/
                  estimado no servidor; a confirmação é a da própria tx on-chain.
                </p>
              </div>
            </div>

            {/* Right Card: Telemetry & Metrics */}
            <div className="bg-[#090D14]/80 border border-emerald-500/20 rounded-2xl p-6">
              <h2 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-6 uppercase">
                SPREAD SCANNER — INTRA-PAIR (IMD/ETH)
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#04070C] border border-emerald-500/20 rounded-xl p-4">
                    <div className="text-xs text-emerald-500/50 tracking-wider mb-1">
                      POOL A — SEM HOOK
                    </div>
                    <div className="text-lg font-bold text-emerald-400">
                      {arb ? `${arb.nativeAPY.toFixed(2)}% APY` : "—"}
                    </div>
                    <div className="text-[10px] text-emerald-500/40 mt-1">
                      TVL ${arb ? Math.round(arb.nativeTVL).toLocaleString() : "—"}
                    </div>
                  </div>
                  <div className="bg-[#04070C] border border-emerald-500/20 rounded-xl p-4">
                    <div className="text-xs text-emerald-500/50 tracking-wider mb-1">
                      POOL B — COM HOOK
                    </div>
                    <div className="text-lg font-bold text-emerald-400">
                      {arb ? `${arb.hookAPY.toFixed(2)}% APY` : "—"}
                    </div>
                    <div className="text-[10px] text-emerald-500/40 mt-1">
                      TVL ${arb ? Math.round(arb.hookTVL).toLocaleString() : "—"}
                    </div>
                  </div>
                </div>

                <div className="bg-[#04070C] border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-xs text-emerald-500/60 tracking-wider">
                    SPREAD (B − A)
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      arb && arb.spread >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {arb ? `${arb.spread.toFixed(2)}%` : "—"}
                  </span>
                  <span className="text-[10px] text-emerald-500/50">
                    {arb
                      ? `vencedor: ${arb.winner === "hook" ? "POOL B" : "POOL A"}`
                      : ""}
                  </span>
                </div>

                <div className="border-t border-emerald-500/20 pt-6">
                  <h3 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-4 uppercase">
                    EDGE CALCULATION (ESTIMADO)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-500/60">GROSS SPREAD</span>
                      <span className="text-emerald-300 font-mono">
                        {grossSpread} ETH
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-500/60">GAS FRICTION (est.)</span>
                      <span className="text-red-400/80 font-mono">
                        -{gasFriction} ETH
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-emerald-500/20 pt-3">
                      <span className="text-emerald-400 font-bold">
                        NET EDGE (est.)
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          parseFloat(netEdge) >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {parseFloat(netEdge) >= 0 ? "+" : ""}
                        {netEdge} ETH
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-emerald-500/20 pt-6">
                  <h3 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-4 uppercase">
                    SPREAD HISTORY (ESCANEADO)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-emerald-500/50 border-b border-emerald-500/20">
                          <th className="text-left py-2 px-3 tracking-wider">HORA</th>
                          <th className="text-right py-2 px-3 tracking-wider">SPREAD</th>
                          <th className="text-right py-2 px-3 tracking-wider">WINNER</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center py-8 text-emerald-500/30">
                              AGUARDANDO FEED…
                            </td>
                          </tr>
                        ) : (
                          history.map((row, i) => (
                            <tr key={i} className="border-b border-emerald-500/10 hover:bg-emerald-500/5">
                              <td className="py-2 px-3 text-emerald-300 font-mono">
                                {new Date(row.timestamp).toLocaleTimeString()}
                              </td>
                              <td
                                className={`py-2 px-3 text-right font-mono ${
                                  row.spread >= 0 ? "text-emerald-400" : "text-amber-400"
                                }`}
                              >
                                {row.spread.toFixed(2)}%
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-bold tracking-wider ${
                                    row.winner === "hook"
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-amber-500/20 text-amber-400"
                                  }`}
                                >
                                  {row.winner === "hook" ? "POOL B" : "POOL A"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-emerald-500/20 pt-6">
                  <h3 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-4 uppercase">
                    TX LOG
                  </h3>
                  {logs.length === 0 ? (
                    <p className="text-xs text-emerald-500/30">
                      sem transações nesta sessão
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, i) => (
                        <div key={i} className="flex gap-3 text-xs">
                          <span className="text-emerald-500/40">{log.time}</span>
                          <span
                            className={
                              log.status === "ERR"
                                ? "text-red-400"
                                : log.status === "OK"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                          >
                            {log.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
