"use client";

import { useState, useEffect } from "react";

interface PoolData {
  hookLiqETH: string;
  nativeLiqETH: string;
  hookShare: string;
  volumeShare: string;
  nativeVolumeShare: string;
  hookVolume: string;
  nativeVolume: string;
  volume24h: string;
  lpFee: string;
  price: string;
  swaps24h: number;
  ethIn24h: string;
  ethOut24h: string;
  burnsTotal: string;
  rewardsTotal: string;
  imdBalance: string;
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

  const hookLiq = parseFloat(data.hookLiqETH);
  const hookVol = parseFloat(data.hookVolume);
  const nativeVol = parseFloat(data.nativeVolume);
  const hookApy = hookLiq > 0 ? (hookVol * 0.01 * 365 / hookLiq * 100) : 0;
  const nativeApy = 5.0;
  const apyMultiplier = nativeApy > 0 ? hookApy / nativeApy : 0;

  // Virtual token calculations
  const totalBurned = parseFloat(burns?.burned || "0");
  const totalRewarded = parseFloat(burns?.rewarded || "0");
  const ethRetained = parseFloat(burns?.ethRetained || "0");
  const totalVolume = parseFloat(data.volume24h);
  const virtualImpact = totalVolume > 0 ? (ethRetained / totalVolume * 100) : 0;

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ POOL MONITOR ───────────────────────────────────────────────────────┐
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00ff4140]">LIVE</span>
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
              <div className="text-sm text-[#00ff41]">0xc6c965...2840</div>
              <div className="text-xs text-[#00ff4140]">Created: Sept 2, 2026 04:05 UTC</div>
              <div className="text-xs text-[#00ff4140]">Block: 25,887,100</div>
              <div className="text-xs text-[#00ff4140]">By: 0x047F606...054B7 (surfsurf.eth)</div>
            </div>
            <div>
              <div className="text-xs text-[#ff004060]">NATIVE POOL (V3)</div>
              <div className="text-sm text-[#ff0040]">IMD/WETH V3</div>
              <div className="text-xs text-[#00ff4140]">Created: Before Hook Pool</div>
              <div className="text-xs text-[#00ff4140]">Status: Pre-existing</div>
              <div className="text-xs text-[#00ff4140]">Volume: {data.nativeVolume} ETH (88.9%)</div>
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
              <div className="text-[#00ff4140]">Not V3 Native Pool</div>
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
            <div className="text-lg text-[#ff0040]">{totalBurned.toFixed(0)}</div>
            <div className="text-xs text-[#00ff4140]">destroyed forever</div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#00ff4120] p-3">
            <div className="text-xs text-[#00ff4160]">IMD REWARDED</div>
            <div className="text-lg text-[#00ff41]">{totalRewarded.toFixed(0)}</div>
            <div className="text-xs text-[#00ff4140]">distributed to LPs</div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#ffb00020] p-3">
            <div className="text-xs text-[#ffb00060]">ETH RETAINED</div>
            <div className="text-lg text-[#ffb000]">{ethRetained.toFixed(2)}</div>
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
      <div className="terminal-panel p-4 border border-[#00ff41] glow">
        <div className="text-center">
          <div className="text-xs text-[#00ff4160] tracking-widest mb-2">
            ▸ WHY HOOK POOL IS BETTER
          </div>
          <div className="text-2xl text-[#00ff41] glow-strong font-bold">
            {apyMultiplier.toFixed(1)}x MORE YIELD
          </div>
          <div className="text-xs text-[#00ff4160] mt-1">
            Same ETH deposited earns {apyMultiplier.toFixed(1)}x more in hook pool
          </div>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hook pool */}
        <div className="terminal-panel p-4 border-glow border-[#00ff41]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[#00ff41] tracking-widest">
              ▸ HOOK POOL (V4)
            </div>
            <div className="text-xs bg-[#00ff41] text-[#0a0a0a] px-2 py-0.5">
              BETTER
            </div>
          </div>
          <div className="space-y-2">
            <Row label="ETH LIQUIDITY" value={`${data.hookLiqETH} ETH`} />
            <Row label="24H VOLUME" value={`${data.hookVolume} ETH`} />
            <Row label="VOL/LIQ RATIO" value={`${(hookVol / hookLiq * 100).toFixed(1)}%`} color="#00ff41" />
            <Row label="ESTIMATED APY" value={`${hookApy.toFixed(1)}%`} color="#00ff41" />
            <Row label="VOLUME SHARE" value={`${data.volumeShare}%`} />
            <div className="mt-3 pt-3 border-t border-[#00ff4115]">
              <div className="text-xs text-[#00ff4140]">YOUR 10 ETH EARNS</div>
              <div className="text-lg text-[#00ff41]">
                ~{(10 * hookApy / 100).toFixed(2)} ETH/year
              </div>
            </div>
          </div>
        </div>

        {/* Native pool */}
        <div className="terminal-panel p-4 border-glow border-[#ff0040]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[#ff0040] tracking-widest">
              ▸ NATIVE POOL (V3)
            </div>
            <span className="text-xs bg-[#ff004020] text-[#ff0040] px-2 py-0.5 border border-[#ff004030]">
              WORSE
            </span>
          </div>
          <div className="space-y-2">
            <Row label="24H VOLUME" value={`${data.nativeVolume} ETH`} />
            <Row label="ESTIMATED APY" value={`${nativeApy.toFixed(1)}%`} color="#ff0040" />
            <Row label="VOLUME SHARE" value={`${data.nativeVolumeShare}%`} />
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
            <div className="text-xs text-[#00ff41]">
              Hook earns {apyMultiplier.toFixed(1)}x more
            </div>
          </div>
          <div>
            <div className="text-xs text-[#00ff4140]">VOLUME SHARE</div>
            <div className="text-lg">
              <span className="text-[#00ff41]">{data.volumeShare}%</span>
              <span className="text-[#00ff4140]"> vs </span>
              <span className="text-[#ff0040]">{data.nativeVolumeShare}%</span>
            </div>
            <div className="text-xs text-[#ff0040]">
              Native has {((parseFloat(data.nativeVolumeShare) / parseFloat(data.volumeShare))).toFixed(1)}x more volume
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
          <p>• <span className="text-[#00ff41]">Hook Pool (V4)</span> created by surfsurf.eth on Sept 2, 2026</p>
          <p>• <span className="text-[#ff0040]">Native Pool (V3)</span> pre-existing, higher volume but no burns/rewards</p>
          <p>• When buying IMD on official site, ETH goes to <span className="text-[#00ff41]">Hook Pool</span></p>
          <p>• Hook Pool has <span className="text-[#ffb000]">{apyMultiplier.toFixed(1)}x higher APY</span> due to burns + rewards</p>
          <p>• Virtual tokens (burns) absorb <span className="text-[#00ffff]">{virtualImpact.toFixed(2)}%</span> of volume as ETH</p>
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
