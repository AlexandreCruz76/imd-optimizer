"use client";

import { useState, useEffect } from "react";
import { LiquidityAllocation } from "../components/LiquidityAllocation";

interface ArbitrageData {
  current: {
    timestamp: string;
    hookAPY: number;
    nativeAPY: number;
    spread: number;
    winner: "hook" | "native";
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
  };
  stats: {
    snapshotsCollected: number;
    avgSpread: string;
    maxSpread: string;
    minSpread: string;
    hookWins: number;
    nativeWins: number;
    hookWinRate: string;
    nativeWinRate: string;
  };
  simulation: {
    investmentETH: number;
    hookEarningsETH: string;
    nativeEarningsETH: string;
    arbitrageEarningsETH: string;
    arbitrageGainVsHookPct: string;
    arbitrageGainVsNativePct: string;
  };
  recommendation: {
    migrationNeeded: boolean;
    recommendedPool: string;
    spreadThreshold: number;
    currentSpread: string;
    reasoning: string;
  };
  history: Array<{
    timestamp: string;
    hookAPY: number;
    nativeAPY: number;
    spread: number;
    winner: string;
  }>;
}

export default function Arbitrage() {
  const [data, setData] = useState<ArbitrageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investment, setInvestment] = useState(10);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/arbitrage");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError("Failed to load arbitrage data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#00ff4160]">
        <span className="cursor">█</span> Loading arbitrage engine...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="terminal-panel p-4 border-glow border-[#ff0040]">
        <div className="text-[#ff0040]">ERROR: {error || "No data"}</div>
        <button
          onClick={fetchData}
          className="text-xs text-[#00ff4160] mt-2 hover:text-[#00ff41]"
        >
          RETRY
        </button>
      </div>
    );
  }

  const { current, stats, simulation, recommendation, history } = data;
  const isHookWinner = current.winner === "hook";
  const hookWinsPct = parseFloat(stats.hookWinRate);
  const nativeWinsPct = parseFloat(stats.nativeWinRate);

  // Pool state for allocation component
  const poolState = {
    ethInPool: ((current.hookTVL + current.nativeTVL) / 3000).toFixed(2), // Rough ETH estimate
    imdInPool: "0",
    price: (current.hookTVL / Math.max(current.nativeTVL, 1)).toFixed(2),
  };

  // Recalculate simulation for custom investment
  const customSimulation = {
    hook: (investment * current.hookAPY / 100).toFixed(2),
    native: (investment * current.nativeAPY / 100).toFixed(2),
    arbitrage: (investment * Math.max(current.hookAPY, current.nativeAPY) / 100).toFixed(2),
  };

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ YIELD ARBITRAGE ENGINE ─────────────────────────────────────────┐
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00ff4140]">LIVE</span>
          <span className="text-xs text-[#00ff4160]">
            {new Date(current.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </span>
          <button
            onClick={fetchData}
            className="text-xs text-[#00ff4160] hover:text-[#00ff41]"
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* CURRENT STATE - Big Display */}
      <div className={`terminal-panel p-6 border glow ${isHookWinner ? 'border-[#00ff41]' : 'border-[#ff0040]'}`}>
        <div className="text-center">
          <div className="text-xs text-[#00ff4160] tracking-widest mb-3">
            ▸ CURRENT WINNER
          </div>
          <div className={`text-4xl glow-strong font-bold mb-2 ${isHookWinner ? 'text-[#00ff41]' : 'text-[#ff0040]'}`}>
            {isHookWinner ? "HOOK POOL" : "NATIVE POOL"}
          </div>
          <div className="text-lg text-[#00ff4160]">
            {isHookWinner ? current.hookAPY.toFixed(1) : current.nativeAPY.toFixed(1)}% APY
            <span className="text-[#00ff4140]"> vs </span>
            {!isHookWinner ? current.hookAPY.toFixed(1) : current.nativeAPY.toFixed(1)}%
          </div>
          <div className={`text-sm mt-2 ${Math.abs(current.spread) > recommendation.spreadThreshold ? 'text-[#ffb000]' : 'text-[#00ff4140]'}`}>
            Spread: {current.spread >= 0 ? '+' : ''}{current.spread.toFixed(1)}%
            {recommendation.migrationNeeded && (
              <span className="text-[#ff0040] ml-2">
                ← MIGRATE NOW!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RECOMMENDATION */}
      <div className={`terminal-panel p-4 border-glow ${recommendation.recommendedPool === 'hold' ? 'border-[#00ff4130]' : 'border-[#ffb000]'}`}>
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ ARBITRAGE RECOMMENDATION
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-[#00ff4140]">ACTION</div>
            <div className={`text-lg font-bold ${
              recommendation.recommendedPool === 'hook' ? 'text-[#00ff41]' :
              recommendation.recommendedPool === 'native' ? 'text-[#ff0040]' :
              'text-[#00ff4160]'
            }`}>
              {recommendation.recommendedPool === 'hook' ? 'MIGRATE → HOOK' :
               recommendation.recommendedPool === 'native' ? 'MIGRATE → NATIVE' :
               'HOLD POSITION'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#00ff4140]">SPREAD</div>
            <div className={`text-lg font-bold ${
              Math.abs(current.spread) > recommendation.spreadThreshold ? 'text-[#ffb000]' : 'text-[#00ff4160]'
            }`}>
              {Math.abs(current.spread).toFixed(1)}%
            </div>
            <div className="text-xs text-[#00ff4140]">threshold: {recommendation.spreadThreshold}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#00ff4140]">REASONING</div>
            <div className="text-xs text-[#00ff4170] mt-1">
              {recommendation.reasoning}
            </div>
          </div>
        </div>
      </div>

      {/* DUAL POOL COMPARISON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hook Pool */}
        <div className={`terminal-panel p-4 border-glow ${isHookWinner ? 'border-[#00ff41]' : 'border-[#00ff4130]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[#00ff41] tracking-widest">
              ▸ HOOK POOL (V4)
            </div>
            {isHookWinner && (
              <div className="text-xs bg-[#00ff41] text-[#0a0a0a] px-2 py-0.5">
                WINNING
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Row label="APY" value={`${current.hookAPY.toFixed(1)}%`} color="#00ff41" />
            <Row label="TVL" value={`$${current.hookTVL.toLocaleString()}`} />
            <Row label="24H VOLUME" value={`$${current.hookVol24h.toLocaleString()}`} />
            <Row label="24H FEES" value={`$${current.hookFees24h.toFixed(2)}`} />
            <Row label="24H TXS" value={String(current.hookTxs)} />
            <Row label="FEE TIER" value={`${(current.hookFeeTier / 10000).toFixed(1)}%`} />
            <div className="mt-3 pt-3 border-t border-[#00ff4115]">
              <div className="text-xs text-[#00ff4140]">{investment} ETH EARNS</div>
              <div className="text-lg text-[#00ff41]">
                ~{customSimulation.hook} ETH/year
              </div>
            </div>
          </div>
        </div>

        {/* Native Pool */}
        <div className={`terminal-panel p-4 border-glow ${!isHookWinner ? 'border-[#ff0040]' : 'border-[#ff004030]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[#ff0040] tracking-widest">
              ▸ NATIVE POOL (V4)
            </div>
            {!isHookWinner && (
              <div className="text-xs bg-[#ff0040] text-[#fff] px-2 py-0.5">
                WINNING
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Row label="APY" value={`${current.nativeAPY.toFixed(1)}%`} color="#ff0040" />
            <Row label="TVL" value={`$${current.nativeTVL.toLocaleString()}`} />
            <Row label="24H VOLUME" value={`$${current.nativeVol24h.toLocaleString()}`} />
            <Row label="24H FEES" value={`$${current.nativeFees24h.toFixed(2)}`} />
            <Row label="24H TXS" value={String(current.nativeTxs)} />
            <Row label="FEE TIER" value={`${(current.nativeFeeTier / 10000).toFixed(1)}%`} />
            <div className="mt-3 pt-3 border-t border-[#ff004015]">
              <div className="text-xs text-[#ff004060]">{investment} ETH EARNS</div>
              <div className="text-lg text-[#ff0040]">
                ~{customSimulation.native} ETH/year
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SPREAD VISUALIZATION */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ SPREAD HISTORY (Last {history.length} snapshots)
        </div>
        <div className="h-32 flex items-end gap-0.5">
          {history.slice(-60).map((s, i) => {
            const maxAbs = Math.max(...history.slice(-60).map(h => Math.abs(h.spread)), 1);
            const height = Math.abs(s.spread) / maxAbs * 100;
            const isPositive = s.spread >= 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end"
                title={`${new Date(s.timestamp).toLocaleTimeString()} | Hook: ${s.hookAPY.toFixed(1)}% | Native: ${s.nativeAPY.toFixed(1)}% | Spread: ${s.spread.toFixed(1)}%`}
              >
                <div
                  className={`w-full min-h-[2px] ${isPositive ? 'bg-[#00ff41]' : 'bg-[#ff0040]'}`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#00ff4140]">
          <span>← {history.length > 0 ? new Date(history[Math.max(0, history.length - 60)]?.timestamp || '').toLocaleTimeString() : ''}</span>
          <span>🟢 = Hook wins | 🔴 = Native wins</span>
          <span>{history.length > 0 ? new Date(history[history.length - 1]?.timestamp || '').toLocaleTimeString() : ''} →</span>
        </div>
      </div>

      {/* INVESTMENT SIMULATOR */}
      <div className="terminal-panel p-4 border-glow border-[#00ffff]">
        <div className="text-xs text-[#00ffff60] mb-3 tracking-widest">
          ▸ INVESTMENT SIMULATOR
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-xs text-[#00ff4160]">INVESTMENT:</div>
          <div className="flex items-center gap-2">
            {[1, 5, 10, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => setInvestment(amt)}
                className={`px-3 py-1 text-xs ${
                  investment === amt
                    ? 'bg-[#00ffff] text-[#0a0a0a]'
                    : 'text-[#00ffff60] hover:text-[#00ffff] border border-[#00ffff30]'
                }`}
              >
                {amt} ETH
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="border border-[#00ff4120] p-3">
            <div className="text-xs text-[#00ff4160]">HOOK ONLY</div>
            <div className="text-lg text-[#00ff41]">{customSimulation.hook} ETH</div>
            <div className="text-xs text-[#00ff4140]">{current.hookAPY.toFixed(1)}% APY</div>
          </div>
          <div className="border border-[#ff004020] p-3">
            <div className="text-xs text-[#ff004060]">NATIVE ONLY</div>
            <div className="text-lg text-[#ff0040]">{customSimulation.native} ETH</div>
            <div className="text-xs text-[#00ff4140]">{current.nativeAPY.toFixed(1)}% APY</div>
          </div>
          <div className="border border-[#00ffff20] p-3">
            <div className="text-xs text-[#00ffff60]">ARBITRAGE</div>
            <div className="text-lg text-[#00ffff]">{customSimulation.arbitrage} ETH</div>
            <div className="text-xs text-[#00ffff60]">{Math.max(current.hookAPY, current.nativeAPY).toFixed(1)}% APY</div>
          </div>
        </div>
        <div className="text-center mt-3 text-xs text-[#00ff4160]">
          Arbitrage earns <span className="text-[#00ffff]">
            {investment > 0 ? ((parseFloat(customSimulation.arbitrage) - parseFloat(customSimulation.hook)) / parseFloat(customSimulation.hook) * 100).toFixed(1) : 0}%
          </span> more than Hook-only
        </div>
      </div>

      {/* STATISTICS */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ STATISTICS ({stats.snapshotsCollected} snapshots)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs text-[#00ff4140]">AVG SPREAD</div>
            <div className="text-lg text-[#00ffff]">{stats.avgSpread}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#00ff4140]">MAX SPREAD</div>
            <div className="text-lg text-[#00ff41]">+{stats.maxSpread}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#00ff4140]">MIN SPREAD</div>
            <div className="text-lg text-[#ff0040]">{stats.minSpread}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#00ff4140]">WIN RATE</div>
            <div className="text-sm">
              <span className="text-[#00ff41]">H:{stats.hookWinRate}%</span>
              <span className="text-[#00ff4140]"> / </span>
              <span className="text-[#ff0040]">N:{stats.nativeWinRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ HOW YIELD ARBITRAGE WORKS
        </div>
        <div className="space-y-2 text-xs text-[#00ff4170]">
          <p>1. <span className="text-[#00ffff]">Monitor</span> both pool APYs in real-time via The Graph</p>
          <p>2. <span className="text-[#00ffff]">Compare</span> Hook vs Native APY — identify the winner</p>
          <p>3. <span className="text-[#00ffff]">Threshold</span>: migrate only when spread &gt; {recommendation.spreadThreshold}% (covers gas costs)</p>
          <p>4. <span className="text-[#00ffff]">Execute</span>: move liquidity to the higher-APY pool</p>
          <p>5. <span className="text-[#00ffff]">Repeat</span>: continuously capture the best yield available</p>
          <p className="text-[#00ff4140]">• Hook Pool wins when burn activity is high (burns + rewards boost APY)</p>
          <p className="text-[#00ff4140]">• Native Pool wins when trading volume is high (more fees = higher APY)</p>
        </div>
      </div>

      {/* LIQUIDITY ALLOCATION */}
      <LiquidityAllocation poolState={poolState} />

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[#00ff4150]">{label}</span>
      <span style={{ color: color || "#00ff41" }}>{value}</span>
    </div>
  );
}
