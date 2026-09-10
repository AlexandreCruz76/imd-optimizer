"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./components/WalletProvider";

interface LpPosition {
  ethBalance: string;
  imdBalance: string;
  totalLiquidityEth: string;
  shareOfPool: string;
  feeEarned: string;
  entryPrice: string;
  currentPrice: string;
  pnl: string;
  pnlPercent: string;
}

interface PoolState {
  ethBalance: string;
  imdBalance: string;
  hookLiqETH: string;
  liquidityETH: string;
  liquidityIMD: string;
  price: string;
  lpFee: string;
  volume24h: string;
  hookVolume: string;
  nativeVolume: string;
  hookShare: string;
  volumeShare: string;
  nativeVolumeShare: string;
  burnsTotal: string;
  rewardsTotal: string;
  block: number;
  swaps24h: number;
  imdUsd: string | null;
  ethUsd: string | null;
  ethIn24h: string;
  ethOut24h: string;
  imdIn24h: string;
  imdOut24h: string;
  nativeLiqETH: string;
}

export default function Dashboard() {
  const { connected, address, chainId } = useWallet();
  const [state, setState] = useState<PoolState | null>(null);
  const [lpPosition, setLpPosition] = useState<LpPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [lpLoading, setLpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lpError, setLpError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (connected && address && chainId === 1) {
      fetchLpPosition();
    } else {
      setLpPosition(null);
    }
  }, [connected, address, chainId]);

  async function fetchData() {
    try {
      const res = await fetch("/api/pool-state");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setState(data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError("Failed to load pool data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLpPosition() {
    if (!address) return;
    setLpLoading(true);
    setLpError(null);
    try {
      const res = await fetch(`/api/user-lp?address=${address}`);
      if (!res.ok) throw new Error("Failed to fetch LP position");
      const data = await res.json();
      setLpPosition(data);
    } catch (err: any) {
      setLpError(err.message || "Failed to load LP position");
    } finally {
      setLpLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#00ff4160]">
        <span className="cursor">█</span> Connecting to mainnet...
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal-panel p-4 border-glow border-[#ff0040]">
        <div className="text-[#ff0040]">ERROR: {error}</div>
        <button onClick={fetchData} className="text-xs text-[#00ff4160] mt-2 hover:text-[#00ff41]">
          RETRY
        </button>
      </div>
    );
  }

  if (!state) return null;

  return (
    <div className="space-y-4 fade-in">
      {/* Wallet connection banner */}
      {!connected && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠️ Connect your wallet to see your LP position
          </div>
        </div>
      )}

      {connected && chainId !== 1 && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠️ Switch to Ethereum Mainnet to view your LP position | Network: {chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`}
          </div>
        </div>
      )}

      {connected && chainId === 1 && (
        <div className="terminal-panel p-3 border border-[#00ff41]">
          <div className="flex justify-between items-center">
            <div className="text-xs text-[#00ff41]">
              ✅ {address?.slice(0, 6)}...{address?.slice(-4)} │ MAINNET
            </div>
            <button onClick={fetchLpPosition} className="text-xs text-[#00ff4160] hover:text-[#00ff41]">
              REFRESH LP
            </button>
          </div>
        </div>
      )}

      {/* YOUR LP POSITION */}
      {connected && chainId === 1 && (
        <div className="terminal-panel p-4 border-glow border-[#00ff41]">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ YOUR LP POSITION ON HOOK POOL
          </div>
          {lpLoading && (
            <div className="text-xs text-[#ffb000]">Loading your position from chain...</div>
          )}
          {lpError && (
            <div className="text-xs text-[#ff0040]">{lpError}</div>
          )}
          {lpPosition && !lpLoading && (
            <div className="space-y-2">
              <Row label="YOUR ETH" value={`${lpPosition.ethBalance} ETH`} highlight />
              <Row label="YOUR IMD" value={`${lpPosition.imdBalance} IMD`} />
              <Row label="YOUR SHARE" value={`${lpPosition.shareOfPool}%`} color="#00ff41" />
              <Row label="ENTRY PRICE" value={`${lpPosition.entryPrice} IMD/ETH`} />
              <Row label="CURRENT PRICE" value={`${lpPosition.currentPrice} IMD/ETH`} />
              <div className="mt-3 pt-3 border-t border-[#00ff4115]">
                <Row label="P&L" value={`${lpPosition.pnl} ETH (${lpPosition.pnlPercent}%)`} color={parseFloat(lpPosition.pnl) >= 0 ? "#00ff41" : "#ff0040"} />
              </div>
            </div>
          )}
          {lpError && !lpPosition && !lpLoading && (
            <div className="text-xs text-[#00ff4150] mt-2">
              No LP position found for this wallet on the hook pool.
              <br />Deposit ETH via the Vault to create a position.
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ POOL STATE ─────────────────────────────────────────────────────────┐
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00ff4140]">BLK: {state.block}</span>
          <span className="text-xs text-[#00ff4140]">UPD: {lastUpdate}</span>
        </div>
      </div>

      {/* Price banner */}
      {state.price && (
        <div className="terminal-panel p-3 border-glow">
          <div className="flex flex-wrap gap-6 text-xs">
            <span>
              <span className="text-[#00ff4140]">IMD/ETH:</span>{" "}
              <span className="text-[#00ff41] glow">{parseFloat(state.price).toLocaleString()} IMD</span>
            </span>
            {state.imdUsd && (
              <span>
                <span className="text-[#00ff4140]">IMD USD:</span>{" "}
                <span className="text-[#00ff41]">${state.imdUsd}</span>
              </span>
            )}
            {state.ethUsd && (
              <span>
                <span className="text-[#00ff4140]">ETH USD:</span>{" "}
                <span className="text-[#00ff41]">${state.ethUsd}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Liquidity Panel */}
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ LIQUIDITY
          </div>
          <div className="space-y-2">
            <Row label="ETH" value={`${state.liquidityETH} ETH`} highlight />
            <Row label="IMD" value={`${state.liquidityIMD} IMD`} />
            <Row label="LP FEE" value={`${state.lpFee}%`} />
            <div className="mt-3">
              <div className="text-xs text-[#00ff4140] mb-1">HOOK vs NATIVE</div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(parseFloat(state.hookShare) * 3, 100)}%` }}
                />
              </div>
              <div className="text-xs text-[#00ff4150] mt-1">
                HOOK: {state.hookShare}% │ NATIVE: {(100 - parseFloat(state.hookShare)).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Volume Panel */}
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ 24H VOLUME
          </div>
          <div className="space-y-2">
            <Row label="HOOK" value={`${state.hookVolume} ETH`} highlight />
            <Row label="NATIVE" value={`${state.nativeVolume} ETH`} />
            <Row label="SWAPS" value={`${state.swaps24h}`} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[#00ff4140]">ETH IN</div>
                <div className="text-[#00ff41]">{state.ethIn24h || "0"} ETH</div>
              </div>
              <div>
                <div className="text-[#00ff4140]">ETH OUT</div>
                <div className="text-[#00ff41]">{state.ethOut24h || "0"} ETH</div>
              </div>
            </div>
          </div>
        </div>

        {/* Protocol Panel */}
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ PROTOCOL
          </div>
          <div className="space-y-2">
            <Row label="BURNS" value={`${state.burnsTotal} IMD`} />
            <Row label="REWARDS" value={`${state.rewardsTotal} IMD`} />
            <Row label="CAP" value="27,000 IMD" />
            <div className="mt-3">
              <div className="text-xs text-[#00ff4140] mb-1">CAP UTILIZATION</div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill bg-[#ffb000]"
                  style={{ width: `${(parseFloat(state.imdBalance.replace(",", "")) / 27000) * 100}%` }}
                />
              </div>
              <div className="text-xs text-[#00ff4150] mt-1">
                {state.imdBalance} / 27,000 IMD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>

      {/* Quick stats */}
      <div className="terminal-panel p-3 border-glow">
        <div className="flex flex-wrap gap-6 text-xs">
          <span>
            <span className="text-[#00ff4140]">HOOK TVL:</span>{" "}
            <span className="text-[#00ff41]">{state.hookLiqETH} ETH</span>
          </span>
          <span>
            <span className="text-[#00ff4140]">NATIVE TVL:</span>{" "}
            <span className="text-[#00ff41]">{state.nativeLiqETH} ETH</span>
          </span>
          <span>
            <span className="text-[#00ff4140]">VOL/LIQ:</span>{" "}
            <span className="text-[#00ff41]">
              {(parseFloat(state.volume24h) / parseFloat(state.hookLiqETH) * 100).toFixed(1)}%
            </span>
          </span>
          <span>
            <span className="text-[#00ff4140]">BURN RATE:</span>{" "}
            <span className="text-[#00ff41]">
              ~{(parseFloat(state.burnsTotal.replace(",", "")) / 2).toFixed(0)} IMD/day
            </span>
          </span>
        </div>
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
