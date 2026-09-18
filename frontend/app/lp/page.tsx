"use client";

import { useState, useEffect } from "react";

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
  { name: "bear", label: "BEAR (Low Volume)", color: "#ff0040", volumeMultiplier: 0.3, apyMultiplier: 0.4 },
  { name: "calm", label: "CALM (Below Avg)", color: "#ffb000", volumeMultiplier: 0.7, apyMultiplier: 0.75 },
  { name: "normal", label: "NORMAL (Current)", color: "#00ff41", volumeMultiplier: 1.0, apyMultiplier: 1.0 },
  { name: "hot", label: "HOT (Above Avg)", color: "#00ffff", volumeMultiplier: 1.8, apyMultiplier: 1.5 },
  { name: "bull", label: "BULL (Peak Volume)", color: "#ff00ff", volumeMultiplier: 3.0, apyMultiplier: 2.5 },
];

export default function LPSim() {
  const [data, setData] = useState<RealTimeData | null>(null);
  const [ethAmount, setEthAmount] = useState("1");
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
        hookFeeTier: parseFloat(json.hookFeeTier) || 10000,
        nativeFeeTier: parseFloat(json.nativeFeeTier) || 10000,
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#00ff4160]">
        <span className="cursor">█</span> Loading yield projections...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="terminal-panel p-4 border-glow border-[#ff0040]">
        <div className="text-[#ff0040]">ERROR: No pool data available</div>
      </div>
    );
  }

  const eth = parseFloat(ethAmount) || 0;

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ YIELD FARM PROJECTIONS ──────────────────────────────────────────┐
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00ff4140]">LIVE</span>
          <span className="text-xs text-[#00ff4160]">{lastUpdate}</span>
          <button onClick={fetchData} className="text-xs text-[#00ff4160] hover:text-[#00ff41]">
            REFRESH
          </button>
        </div>
      </div>

      {/* Real-Time Pool Data */}
      <div className="terminal-panel p-4 border border-[#00ff41] glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ REAL-TIME POOL DATA (The Graph)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-[#00ff4140]">HOOK APY</div>
            <div className="text-lg text-[#00ff41]">{data.hookAPY.toFixed(1)}%</div>
            <div className="text-xs text-[#00ff4140]">TVL: ${data.hookTVL.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-[#ff004060]">NATIVE APY</div>
            <div className="text-lg text-[#ff0040]">{data.nativeAPY.toFixed(1)}%</div>
            <div className="text-xs text-[#00ff4140]">TVL: ${data.nativeTVL.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-[#00ffff60]">VOLATILITY</div>
            <div className="text-lg text-[#00ffff]">{data.hookTxs + data.nativeTxs} txs</div>
            <div className="text-xs text-[#00ff4140]">24h activity</div>
          </div>
          <div>
            <div className="text-xs text-[#ffb00060]">SPREAD</div>
            <div className={`text-lg ${data.spreadAPY >= 0 ? 'text-[#00ff41]' : 'text-[#ff0040]'}`}>
              {data.spreadAPY >= 0 ? '+' : ''}{data.spreadAPY.toFixed(1)}%
            </div>
            <div className="text-xs text-[#00ff4140]">Hook vs Native</div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ INVESTMENT AMOUNT
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-2 text-sm w-full focus:outline-none focus:border-[#00ff41] glow"
              min="0.01"
              step="0.1"
            />
          </div>
          <div className="text-xs text-[#00ff4160]">ETH</div>
          <div className="flex gap-2">
            {[0.1, 0.5, 1, 5, 10, 50].map((amt) => (
              <button
                key={amt}
                onClick={() => setEthAmount(String(amt))}
                className={`px-3 py-1 text-xs ${
                  parseFloat(ethAmount) === amt
                    ? 'bg-[#00ff41] text-[#0a0a0a]'
                    : 'text-[#00ff4160] hover:text-[#00ff41] border border-[#00ff4130]'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5-Scenario Projection Table */}
      {projections.length > 0 && (
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ YIELD PROJECTIONS — {eth} ETH INVESTMENT
          </div>
          <div className="text-xs text-[#00ff4140] mb-3">
            Based on real-time data • Updated every 30s • Accounts for volume volatility
          </div>
          <div className="overflow-x-auto">
            <table className="terminal-table w-full">
              <thead>
                <tr className="text-[#00ff4150] text-xs">
                  <th className="text-left">SCENARIO</th>
                  <th>VOL</th>
                  <th>APY</th>
                  <th>DAILY</th>
                  <th>WEEKLY</th>
                  <th>MONTHLY</th>
                  <th>ANNUAL</th>
                  <th>IL</th>
                  <th>NET</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((p) => (
                  <tr key={p.scenario.name} className="border-t border-[#00ff4110]">
                    <td className="text-left">
                      <span style={{ color: p.scenario.color }} className="text-xs font-bold">
                        {p.scenario.label}
                      </span>
                    </td>
                    <td className="text-[#00ff4160]">{(p.scenario.volumeMultiplier * 100).toFixed(0)}%</td>
                    <td style={{ color: p.scenario.color }}>{p.apy.toFixed(1)}%</td>
                    <td className="text-[#00ff41]">{p.dailyFees.toFixed(6)}</td>
                    <td className="text-[#00ff41]">{p.weeklyFees.toFixed(4)}</td>
                    <td className="text-[#00ff41]">{p.monthlyFees.toFixed(4)}</td>
                    <td className="text-[#00ff41] glow">{p.annualFees.toFixed(2)}</td>
                    <td className="text-[#ff0040]">{p.impermanentLoss.toFixed(1)}%</td>
                    <td className={p.netReturn > 0 ? 'text-[#00ff41]' : 'text-[#ff0040]'}>
                      {p.netReturn > 0 ? '+' : ''}{p.netReturn.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Comparison */}
      {projections.length > 0 && (
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ ANNUAL RETURN COMPARISON (ETH)
          </div>
          <div className="space-y-3">
            {projections.map((p) => {
              const maxAnnual = Math.max(...projections.map((x) => x.annualFees), 1);
              const width = (p.annualFees / maxAnnual) * 100;
              return (
                <div key={p.scenario.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: p.scenario.color }}>{p.scenario.label}</span>
                    <span className="text-[#00ff41]">{p.annualFees.toFixed(4)} ETH</span>
                  </div>
                  <div className="h-4 bg-[#0a0a0a] border border-[#00ff4120]">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${width}%`,
                        backgroundColor: p.scenario.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Best/Worst Case Summary */}
      {projections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="terminal-panel p-4 border-glow border-[#ff0040]">
            <div className="text-xs text-[#ff004060] tracking-widest mb-2">WORST CASE (BEAR)</div>
            <div className="text-xl text-[#ff0040]">{projections[0].annualFees.toFixed(4)} ETH</div>
            <div className="text-xs text-[#00ff4140]">{projections[0].apy.toFixed(1)}% APY</div>
            <div className="text-xs text-[#ff004060] mt-1">IL: {projections[0].impermanentLoss.toFixed(1)}%</div>
          </div>
          <div className="terminal-panel p-4 border-glow border-[#00ff41]">
            <div className="text-xs text-[#00ff4160] tracking-widest mb-2">CURRENT (NORMAL)</div>
            <div className="text-xl text-[#00ff41]">{projections[2].annualFees.toFixed(4)} ETH</div>
            <div className="text-xs text-[#00ff4160]">{projections[2].apy.toFixed(1)}% APY</div>
            <div className="text-xs text-[#00ff4140] mt-1">IL: {projections[2].impermanentLoss.toFixed(1)}%</div>
          </div>
          <div className="terminal-panel p-4 border-glow border-[#ff00ff]">
            <div className="text-xs text-[#ff00ff60] tracking-widest mb-2">BEST CASE (BULL)</div>
            <div className="text-xl text-[#ff00ff]">{projections[4].annualFees.toFixed(4)} ETH</div>
            <div className="text-xs text-[#ff00ff60]">{projections[4].apy.toFixed(1)}% APY</div>
            <div className="text-xs text-[#00ff4140] mt-1">IL: {projections[4].impermanentLoss.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {projections.length > 0 && (
        <div className="terminal-panel p-4 border-glow border-[#ffb000]">
          <div className="text-xs text-[#ffb00060] mb-3 tracking-widest">
            ▸ VOLATILITY ANALYSIS
          </div>
          <div className="space-y-2 text-xs text-[#00ff4170]">
            <p>• <span className="text-[#ff0040]">Bear</span>: Volume drops 70% — worst case scenario</p>
            <p>• <span className="text-[#ffb000]">Calm</span>: Volume drops 30% — below average activity</p>
            <p>• <span className="text-[#00ff41]">Normal</span>: Current conditions — {data.hookTxs + data.nativeTxs} txs/24h</p>
            <p>• <span className="text-[#00ffff]">Hot</span>: Volume 1.8x — above average activity</p>
            <p>• <span className="text-[#ff00ff]">Bull</span>: Volume 3x — peak market activity</p>
            <p className="text-[#00ff4140]">• Projections update every 30 seconds with real-time data from The Graph</p>
            <p className="text-[#00ff4140]">• Impermanent loss increases with volatility (higher volume = more price movement)</p>
          </div>
        </div>
      )}

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}
