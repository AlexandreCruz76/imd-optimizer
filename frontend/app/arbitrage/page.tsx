"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";

export default function ArbitragePage() {
  const [capital, setCapital] = useState("10");
  const [capitalAsset, setCapitalAsset] = useState<"ETH" | "IMD">("ETH");
  const [targetSpread, setTargetSpread] = useState("0.5");
  const [maxGas, setMaxGas] = useState("0.005");
  const [armed, setArmed] = useState(false);
  const [logs, setLogs] = useState<Array<{
    route: string;
    edge: string;
    gas: string;
    status: "PENDING" | "EXECUTING" | "CONFIRMED" | "FAILED";
  }>>([]);

  const spreadOptions = ["0.2", "0.5", "1.0"];

  useEffect(() => {
    if (!armed) return;
    const interval = setInterval(() => {
      const routes = ["UNI-V2 → SUSHI", "CURVE → UNI-V3", "BALANCER → CURVE", "UNI-V3 → SUSHI"];
      const route = routes[Math.floor(Math.random() * routes.length)];
      const edge = (Math.random() * 2 + 0.1).toFixed(2);
      const gas = (Math.random() * 0.003 + 0.001).toFixed(4);
      const statuses: Array<"PENDING" | "EXECUTING" | "CONFIRMED" | "FAILED"> = ["PENDING", "EXECUTING", "CONFIRMED", "FAILED"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      setLogs((prev) => [{ route, edge: `${edge}%`, gas: `${gas} ETH`, status }, ...prev].slice(0, 8));
    }, 2000);
    return () => clearInterval(interval);
  }, [armed]);

  const grossSpread = (parseFloat(capital) * parseFloat(targetSpread) / 100).toFixed(4);
  const gasFriction = (parseFloat(maxGas) * 1.2).toFixed(4);
  const netEdge = (parseFloat(grossSpread) - parseFloat(gasFriction)).toFixed(4);

  return (
    <div className="min-h-screen bg-[#04070C] text-emerald-400 font-mono">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-[#070A0F]/90 border border-emerald-500/30 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-8 border-b border-emerald-500/20 pb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-emerald-400">ARBITRAGE TERMINAL</h1>
              <p className="text-emerald-500/60 text-sm mt-1 tracking-widest">MEV EXECUTION ENGINE v3.7.1</p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs text-emerald-500/70">ORACLE SYNC: OPTIMAL</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Execution Controls */}
            <div className="bg-[#090D14]/80 border border-emerald-500/20 rounded-2xl p-6">
              <h2 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-6 uppercase">EXECUTION CONTROLS</h2>

              <div className="space-y-6">
                {/* Capital Input */}
                <div>
                  <label className="block text-xs text-emerald-500/60 mb-2 tracking-wider">CAPITAL ALLOCATION</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={capital}
                        onChange={(e) => setCapital(e.target.value)}
                        className="w-full bg-[#04070C] border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 placeholder-emerald-500/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                        placeholder="10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCapitalAsset("ETH")}
                        className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wider border ${
                          capitalAsset === "ETH"
                            ? "bg-emerald-500 text-black border-emerald-500"
                            : "bg-transparent text-emerald-500/70 border-emerald-500/30 hover:border-emerald-500/50"
                        }`}
                      >
                        ETH
                      </button>
                      <button
                        onClick={() => setCapitalAsset("IMD")}
                        className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wider border ${
                          capitalAsset === "IMD"
                            ? "bg-emerald-500 text-black border-emerald-500"
                            : "bg-transparent text-emerald-500/70 border-emerald-500/30 hover:border-emerald-500/50"
                        }`}
                      >
                        IMD
                      </button>
                    </div>
                    <button className="px-3 py-2 rounded-lg text-xs font-bold tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">MAX</button>
                  </div>
                </div>

                {/* Target Spread */}
                <div>
                  <label className="block text-xs text-emerald-500/60 mb-2 tracking-wider">TARGET SPREAD THRESHOLD</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {spreadOptions.map((spread) => (
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
                  <p className="text-xs text-emerald-500/40 mt-1 text-right">CURRENT: {targetSpread}%</p>
                </div>

                {/* Max Gas Ceiling */}
                <div>
                  <label className="block text-xs text-emerald-500/60 mb-2 tracking-wider">MAX GAS CEILING (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={maxGas}
                    onChange={(e) => setMaxGas(e.target.value)}
                    className="w-full bg-[#04070C] border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 placeholder-emerald-500/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    placeholder="0.005"
                  />
                </div>

                {/* Arm Button */}
                <button
                  onClick={() => setArmed(!armed)}
                  className={`w-full py-3 rounded-xl font-bold text-lg tracking-widest transition-all ${
                    armed
                      ? "bg-red-500 text-black hover:bg-red-400"
                      : "bg-emerald-500 text-black hover:bg-emerald-400"
                  }`}
                >
                  {armed ? "DISARM ENGINE" : "ARM ARBITRAGE ENGINE"}
                </button>
              </div>
            </div>

            {/* Right Card: Telemetry & Metrics */}
            <div className="bg-[#090D14]/80 border border-emerald-500/20 rounded-2xl p-6">
              <h2 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-6 uppercase">TELEMETRY & METRICS</h2>

              <div className="space-y-6">
                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#04070C] border border-emerald-500/20 rounded-xl p-4">
                    <div className="text-xs text-emerald-500/50 tracking-wider mb-1">ORACLE SYNC</div>
                    <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      OPTIMAL
                    </div>
                  </div>
                  <div className="bg-[#04070C] border border-emerald-500/20 rounded-xl p-4">
                    <div className="text-xs text-emerald-500/50 tracking-wider mb-1">LATENCY</div>
                    <div className="text-lg font-bold text-emerald-400">~120ms</div>
                  </div>
                </div>

                {/* Math Breakdown */}
                <div className="border-t border-emerald-500/20 pt-6">
                  <h3 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-4 uppercase">EDGE CALCULATION</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-500/60">GROSS SPREAD</span>
                      <span className="text-emerald-300 font-mono">{grossSpread} {capitalAsset}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-500/60">GAS FRICTION (est.)</span>
                      <span className="text-red-400/80 font-mono">-{gasFriction} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-emerald-500/20 pt-3">
                      <span className="text-emerald-400 font-bold">NET CAPTURED EDGE</span>
                      <span className={`font-mono font-bold ${parseFloat(netEdge) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {parseFloat(netEdge) >= 0 ? "+" : ""}{netEdge} {capitalAsset}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Execution Log */}
                <div className="border-t border-emerald-500/20 pt-6">
                  <h3 className="text-xs font-bold tracking-widest text-emerald-500/70 mb-4 uppercase">EXECUTION LOG</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-emerald-500/50 border-b border-emerald-500/20">
                          <th className="text-left py-2 px-3 tracking-wider">ROUTE</th>
                          <th className="text-right py-2 px-3 tracking-wider">EDGE %</th>
                          <th className="text-right py-2 px-3 tracking-wider">GAS</th>
                          <th className="text-right py-2 px-3 tracking-wider">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-emerald-500/30">AWAITING ENGINE ARM...</td>
                          </tr>
                        ) : (
                          logs.map((log, i) => (
                            <tr key={i} className="border-b border-emerald-500/10 hover:bg-emerald-500/5">
                              <td className="py-2 px-3 text-emerald-300 font-mono">{log.route}</td>
                              <td className="py-2 px-3 text-right text-emerald-400 font-mono">{log.edge}</td>
                              <td className="py-2 px-3 text-right text-emerald-500/60 font-mono">{log.gas}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wider ${
                                  log.status === "CONFIRMED" ? "bg-emerald-500/20 text-emerald-400" :
                                  log.status === "EXECUTING" ? "bg-amber-500/20 text-amber-400" :
                                  log.status === "FAILED" ? "bg-red-500/20 text-red-400" :
                                  "bg-emerald-500/10 text-emerald-500/60"
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
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