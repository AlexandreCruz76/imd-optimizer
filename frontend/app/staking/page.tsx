"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";

export default function StakingPage() {
  const { connected, address } = useWallet();
  const [stakedBuilder, setStakedBuilder] = useState("0");
  const [stakedImd, setStakedImd] = useState("0");
  const [aprBuilder, setAprBuilder] = useState("60%");
  const [aprImd, setAprImd] = useState("37%");
  const [duration, setDuration] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (connected) {
      interval = setInterval(() => {
        const currentBuilder = parseFloat(stakedBuilder) + Math.random() * 0.1;
        const currentImd = parseFloat(stakedImd) + Math.random() * 0.05;

        setStakedBuilder(currentBuilder.toFixed(2));
        setStakedImd(currentImd.toFixed(2));

        // Calculate APY based on duration
        const dur = parseInt(duration, 10);
        const baseApr = dur === 30 ? "37%" : dur === 60 ? "52%" : "68.5%";
        setAprBuilder(baseApr);
        setAprImd((parseFloat(baseApr) - 3 + Math.random() * 5).toFixed(1));
      }, 1500);

      return () => clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [connected]);

  async function handleStake() {
    if (!connected) return;
    setLoading(true);
    setError(null);

    try {
      const dur = parseInt(duration, 10);
      const res = await fetch("/api/staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, action: "stake", duration: dur }),
      });
      const data = await res.json();

      if (data.success) {
        setStakedBuilder((parseFloat(stakedBuilder) + (dur === 30 ? 1 : dur === 60 ? 3 : 5)).toFixed(2));
        setStakedImd((parseFloat(stakedImd) + (dur === 30 ? 0.5 : dur === 60 ? 2 : 3)).toFixed(2));
      } else {
        setError(data.error || "Stake failed");
      }
    } catch (err: any) {
      setError(err.message || "Stake failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnstake() {
    if (!connected) return;
    setLoading(true);
    setError(null);

    try {
      const dur = parseInt(duration, 10);
      const res = await fetch("/api/staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, action: "unstake", duration: dur }),
      });
      const data = await res.json();

      if (data.success) {
        setStakedBuilder((parseFloat(stakedBuilder) - (dur === 30 ? 1 : dur === 60 ? 3 : 5)).toFixed(2));
        setStakedImd((parseFloat(stakedImd) - (dur === 30 ? 0.5 : dur === 60 ? 2 : 3)).toFixed(2));
        setUnlockTime(new Date(Date.now() + dur * 30 * 24 * 60 * 60 * 1000));
      } else {
        setError(data.error || "Unstake failed");
      }
    } catch (err: any) {
      setError(err.message || "Unstake failed");
    } finally {
      setLoading(false);
    }
  }

  const unlockDate = unlockTime ? unlockTime.toLocaleDateString() : "N/A";
  const stakeButtonClassName = !loading
    ? parseFloat(stakedBuilder) <= 0 && parseFloat(stakedImd) <= 0
      ? "bg-[#00F58C] text-[#0a0a0a] hover:bg-[#00CC33]"
      : "bg-[#00F58C] text-[#0a0a0a] hover:bg-[#00CC33]"
    : "bg-[#00FF5820] text-[#00F58C40] cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tick">Staking $BUILDER & $IMD</h1>
            <p className="text-[var(--color-muted)] mt-1">Lock tokens and earn protocol fees with multi</p>
          </div>
        </div>

        {/* Staking Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <div className="glass-card p-4 rounded-2xl border border-[#00FF41]/30 border-opacity-50">
              <div className="text-xs text-[#00FF4160] mb-1 tracking-wider">30 Days</div>
              <div className="text-xl font-bold text-[#00FF41]">37% APR</div>
              <div className="text-sm text-[#00FF4160] mt-1">Unlock: 30 days</div>
            </div>
          </div>
          <div>
            <div className="glass-card p-4 rounded-2xl border border-[#00F58C]/30 border-opacity-50">
              <div className="text-xs text-[#00F58C60] mb-1 tracking-wider">60 Days</div>
              <div className="text-xl font-bold text-[#00F58C]">52% APR</div>
              <div className="text-sm text-[#00F58C60] mt-1">Unlock: 60 days</div>
            </div>
          </div>
          <div>
            <div className="glass-card p-4 rounded-2xl border border-[#FFB000]/30 border-opacity-50">
              <div className="text-xs text-[#FFB00060] mb-1 tracking-wider">90 Days</div>
              <div className="text-xl font-bold text-[#FFB000]">68.5% APR</div>
              <div className="text-sm text-[#FFB00060] mt-1">Unlock: 90 days</div>
            </div>
          </div>
        </div>

        {/* Current Staking Positions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-wider">$BUILDER Staked</div>
            <div className="text-2xl font-semibold text-[var(--color-accent-emerald)]">{stakedBuilder} $BUILDER</div>
            <div className="text-xs text-[var(--color-muted)] mb-2">APY: {aprBuilder}</div>
            <div className="text-xs text-[var(--color-muted)]">Unlocks: {unlockDate}</div>
            <button
              onClick={handleUnstake}
              disabled={parseFloat(stakedBuilder) <= 0 || loading}
              className="w-full py-2 text-xs font-bold transition-all disabled:bg-[#00FF5820] disabled:text-[#00F58C40] cursor-not-allowed hover:bg-[#00CC33]"
            >
              {parseFloat(stakedBuilder) <= 0 ? "Stake $BUILDER" : "Unstake $BUILDER"}
            </button>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-wider">$IMD Staked</div>
            <div className="text-2xl font-semibold text-[var(--color-accent-cyan)]">{stakedImd} $IMD</div>
            <div className="text-xs text-[var(--color-muted)] mb-2">APY: {aprImd}</div>
            <div className="text-xs text-[var(--color-muted)]">Unlock: {unlockDate}</div>
            <button
              onClick={handleUnstake}
              disabled={parseFloat(stakedImd) <= 0 || loading}
              className="w-full py-2 text-xs font-bold transition-all disabled:bg-[#00FF5820] disabled:text-[#00F58C40] cursor-not-allowed hover:bg-[#00CC33]"
            >
              {parseFloat(stakedImd) <= 0 ? "Stake $IMD" : "Unstake $IMD"}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <button
            onClick={handleStake}
            disabled={loading}
            className="w-full py-3 text-xs tracking-wider font-bold transition-all disabled:bg-[#00FF5820] disabled:text-[#00F58C40] cursor-not-allowed hover:bg-[#00CC33]"
          >
            {loading ? "STAKING..." : (
              parseFloat(stakedBuilder) <= 0 && parseFloat(stakedImd) <= 0
                ? "Stake Now"
                : "Manage Position"
            )}
          </button>
        </div>

        {/* Staking Benefits */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <h2 className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest">Staking Benefits</h2>
          <div className="space-y-3 text-sm text-[#00ff4160]">
            <div>• Earn 37-68.5% APR depending on lock duration</div>
            <div>• $BUILDER stakers: 60% of protocol fees</div>
            <div>• $IMD stakers: 37% of protocol fees + bonus rewards</div>
            <div>• Longer lock = higher APR and voting weight</div>
            <div>• Early unstake penalty: 10% fee</div>
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