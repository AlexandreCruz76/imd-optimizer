"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "../components/WalletProvider";

interface RealTimeData {
  hookAPY: number;
  nativeAPY: number;
  hookTVL: number;
  nativeTVL: number;
  hookVol24h: number;
  nativeVol24h: number;
  hookFees24h: number;
  nativeFees24h: number;
  hookTxs: number;
  nativeTxs: number;
  hookPair: string;
  nativePair: string;
  hookFeeTier: number;
  nativeFeeTier: number;
  spreadAPY: number;
  price: number;
  ethUsd: number;
  timestamp: string;
}

interface Scenario {
  name: string;
  label: string;
  color: string;
  volumeMultiplier: number;
  apyMultiplier: number;
}

interface Projection {
  scenario: Scenario;
  dailyFees: number;
  weeklyFees: number;
  monthlyFees: number;
  annualFees: number;
  apy: number;
  impermanentLoss: number;
  netReturn: number;
  breakEvenDays: number;
}

const SCENARIOS: Scenario[] = [
  { name: "bear", label: "BEAR (Low Volume)", color: "#ff4444", volumeMultiplier: 0.3, apyMultiplier: 0.4 },
  { name: "calm", label: "CALM (Below Avg)", color: "#888888", volumeMultiplier: 0.7, apyMultiplier: 0.75 },
  { name: "normal", label: "NORMAL (Current)", color: "#00F58C", volumeMultiplier: 1.0, apyMultiplier: 1.0 },
  { name: "hot", label: "HOT (Above Avg)", color: "#00F58C", volumeMultiplier: 1.8, apyMultiplier: 1.5 },
  { name: "bull", label: "BULL (Peak Volume)", color: "#00F58C", volumeMultiplier: 3.0, apyMultiplier: 2.5 },
];

