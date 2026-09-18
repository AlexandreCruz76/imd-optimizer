"use client";

import { useState, useEffect } from "react";

interface BurnEvent {
  id: string;
  block: number;
  txHash: string;
  ethSent: string;
  imdBurned: string;
  rewardClaimed: string;
  ethRetained: string;
  timestamp: string;
}

interface BurnStats {
  totalBurned: string;
  totalRewards: string;
  totalEthRetained: string;
  burnRate: string;
  capUtilization: number;
  currentCap: string;
  capFloor: string;
  decayPerDay: string;
  totalTrims: number;
  avgBurnPerTrim: string;
  avgRewardPerTrim: string;
  hookLiquidityShare: number;
  hookVolumeShare: number;
}

interface PoolState {
  ethInPool: string;
  imdInPool: string;
  price: string;
  tick: number;
  lpFee: string;
  rewardShareBps: number;
  backstopPrincipal: string;
  backstopConverted: string;
}

export default function Burns() {
  const [events, setEvents] = useState<BurnEvent[]>([]);
  const [stats, setStats] = useState<BurnStats | null>(null);
  const [poolState, setPoolState] = useState<PoolState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    fetchBurnData();
    const interval = setInterval(fetchBurnData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchBurnData() {
    try {
      const res = await fetch("/api/burns");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data.stats);
      setEvents(data.events);
      setPoolState(data.poolState);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
      setError(null);
    } catch (err) {
      setError("Failed to load burn data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#00ff4160]">
        <span className="cursor">█</span> Loading burn mechanics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal-panel p-4 border-glow border-[#ff0040]">
        <div className="text-[#ff0040]">ERROR: {error}</div>
        <button
          onClick={fetchBurnData}
          className="text-xs text-[#00ff4160] mt-2 hover:text-[#00ff41]"
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ BURN MECHANICS ─────────────────────────────────────────────────────┐
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00ff4140]">LIVE</span>
          <span className="text-xs text-[#00ff4160]">{lastUpdate}</span>
          <button
            onClick={fetchBurnData}
            className="text-xs text-[#00ff4160] hover:text-[#00ff41]"
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* Burn Statistics */}
      {stats && (
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ BURN STATISTICS (ON-CHAIN)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#00ff4140]">TOTAL BURNED</div>
              <div className="text-lg text-[#ff0040] glow">{stats.totalBurned} IMD</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">TOTAL REWARDS</div>
              <div className="text-lg text-[#00ff41] glow">{stats.totalRewards} IMD</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">ETH RETAINED</div>
              <div className="text-lg text-[#ffb000] glow">{stats.totalEthRetained} ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">BURN RATE</div>
              <div className="text-lg text-[#00ffff] glow">{stats.burnRate}</div>
            </div>
          </div>

          {/* Cap Progress */}
          <div className="mt-4 pt-3 border-t border-[#00ff4115]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#00ff4140]">CAP UTILIZATION</span>
              <span className="text-[#00ff41]">{stats.capUtilization.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill bg-[#ff0040]"
                style={{ width: `${stats.capUtilization}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-[#00ff4150]">FLOOR: {stats.capFloor} ETH</span>
              <span className="text-[#00ff4150]">CAP: {stats.currentCap} ETH</span>
              <span className="text-[#00ff4150]">DECAY: {stats.decayPerDay}/day</span>
            </div>
          </div>

          {/* Trim Stats */}
          <div className="mt-4 pt-3 border-t border-[#00ff4115]">
            <div className="text-xs text-[#00ff4160] mb-2 tracking-widest">
              ▸ TRIM SUMMARY (7 DAYS)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-[#00ff4140]">TOTAL TRIMS</div>
                <div className="text-[#00ff41]">{stats.totalTrims}</div>
              </div>
              <div>
                <div className="text-[#00ff4140]">AVG BURN/TRIM</div>
                <div className="text-[#ff0040]">{stats.avgBurnPerTrim} IMD</div>
              </div>
              <div>
                <div className="text-[#00ff4140]">AVG REWARD/TRIM</div>
                <div className="text-[#00ff41]">{stats.avgRewardPerTrim} IMD</div>
              </div>
              <div>
                <div className="text-[#00ff4140]">LIQ SHARE</div>
                <div className="text-[#00ffff]">{(stats.hookLiquidityShare * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pool State */}
      {poolState && (
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ POOL STATE
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#00ff4140]">ETH IN POOL</div>
              <div className="text-[#00ff41]">{poolState.ethInPool} ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">IMD IN POOL</div>
              <div className="text-[#ff0040]">{poolState.imdInPool} IMD</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">PRICE</div>
              <div className="text-[#00ffff]">{poolState.price} IMD/ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">LP FEE</div>
              <div className="text-[#ffb000]">{poolState.lpFee}%</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-3">
            <div>
              <div className="text-[#00ff4140]">TICK</div>
              <div className="text-[#00ff41]">{poolState.tick}</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">REWARD SHARE</div>
              <div className="text-[#00ff41]">{poolState.rewardShareBps / 100}%</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">BACKSTOP ETH</div>
              <div className="text-[#ffb000]">{poolState.backstopPrincipal} ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">CONVERTED ETH</div>
              <div className="text-[#00ffff]">{poolState.backstopConverted} ETH</div>
            </div>
          </div>
        </div>
      )}

      {/* Burn Events */}
      <div className="terminal-panel p-4 border-glow overflow-x-auto">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ BURN EVENTS (ON-CHAIN)
        </div>
        <table className="terminal-table">
          <thead>
            <tr className="text-[#00ff4150] text-xs">
              <th>BLOCK</th>
              <th>ETH SENT</th>
              <th>IMD BURNED</th>
              <th>REWARD</th>
              <th>ETH RETAINED</th>
              <th>TIME</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="fade-in">
                <td className="text-[#00ff4140]">{event.block}</td>
                <td className="text-[#00ff41]">{event.ethSent} ETH</td>
                <td className="text-[#ff0040]">{event.imdBurned} IMD</td>
                <td className="text-[#00ff41]">{event.rewardClaimed} IMD</td>
                <td className="text-[#ffb000]">{event.ethRetained} ETH</td>
                <td className="text-[#00ff4160]">
                  {new Date(event.timestamp).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How Burn Works */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ HOW BURN MECHANICS WORK
        </div>
        <div className="space-y-2 text-xs text-[#00ff4170]">
          <p>1. <span className="text-[#ff0040]">Swap Activity</span> — Users trade ETH ↔ IMD through the Hook pool</p>
          <p>2. <span className="text-[#ffb000]">Cap Trigger</span> — When inventory hits the cap, a Trim is triggered</p>
          <p>3. <span className="text-[#00ff41]">Burn</span> — Excess IMD is burned, reducing supply permanently</p>
          <p>4. <span className="text-[#00ffff]">Reward</span> — 15% of trim goes to reward pool for LP providers</p>
          <p>5. <span className="text-[#ffb000]">Retain</span> — ETH fees are retained in the contract for backstop</p>
          <p>6. <span className="text-[#00ff41]">Decay</span> — Cap decays over time, allowing controlled supply reduction</p>
        </div>
      </div>

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}
