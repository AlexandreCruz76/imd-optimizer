"use client";

import { useState, useEffect } from "react";

interface PoolData {
  hookTVL: string;
  nativeTVL: string;
  hookVolumeUSD: string;
  nativeVolumeUSD: string;
  hookFeesUSD: string;
  nativeFeesUSD: string;
  hookTxs24h: number;
  nativeTxs24h: number;
  hookAPY: string;
  nativeAPY: string;
  spreadAPY: string;
  hookTVLratio: string;
  hookVolRatio: string;
  nativePair: string;
  hookPair: string;
  hookFeeTier: string;
  nativeFeeTier: string;
  lpFee: string;
  price: string;
  imdUsd: string;
  ethUsd: string;
  swaps24h: number;
  burnsTotal: string;
  rewardsTotal: string;
  imdBalance: string;
  ethBalance: string;
  timestamp: string;
}

interface BurnData {
  totalTrims: number;
  burned: string;
  rewarded: string;
  ethRetained: string;
  avgBurnPerTrim: string;
  avgRewardPerTrim: string;
}

export default function Monitor() {
  const [data, setData] = useState<PoolData | null>(null);
  const [burns, setBurns] = useState<BurnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [poolRes, burnsRes] = await Promise.all([
        fetch("/api/pool-state"),
        fetch("/api/fees"),
      ]);

      if (!poolRes.ok) throw new Error("Failed to fetch pool data");
      const poolData = await poolRes.json();
      setData(poolData);
      setLastUpdate(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));

      if (burnsRes.ok) {
        const feesData = await burnsRes.json();
        setBurns({
          totalTrims: feesData.totalTrims || 0,
          burned: feesData.totalBurned || "0",
          rewarded: feesData.totalRewarded || "0",
          ethRetained: feesData.ethRetained || "0",
          avgBurnPerTrim: feesData.avgBurnPerTrim || "0",
          avgRewardPerTrim: feesData.avgRewardPerTrim || "0",
        });
      }

      setError(null);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#00ff4160]">
        <span className="cursor">█</span> Loading monitor...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="terminal-panel p-4 border-glow border-[#ff0040]">
        <div className="text-[#ff0040]">ERROR: {error || "No data"}</div>
        <button onClick={fetchData} className="text-xs text-[#00ff4160] mt-2 hover:text-[#00ff41]">
          RETRY
        </button>
      </div>
    );
  }

  const hookTVL = parseFloat(data.hookTVL);
  const nativeTVL = parseFloat(data.nativeTVL);
  const hookVol = parseFloat(data.hookVolumeUSD);
  const nativeVol = parseFloat(data.nativeVolumeUSD);
  const hookApy = parseFloat(data.hookAPY) || 0;
  const nativeApy = parseFloat(data.nativeAPY) || 0;
  const spreadApy = parseFloat(data.spreadAPY) || 0;
  const hookTVLratio = parseFloat(data.hookTVLratio) || 0;
  const hookVolRatio = parseFloat(data.hookVolRatio) || 0;
  const hasNativeData = nativeVol > 0;
  const hookWins = hookApy > nativeApy;
  const apyRatio = nativeApy > 0 ? (hookApy / nativeApy) : 0;

  // Virtual token calculations
  const totalBurned = parseFloat(data.burnsTotal || "0");
  const totalRewarded = parseFloat(data.rewardsTotal || "0");
  const ethRetained = hookVol > 0 ? (hookVol * 0.01) : 0;
  const virtualImpact = (ethRetained / hookVol * 100) || 0;

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ POOL MONITOR ───────────────────────────────────────────────────────┐
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00ff4140]">LIVE</span>
          {lastUpdate && (
            <span className="text-xs text-[#00ff4160]">
              {lastUpdate}
            </span>
          )}
          <button onClick={fetchData} className="text-xs text-[#00ff4160] hover:text-[#00ff41]">
            REFRESH
          </button>
        </div>
      </div>

      {/* KEY INSIGHT: Pool Creation */}
      <div className="terminal-panel p-4 border border-[#00ff41] glow">
        <div className="text-center">
          <div className="text-xs text-[#00ff4160] tracking-widest mb-2">
            ▸ POOL CREATION
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <div className="text-xs text-[#00ff4160]">HOOK POOL (V4)</div>
              <div className="text-sm text-[#00ff41]">{data.hookPair}</div>
              <div className="text-xs text-[#00ff4140]">Fee: {(Number(data.hookFeeTier)/10000).toFixed(1)}%</div>
              <div className="text-xs text-[#00ff4140]">TVL: ${Number(data.hookTVL).toLocaleString()}</div>
              <div className="text-xs text-[#00ff4140]">24h Vol: ${Number(data.hookVolumeUSD).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-[#00ff4160]">NATIVE POOL (V4)</div>
              <div className="text-sm text-[#ff0040]">{data.nativePair}</div>
              <div className="text-xs text-[#00ff4140]">Fee: {(Number(data.nativeFeeTier)/10000).toFixed(1)}%</div>
              <div className="text-xs text-[#00ff4140]">TVL: ${Number(data.nativeTVL).toLocaleString()}</div>
              <div className="text-xs text-[#00ff4140]">24h Vol: ${Number(data.nativeVolumeUSD).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW BUYING WORKS */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ HOW BUYING IMD WORKS
        </div>
        <div className="space-y-3">
          <div className="bg-[#0a0a0a] border border-[#00ff4120] p-3">
            <div className="text-xs text-[#00ff41] mb-2">WHEN YOU BUY IMD ON THE OFFICIAL SITE:</div>
            <div className="text-xs text-[#00ff4170] space-y-1">
              <p>1. You send ETH to the Hook Pool contract</p>
              <p>2. Hook Pool processes the swap via Uniswap V4</p>
              <p>3. IMD tokens are transferred to your wallet</p>
              <p>4. <span className="text-[#ffb000]">The ETH stays in the Hook Pool</span> (adds liquidity)</p>
              <p>5. <span className="text-[#00ff41]">Burn mechanism activates</span> on large swaps</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border border-[#00ff4120] p-3">
              <div className="text-[#00ff4160]">ETH FLOWS TO:</div>
              <div className="text-[#00ff41]">Hook Pool (V4)</div>
              <div className="text-[#00ff4140]">Burn + Reward mechanism active</div>
            </div>
            <div className="border border-[#ffb00020] p-3">
              <div className="text-[#ffb00060]">WHY HOOK POOL?</div>
              <div className="text-[#ffb000]">Burn + Reward mechanism</div>
              <div className="text-[#00ff4140]">CappedBurnHook active</div>
            </div>
          </div>
        </div>
      </div>

      {/* VIRTUAL TOKENS IMPACT */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ VIRTUAL TOKENS (BURNS & REWARDS) - 24H
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0a0a0a] border border-[#ff004020] p-3">
            <div className="text-xs text-[#ff004060]">IMD BURNED</div>
            <div className="text-lg text-[#ff0040]">{totalBurned.toLocaleString()}</div>
            <div className="text-xs text-[#00ff4140]">destroyed forever</div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#00ff4120] p-3">
            <div className="text-xs text-[#00ff4160]">IMD REWARDED</div>
            <div className="text-lg text-[#00ff41]">{totalRewarded.toLocaleString()}</div>
            <div className="text-xs text-[#00ff4140]">distributed to LPs</div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#ffb00020] p-3">
            <div className="text-xs text-[#ffb00060]">ETH RETAINED</div>
            <div className="text-lg text-[#ffb000]">${(ethRetained * parseFloat(data.ethUsd || "2500")).toFixed(0)}</div>
            <div className="text-xs text-[#00ff4140]">absorbed by burns</div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#00ffff20] p-3">
            <div className="text-xs text-[#00ffff60]">VIRTUAL IMPACT</div>
            <div className="text-lg text-[#00ffff]">{virtualImpact.toFixed(2)}%</div>
            <div className="text-xs text-[#00ff4140]">of total volume</div>
          </div>
        </div>
      </div>

      {/* KEY INSIGHT */}
      <div className={`terminal-panel p-4 border glow ${hookWins ? 'border-[#00ff41]' : 'border-[#ff0040]'}`}>
        <div className="text-center">
          <div className="text-xs text-[#00ff4160] tracking-widest mb-2">
            ▸ APY COMPARISON
          </div>
          <div className={`text-2xl glow-strong font-bold ${hookWins ? 'text-[#00ff41]' : 'text-[#ff0040]'}`}>
            {hookWins 
              ? `HOOK WINS: +${spreadApy.toFixed(1)}% APY`
              : `NATIVE WINS: +${Math.abs(spreadApy).toFixed(1)}% APY`}
          </div>
          <div className="text-xs text-[#00ff4160] mt-1">
            {hookWins 
              ? `Hook pool (${hookApy.toFixed(1)}%) beats Native (${nativeApy.toFixed(1)}%)`
              : `Native pool (${nativeApy.toFixed(1)}%) beats Hook (${hookApy.toFixed(1)}%)`}
          </div>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hook pool */}
        <div className={`terminal-panel p-4 border-glow ${hookWins ? 'border-[#00ff41]' : 'border-[#00ff4130]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[#00ff41] tracking-widest">
              ▸ HOOK POOL (V4)
            </div>
            <div className={`text-xs px-2 py-0.5 ${hookWins ? 'bg-[#00ff41] text-[#0a0a0a]' : 'bg-[#ff004020] text-[#ff0040] border border-[#ff004030]'}`}>
              {hookWins ? 'BETTER' : 'WORSE'}
            </div>
          </div>
          <div className="space-y-2">
            <Row label="TVL" value={`$${Number(data.hookTVL).toLocaleString()}`} />
            <Row label="24H VOLUME" value={`$${Number(data.hookVolumeUSD).toLocaleString()}`} />
            <Row label="24H FEES" value={`$${Number(data.hookFeesUSD).toFixed(2)}`} />
            <Row label="24H TXS" value={String(data.hookTxs24h)} />
            <Row label="APY" value={`${data.hookAPY}%`} color="#00ff41" />
            <Row label="FEE TIER" value={`${(Number(data.hookFeeTier)/10000).toFixed(1)}%`} />
            <div className="mt-3 pt-3 border-t border-[#00ff4115]">
              <div className="text-xs text-[#00ff4140]">YOUR 10 ETH EARNS</div>
              <div className="text-lg text-[#00ff41]">
                ~{(10 * hookApy / 100).toFixed(2)} ETH/year
              </div>
            </div>
          </div>
        </div>

        {/* Native pool */}
        <div className={`terminal-panel p-4 border-glow ${!hookWins ? 'border-[#ff0040]' : 'border-[#ff004030]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[#ff0040] tracking-widest">
              ▸ NATIVE POOL (V4)
            </div>
            <span className={`text-xs px-2 py-0.5 ${!hookWins ? 'bg-[#ff0040] text-[#fff]' : 'bg-[#ff004020] text-[#ff0040] border border-[#ff004030]'}`}>
              {!hookWins ? 'BETTER' : 'WORSE'}
            </span>
          </div>
          <div className="space-y-2">
            <Row label="TVL" value={`$${Number(data.nativeTVL).toLocaleString()}`} />
            <Row label="24H VOLUME" value={`$${Number(data.nativeVolumeUSD).toLocaleString()}`} />
            <Row label="24H FEES" value={`$${Number(data.nativeFeesUSD).toFixed(2)}`} />
            <Row label="24H TXS" value={String(data.nativeTxs24h)} />
            <Row label="APY" value={`${data.nativeAPY}%`} color="#ff0040" />
            <Row label="FEE TIER" value={`${(Number(data.nativeFeeTier)/10000).toFixed(1)}%`} />
            <div className="mt-3 pt-3 border-t border-[#ff004015]">
              <div className="text-xs text-[#ff004060]">YOUR 10 ETH EARNS</div>
              <div className="text-lg text-[#ff0040]">
                ~{(10 * nativeApy / 100).toFixed(2)} ETH/year
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Efficiency comparison */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ EFFICIENCY ANALYSIS
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-[#00ff4140]">APY COMPARISON</div>
            <div className="text-lg">
              <span className="text-[#00ff41]">{hookApy.toFixed(1)}%</span>
              <span className="text-[#00ff4140]"> vs </span>
              <span className="text-[#ff0040]">{nativeApy.toFixed(1)}%</span>
            </div>
            <div className={`text-xs ${hookWins ? 'text-[#00ff41]' : 'text-[#ff0040]'}`}>
              {hookWins 
                ? `Hook earns ${(hookApy / nativeApy).toFixed(2)}x more`
                : `Native earns ${(nativeApy / hookApy).toFixed(2)}x more`}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#00ff4140]">SPREAD</div>
            <div className="text-lg">
              <span className={hookWins ? 'text-[#00ff41]' : 'text-[#ff0040]'}>
                {spreadApy >= 0 ? '+' : ''}{spreadApy.toFixed(1)}%
              </span>
            </div>
            <div className={`text-xs ${hookWins ? 'text-[#00ff4160]' : 'text-[#ff004060]'}`}>
              {hookWins ? 'Hook pool advantage' : 'Native pool advantage'}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ SUMMARY
        </div>
        <div className="space-y-2 text-xs text-[#00ff4170]">
          <p>• <span className="text-[#00ff41]">Hook Pool (V4)</span> TVL: ${Number(data.hookTVL).toLocaleString()} | APY: {data.hookAPY}%</p>
          <p>• <span className="text-[#ff0040]">Native Pool (V4)</span> TVL: ${Number(data.nativeTVL).toLocaleString()} | APY: {data.nativeAPY}%</p>
          <p>• {hookWins 
            ? <span>Hook Pool has <span className="text-[#00ff41]">+{spreadApy.toFixed(1)}% higher APY</span> due to burn + reward mechanism</span>
            : <span>Native Pool has <span className="text-[#ff0040]">+{Math.abs(spreadApy).toFixed(1)}% higher APY</span> — higher volume drives better returns</span>}
          </p>
          <p>• Virtual tokens (burns) absorb <span className="text-[#00ffff]">{virtualImpact.toFixed(2)}%</span> of volume as ETH</p>
          <p>• Real-time data powered by The Graph V4 subgraph</p>
          <p className="text-[#00ff4130]">• Last Graph sync: {data.timestamp ? new Date(data.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A"}</p>
        </div>
      </div>

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[#00ff4150]">{label}</span>
      <span
        className={highlight ? "glow" : ""}
        style={{ color: color || "#00ff41" }}
      >
        {value}
      </span>
    </div>
  );
}