export default function LPSim() {
  const { address, connected, balance, connect, connecting } = useWallet();
  const [data, setData] = useState<RealTimeData | null>(null);
  const [ethAmount, setEthAmount] = useState("1");
  const [imdAmount, setImdAmount] = useState("0");
  const [projections, setProjections] = useState<Projection[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/pool-state");
      const json = await res.json();

      setData({
        hookAPY: parseFloat(json.hookAPY) || 0,
        nativeAPY: parseFloat(json.nativeAPY) || 0,
        hookTVL: parseFloat(json.hookTVL) || 0,
        nativeTVL: parseFloat(json.nativeTVL) || 0,
        hookVol24h: parseFloat(json.hookVolumeUSD) || 0,
        nativeVol24h: parseFloat(json.nativeVolumeUSD) || 0,
        hookFees24h: parseFloat(json.hookFeesUSD) || 0,
        nativeFees24h: parseFloat(json.nativeFeesUSD) || 0,
        hookTxs: json.hookTxs24h || 0,
        nativeTxs: json.nativeTxs24h || 0,
        hookPair: json.hookPair || "ETH/IMD",
        nativePair: json.nativePair || "ETH/IMD",
        hookFeeTier: parseFloat(json.hookFeeTier) || 500,
        nativeFeeTier: parseFloat(json.nativeFeeTier) || 500,
        spreadAPY: parseFloat(json.spreadAPY) || 0,
        price: parseFloat(json.price) || 0,
        ethUsd: parseFloat(json.ethUsd) || 2500,
        timestamp: json.timestamp,
      });
      setLastUpdate(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));
      setError(null);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }

  function calculateProjections() {
    if (!data) return;
    const eth = parseFloat(ethAmount);
    if (isNaN(eth) || eth <= 0) return;

    const results: Projection[] = SCENARIOS.map((scenario) => {
      // Adjust metrics based on scenario volatility
      const adjVol24h = data.hookVol24h * scenario.volumeMultiplier;
      const adjFees24h = data.hookFees24h * scenario.volumeMultiplier;
      const adjAPY = data.hookAPY * scenario.apyMultiplier;

      // Pool share
      const totalPool = data.hookTVL + eth * data.ethUsd;
      const userShare = (eth * data.ethUsd) / totalPool;

      // Fees earned (user share of pool fees)
      const dailyFeesUSD = adjFees24h * userShare;
      const dailyFeesETH = dailyFeesUSD / data.ethUsd;

      // Impermanent loss based on volatility scenario
      const priceMove = scenario.volumeMultiplier * 0.15; // Higher volume = more price movement
      const il = Math.abs(
        (2 * Math.sqrt(1 + priceMove) / (1 + 1 + priceMove) - 1) * 100
      );

      // Net return (fees minus IL)
      const weeklyFeesETH = dailyFeesETH * 7;
      const monthlyFeesETH = dailyFeesETH * 30;
      const annualFeesETH = dailyFeesETH * 365;
      const annualFeesUSD = annualFeesETH * data.ethUsd;

      const netReturn = (adjAPY - il * 3.65) / 100; // Annualized net

      return {
        scenario,
        dailyFees: dailyFeesETH,
        weeklyFees: weeklyFeesETH,
        monthlyFees: monthlyFeesETH,
        annualFees: annualFeesETH,
        apy: adjAPY,
        impermanentLoss: il,
        netReturn: netReturn * 100,
        breakEvenDays: dailyFeesETH > 0 ? eth / dailyFeesETH : 999,
      };
    });

    setProjections(results);
  }

  useEffect(() => {
    if (data) calculateProjections();
  }, [data, ethAmount]);

  // Conversion rate and derived values
  const conversionRate = useMemo(() => {
    if (!data || !data.ethUsd || !data.price) return 0;
    return data.price; // 1 ETH = price IMD
  }, [data]);

  const ethBalance = connected ? parseFloat(balance) : 0;
  const imdBalance = 0; // Would need token balance fetch in production

  // Sync IMD amount when ETH changes (and vice versa if needed)
  const handleEthChange = (value: string) => {
    setEthAmount(value);
    const eth = parseFloat(value) || 0;
    if (conversionRate > 0) {
      setImdAmount((eth * conversionRate).toFixed(2));
    }
  };

  const handleImdChange = (value: string) => {
    setImdAmount(value);
    const imd = parseFloat(value) || 0;
    if (conversionRate > 0) {
      setEthAmount((imd / conversionRate).toFixed(6));
    }
  };

  const handleEthMax = () => {
    if (ethBalance > 0) {
      handleEthChange(ethBalance.toFixed(4));
    }
  };

  const handleImdMax = () => {
    if (imdBalance > 0) {
      handleImdChange(imdBalance.toFixed(2));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <span className="cursor">█</span> Loading yield projections...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="terminal-panel p-4 border border-red-500/30">
        <div className="text-red-400">ERROR: No pool data available</div>
      </div>
    );
  }

  const eth = parseFloat(ethAmount) || 0;

  return (
    <div className="relative overflow-hidden border-2 border-slate-700/50 rounded-3xl shadow-[0_0_40px_rgba(0,245,140,0.15)] bg-[#070A0F]/80 backdrop-blur-xl p-6">
      {/* Background artwork */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-35 pointer-events-none">
        <img src="/images/agente.png" alt="Agent" className="max-w-full max-h-full object-contain" />
      </div>

      {/* Holographic scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-30" />

      {/* Tactical corner marks */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500/30" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500/30" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500/30" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500/30" />
      </div>

      <div className="space-y-4 fade-in relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <h1 className="text-lg font-mono tracking-wider text-slate-300">
            ┌─ TACTICAL YIELD TERMINAL ────────────────────────────────────┐
          </h1>
          <div className="flex items-center gap-3">
            <span className="relative flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
            <span className="text-xs text-slate-500 font-mono">{lastUpdate}</span>
            <button
              onClick={fetchData}
              className="px-3 py-1 text-xs font-mono text-slate-400 hover:text-emerald-400 border border-slate-700/50 rounded bg-slate-800/50 active:scale-95 active:brightness-125 cursor-pointer transition-transform duration-150"
            >
              REFRESH
            </button>
          </div>
        </div>

        {/* 4 Main Tactical Glass Touch Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Panel 1: Real-Time Pool Data */}
          <div className="bg-[#0B111A]/90 border border-emerald-500/20 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] hover:border-emerald-400/40 transition-all p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-400 tracking-widest font-mono">
                ▸ POOL TELEMETRY [SYS.01]
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(0,245,140,0.8)]" title="ONLINE" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                <div className="text-xs text-slate-500">HOOK APY</div>
                <div className="text-xl font-mono text-emerald-400">{data.hookAPY.toFixed(1)}%</div>
                <div className="text-xs text-slate-500">TVL: ${data.hookTVL.toLocaleString()}</div>
              </div>
              <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                <div className="text-xs text-slate-500">NATIVE APY</div>
                <div className="text-xl font-mono text-red-400">{data.nativeAPY.toFixed(1)}%</div>
                <div className="text-xs text-slate-500">TVL: ${data.nativeTVL.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-500">ACTIVITY</div>
                <div className="text-xl font-mono text-slate-200">{data.hookTxs + data.nativeTxs}</div>
                <div className="text-xs text-slate-500">TXS / 24H</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-500">SPREAD</div>
                <div className="text-xl font-mono" style={{ color: data.spreadAPY >= 0 ? '#00F58C' : '#ff4444' }}>
                  {data.spreadAPY >= 0 ? '+' : ''}{data.spreadAPY.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">HOOK vs NATIVE</div>
              </div>
            </div>
          </div>

          {/* Panel 2: Liquidity Deposit — Uniswap-Style Dual Input */}
          <div className="bg-[#0B111A]/90 border border-emerald-500/20 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] hover:border-emerald-400/40 transition-all p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-slate-400 tracking-widest font-mono">
                ▸ LIQUIDITY DEPLOYMENT [SYS.02]
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(0,245,140,0.8)]" title="READY" />
            </div>

            {/* Dual Token Input Cards */}
            <div className="flex flex-col md:flex-row items-center gap-0">
              {/* ETH Input Card (Token A) */}
              <div className="w-full md:w-1/2 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 font-mono">Allocate Token A</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Balance: {ethBalance.toFixed(4)} ETH</span>
                    <button
                      onClick={handleEthMax}
                      disabled={ethBalance <= 0 || !connected}
                      className="px-2 py-1 text-xs font-bold bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={ethAmount}
                    onChange={(e) => handleEthChange(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-2xl font-mono text-white placeholder-slate-600"
                    min="0"
                    step="0.0001"
                    placeholder="0.0000"
                  />
                  <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl font-bold text-slate-200 whitespace-nowrap">
                    Ξ ETH
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="flex justify-center -my-2 relative z-10 md:-mx-2 md:my-0">
                <div className="w-8 h-8 rounded-full bg-[#0E1522] border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold shadow-md">
                  +
                </div>
              </div>

              {/* IMD Input Card (Token B) */}
              <div className="w-full md:w-1/2 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 font-mono">Allocate Token B</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Balance: {imdBalance.toFixed(2)} IMD</span>
                    <button
                      onClick={handleImdMax}
                      disabled={imdBalance <= 0 || !connected}
                      className="px-2 py-1 text-xs font-bold bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={imdAmount}
                    onChange={(e) => handleImdChange(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-2xl font-mono text-white placeholder-slate-600"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl font-bold text-slate-200 whitespace-nowrap">
                    ⚡ IMD
                  </div>
                </div>
                {conversionRate > 0 && (
                  <div className="mt-2 text-xs text-slate-500 font-mono">
                    Rate: 1 ETH ≈ {conversionRate.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} IMD
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4">
              {!connected ? (
                <button
                  onClick={connect}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-xl shadow-[0_0_20px_rgba(0,245,140,0.3)] transition-all cursor-pointer active:scale-[0.98]"
                  disabled={connecting}
                >
                  Connect Wallet
                </button>
              ) : (
                <button
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-xl shadow-[0_0_20px_rgba(0,245,140,0.3)] transition-all cursor-pointer active:scale-[0.98]"
                >
                  Approve & Deposit ETH + IMD
                </button>
              )}
            </div>

            {/* Bottom Stats Strip */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                <div className="text-xs text-slate-500 font-mono">DEPOSIT</div>
                <div className="text-lg font-mono text-emerald-400">${(eth * data.ethUsd + parseFloat(imdAmount) * (data.ethUsd / conversionRate)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                <div className="text-xs text-slate-500 font-mono">YOUR SHARE</div>
                <div className="text-lg font-mono text-slate-200">{(eth / (data.hookTVL / data.ethUsd + eth) * 100).toFixed(4)}%</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                <div className="text-xs text-slate-500 font-mono">LP FEE</div>
                <div className="text-lg font-mono text-slate-200">{data.hookFeeTier / 10000}%</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                <div className="text-xs text-slate-500 font-mono">RANGE</div>
                <div className="text-lg font-mono text-slate-200">FULL</div>
              </div>
            </div>
          </div>

        {/* Panel 3: Yield Projections Table */}
        {projections.length > 0 && (
          <div className="bg-[#0B111A]/90 border border-emerald-500/20 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] hover:border-emerald-400/40 transition-all p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-400 tracking-widest font-mono">
                ▸ YIELD PROJECTIONS [SYS.03] — {eth} ETH
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(0,245,140,0.8)]" title="COMPUTING" />
            </div>
            <div className="text-xs text-slate-500 mb-3 font-mono">
              REAL-TIME DATA • 30s REFRESH • VOLATILITY-ADJUSTED
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700/50">
                    <th className="text-left py-2">SCENARIO</th>
                    <th className="py-2">VOL</th>
                    <th className="py-2">APY</th>
                    <th className="py-2">DAILY</th>
                    <th className="py-2">WEEKLY</th>
                    <th className="py-2">MONTHLY</th>
                    <th className="py-2">ANNUAL</th>
                    <th className="py-2">IL</th>
                    <th className="py-2">NET</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p) => (
                    <tr key={p.scenario.name} className="border-t border-slate-700/30 hover:bg-emerald-500/5 transition-colors">
                      <td className="py-2">
                        <span style={{ color: p.scenario.color }} className="font-bold">
                          {p.scenario.label}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400">{(p.scenario.volumeMultiplier * 100).toFixed(0)}%</td>
                      <td className="py-2 font-bold" style={{ color: p.scenario.color }}>{p.apy.toFixed(1)}%</td>
                      <td className="py-2 text-emerald-400">{p.dailyFees.toFixed(6)}</td>
                      <td className="py-2 text-emerald-400">{p.weeklyFees.toFixed(4)}</td>
                      <td className="py-2 text-emerald-400">{p.monthlyFees.toFixed(4)}</td>
                      <td className="py-2 text-emerald-400 font-bold">{p.annualFees.toFixed(2)}</td>
                      <td className="py-2 text-red-400">{p.impermanentLoss.toFixed(1)}%</td>
                      <td className="py-2 font-bold" style={{ color: p.netReturn > 0 ? '#00F58C' : '#ff4444' }}>
                        {p.netReturn > 0 ? '+' : ''}{p.netReturn.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel 4: Annual Return Comparison + Risk Assessment */}
        {projections.length > 0 && (
          <div className="bg-[#0B111A]/90 border border-emerald-500/20 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] hover:border-emerald-400/40 transition-all p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-slate-400 tracking-widest font-mono">
                ▸ TACTICAL ANALYSIS [SYS.04]
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(0,245,140,0.8)]" title="ACTIVE" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Annual Return Bars */}
              <div>
                <div className="text-xs text-slate-400 mb-3 font-mono tracking-wider">ANNUAL RETURN COMPARISON (ETH)</div>
                <div className="space-y-3">
                  {projections.map((p) => {
                    const maxAnnual = Math.max(...projections.map((x) => x.annualFees), 1);
                    const width = (p.annualFees / maxAnnual) * 100;
                    const barColor = p.netReturn > 0 ? '#00F58C' : '#ff4444';
                    return (
                      <div key={p.scenario.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: p.scenario.color }} className="font-mono">{p.scenario.label}</span>
                          <span className="text-emerald-400 font-mono">{p.annualFees.toFixed(4)} ETH</span>
                        </div>
                        <div className="h-3 bg-[#05080A] border border-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-700 ease-out rounded-full"
                            style={{
                              width: `${width}%`,
                              backgroundColor: barColor,
                              opacity: 0.85,
                              boxShadow: `0 0 10px ${barColor}80`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Best/Worst/Current Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <div className="text-xs text-red-400/60 tracking-widest font-mono mb-2">WORST CASE — BEAR</div>
                  <div className="text-2xl font-mono text-red-400">{projections[0].annualFees.toFixed(4)} ETH</div>
                  <div className="text-xs text-slate-400">{projections[0].apy.toFixed(1)}% APY</div>
                  <div className="text-xs text-red-400/60 mt-1 font-mono">IL: {projections[0].impermanentLoss.toFixed(1)}%</div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-xs text-emerald-400/60 tracking-widest font-mono mb-2">CURRENT — NORMAL</div>
                  <div className="text-2xl font-mono text-emerald-400">{projections[2].annualFees.toFixed(4)} ETH</div>
                  <div className="text-xs text-slate-400">{projections[2].apy.toFixed(1)}% APY</div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">IL: {projections[2].impermanentLoss.toFixed(1)}%</div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-xs text-emerald-400/60 tracking-widest font-mono mb-2">BEST CASE — BULL</div>
                  <div className="text-2xl font-mono text-emerald-400">{projections[4].annualFees.toFixed(4)} ETH</div>
                  <div className="text-xs text-slate-400">{projections[4].apy.toFixed(1)}% APY</div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">IL: {projections[4].impermanentLoss.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Volatility Analysis */}
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <div className="text-xs text-slate-400 mb-3 font-mono tracking-wider">VOLATILITY THREAT ASSESSMENT</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
                <p>▸ <span className="text-red-400">BEAR</span>: VOL -70% — CRITICAL THREAT</p>
                <p>▸ <span className="text-slate-400">CALM</span>: VOL -30% — ELEVATED RISK</p>
                <p>▸ <span className="text-emerald-400">NORMAL</span>: BASELINE — {data.hookTxs + data.nativeTxs} TXS/24H</p>
                <p>▸ <span className="text-emerald-400">HOT</span>: VOL +80% — OPPORTUNITY</p>
                <p>▸ <span className="text-emerald-400">BULL</span>: VOL +200% — MAX YIELD WINDOW</p>
                <p className="text-slate-500 col-span-full">▸ AUTO-REFRESH: 30s INTERVAL • SOURCE: THE GRAPH</p>
                <p className="text-slate-500 col-span-full">▸ IL SCALES WITH VOLATILITY — HIGH VOL = HIGH PRICE MOVEMENT</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 tracking-wider font-mono border-t border-slate-700/50 pt-4">
          └────────────────────────────────────────────────────────────────────────┘
        </div>
      </div>
    </div>
    </div>
  );
}
