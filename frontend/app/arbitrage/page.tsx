"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";

const SPREAD_PRESETS = [0.2, 0.5, 1.0];

const MOCK_LOGS = [
  { route: "ETH → IMD (Hook)", edge: 0.84, gas: 142000, status: "EXECUTED" },
  { route: "IMD → ETH (Native)", edge: 0.52, gas: 158000, status: "EXECUTED" },
  { route: "ETH → IMD (Hook)", edge: 0.31, gas: 165000, status: "SKIPPED" },
  { route: "IMD → ETH (Native)", edge: 1.12, gas: 134000, status: "EXECUTED" },
  { route: "ETH → IMD (Hook)", edge: 0.67, gas: 149000, status: "PENDING" },
];

export default function ArbitragePage() {
  const [capitalAmount, setCapitalAmount] = useState("");
  const [capitalToken, setCapitalToken] = useState<"ETH" | "IMD">("ETH");
  const [targetSpread, setTargetSpread] = useState(0.5);
  const [maxGasCeiling, setMaxGasCeiling] = useState(50);
  const [armed, setArmed] = useState(false);

  const grossSpread = 1.24;
  const gasFriction = 0.38;
  const netCapturedEdge = grossSpread - gasFriction - targetSpread;

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
                ORACLE SYNC: OPTIMAL
              </span>
              <span className="text-emerald-400">LATENCY: ~120ms</span>
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
                  onClick={() => setArmed(!armed)}
                  className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all"
                >
                  {armed ? "ARBITRAGE ENGINE ARMED" : "ARM ARBITRAGE ENGINE"}
                </button>
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
                    <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">ORACLE SYNC</div>
                    <div className="text-sm font-mono text-emerald-400 font-bold">OPTIMAL</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">LATENCY</div>
                    <div className="text-sm font-mono text-emerald-400">~120ms</div>
                  </div>
                </div>

                {/* Math Breakdown */}
                <div className="space-y-2 border-t border-b border-slate-800/50 py-4">
                  <div className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-3">MATHEMATICAL BASE BREAKDOWN</div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">GROSS SPREAD</span>
                    <span className="font-mono text-emerald-400 text-lg">{grossSpread.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">GAS FRICTION</span>
                    <span className="font-mono text-rose-500 text-lg">-{gasFriction.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">TARGET THRESHOLD</span>
                    <span className="font-mono text-slate-300 text-lg">{targetSpread.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-slate-700/50">
                    <span className="text-xs text-slate-400 font-mono uppercase">NET CAPTURED EDGE</span>
                    <span className="font-mono font-bold text-lg" style={{ color: netCapturedEdge > 0 ? "#00F58C" : "#FF567E" }}>
                      {netCapturedEdge > 0 ? "+" : ""}{netCapturedEdge.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Execution Log Table */}
                <div className="flex-1 overflow-y-auto">
                  <div className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-3">EXECUTION LOG</div>
                  <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700/50">
                          <th className="text-left py-2 px-3">ROUTE</th>
                          <th className="py-2 px-3">EDGE %</th>
                          <th className="py-2 px-3">GAS</th>
                          <th className="py-2 px-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_LOGS.map((log, i) => (
                          <tr key={i} className="border-t border-slate-800/50 hover:bg-emerald-500/5">
                            <td className="py-2 px-3 text-slate-300">{log.route}</td>
                            <td className="py-2 px-3 text-emerald-400">{log.edge >= 0 ? "+" : ""}{log.edge.toFixed(2)}%</td>
                            <td className="py-2 px-3 text-slate-400">{log.gas.toLocaleString()}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                log.status === "EXECUTED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                log.status === "SKIPPED" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                                "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
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