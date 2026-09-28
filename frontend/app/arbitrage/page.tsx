"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";
import { PoolPairIcon } from "../components/PoolIcons";

export default function ArbitragePage() {
  const { connected, address } = useWallet();
  const [nativeYield, setNativeYield] = useState("0.00");
  const [hookYield, setHookYield] = useState("0.00");
  const [nativeVolume, setNativeVolume] = useState("0.00");
  const [hookVolume, setHookVolume] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (connected) {
      interval = setInterval(() => {
        const nYield = (parseFloat(nativeYield) + Math.random() * 0.05).toFixed(2);
        const hYield = (parseFloat(hookYield) + Math.random() * 0.08).toFixed(2);
        const nVol = (parseFloat(nativeVolume) + Math.random() * 0.2).toFixed(2);
        const hVol = (parseFloat(hookVolume) + Math.random() * 0.3).toFixed(2);

        setNativeYield(nYield);
        setHookYield(hYield);
        setNativeVolume(nVol);
        setHookVolume(hVol);
      }, 1000);

      return () => clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [connected]);

  async function handleCompare() {
    if (!connected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/arbitrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();

      if (data.nativeYield) {
        setNativeYield(data.nativeYield);
        setHookYield(data.hookYield);
        setNativeVolume(data.nativeVolume);
        setHookVolume(data.hookVolume);
      } else {
        setError(data.error || "Comparison failed");
      }
    } catch (err: any) {
      setError(err.message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  const yieldDiff = parseFloat(hookYield) - parseFloat(nativeYield);
  const betterPool = yieldDiff > 0 ? "Hook Pool" : "Native Pool";
  const isHookBetter = yieldDiff > 0;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tick">Yield Comparator</h1>
            <p className="text-[var(--color-muted)] mt-1">Native Pool vs Hook Pool performance</p>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Native Pool Card */}
          <div className="glass-card p-6 rounded-3xl border border-[#00FF5820] border-opacity-50 bg-[#0A0E14] shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#0D0F14] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00FF41]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-[#00FF4160] tracking-wider">Native Pool (V4)</div>
                <div className="text-xl font-bold text-[#00FF41]">$ {nativeYield} ETH/hr</div>
              </div>
            </div>
            <div className="progress-bar h-2 rounded-full mb-4">
              <div
                className="progress-bar-fill"
                style={{ width: `${(parseFloat(nativeYield) / 0.5) * 100}%` }}
                role="progressbar"
                aria-valuenow={parseFloat(nativeYield)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="text-xs text-[#00FF4160]">Volume: {nativeVolume} ETH</div>
            <div className="text-xs text-[#00FF4160] mt-1">LP Share: 0.3%</div>
          </div>

          {/* Hook Pool Card */}
          <div className="glass-card p-6 rounded-3xl border border-[#00F58C] border-opacity-80 bg-[#0A0E14] shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#0D0F14] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00F58C]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-[#00F58C60] tracking-wider">Hook Pool (V4)</div>
                <div className="text-xl font-bold text-[#00F58C]">$ {hookYield} ETH/hr</div>
              </div>
            </div>
            <div className="progress-bar h-2 rounded-full mb-4">
              <div
                className="progress-bar-fill"
                style={{ width: `${(parseFloat(hookYield) / 0.8) * 100}%` }}
                role="progressbar"
                aria-valuenow={parseFloat(hookYield)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="text-xs text-[#00F58C60]">Volume: {hookVolume} ETH</div>
            <div className="text-xs text-[#00F58C60] mt-1">LP Share: 0.5% + MEV</div>
          </div>
        </div>

        {/* Result Badge */}
        {isHookBetter ? (
          <div className="mb-8 p-6 rounded-3xl bg-[#00F58C10] border border-[#00F58C]/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F58C] to-[#00A35F] flex items-center justify-center text-[#0a0a0a] font-bold">
                ↑
              </div>
              <div>
                <div className="text-sm text-[#00F58C60] tracking-wider">Better Yield</div>
                <div className="text-xl font-bold text-[#00F58C]">
                  {betterPool} earns {Math.abs(yieldDiff).toFixed(2)} ETH/hr more
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-6 rounded-3xl bg-[#00FF5820] border border-[#00FF58]/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF41] to-[#00A35F] flex items-center justify-center text-[#0a0a0a] font-bold">
                ↓
              </div>
              <div>
                <div className="text-sm text-[#00FF4160] tracking-wider">Better Yield</div>
                <div className="text-xl font-bold text-[#00FF41]">
                  {betterPool} earns {Math.abs(yieldDiff).toFixed(2)} ETH/hr more
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Arbitrage Strategy */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <h2 className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest">Arbitrage Strategy</h2>
          <div className="space-y-3 text-sm text-[#00ff4160]">
            <div>1. Monitor price discrepancies between Native and Hook pools</div>
            <div>2. Execute flash swap across pools</div>
            <div>3. Capture price distortion as MEV</div>
            <div>4. Rebalance pool positions</div>
            <div>5. Distribution: Hook 60% / Native 40%</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="terminal-panel p-3 border border-[#ff0040]">
            <div className="text-xs text-[#ff0040]">ERROR: {error}</div>
          </div>
        )}
      </div>
    </div>
  );
}