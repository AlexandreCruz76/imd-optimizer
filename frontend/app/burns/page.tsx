"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";

export default function BurnsPage() {
  const { connected, address } = useWallet();
  const [burned, setBurned] = useState("0");
  const [volume, setVolume] = useState("0");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // DEC-017: contador on-chain real (OptimizerHookV2.totalIMDBurnedByOptimizer)
  const [onChainBurned, setOnChainBurned] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let poll: NodeJS.Timeout | undefined;

    async function load() {
      try {
        const res = await fetch("/api/burn-counter");
        const data = await res.json();
        if (!cancelled) {
          setOnChainBurned(
            data.available && data.totalIMDBurnedByOptimizer != null
              ? data.totalIMDBurnedByOptimizer
              : null
          );
        }
      } catch {
        if (!cancelled) setOnChainBurned(null);
      }
    }

    const kick = setTimeout(() => {
      load();
      poll = setInterval(load, 15000);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(kick);
      if (poll) clearInterval(poll);
    };
  }, []);

  async function handleBurn() {
    if (!connected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/burn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();

      if (data.txHash) {
        setTxHash(data.txHash);
        setBurned(data.burned || burned);
        setVolume(data.volume || volume);
        setProgress(data.progress || progress);
      } else {
        setError(data.error || "Burn failed");
      }
    } catch {
      setError(
        "Endpoint /api/burn not configured — assisted Buy-and-Burn arrives after deploy (the hook DEC-017 auto-burn already works on-chain)."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070A0F] text-[var(--color-foreground)]">
      <div className="p-6 md:p-8 pt-24 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Elastic Contraction</h1>
            <p className="text-[var(--color-muted)] mt-1">MEV-funded token burn with dynamic supply reduction</p>
          </div>
          <div className="text-right">
            <button
              onClick={handleBurn}
              disabled={loading}
              className="rounded-xl px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(0,245,140,0.3)] active:scale-[0.98] transition-all disabled:bg-slate-800/50 disabled:text-slate-500 disabled:shadow-none cursor-not-allowed">
              {loading ? "BURNING..." : "Initiate Burn"}
            </button>
          </div>
        </div>

        {/* Burn Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-widest">
              Total Burned (on-chain)
            </div>
            <div className="text-3xl font-semibold text-[var(--color-accent-emerald)]">
              {onChainBurned !== null ? `${onChainBurned} $IMD` : "— $IMD"}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-2 font-mono leading-relaxed">
              {onChainBurned !== null
                ? "OptimizerHookV2 · totalIMDBurnedByOptimizer"
                : "Hook counter unavailable. Set OPTIMIZER_HOOK_ADDRESS to read the on-chain burn total."}
            </div>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-widest">Processed Volume</div>
            <div className="text-3xl font-semibold text-[var(--color-accent-cyan)]">
              {txHash && volume !== "0" ? `${volume} ETH` : "— ETH"}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-2 font-mono">
              burn volume recorded in this session (getStats after execution)
            </div>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-widest">Supply Reduction</div>
            <div className="text-3xl font-semibold text-[var(--color-accent-emerald)]">
              {progress > 0 ? `${progress}%` : "—"}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-2 font-mono">
              reduction measured after execution — per-tier target (DEC-017)
            </div>
          </div>
        </div>

        {/* Elastic Progress Bar */}
        {progress > 0 && (
          <div className="mb-8">
            <div className="progress-bar h-2 rounded-full">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-[#00F58C60]">{burned} $IMD burned</span>
              <span className="text-[#00F58C60]">{progress.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* Transaction Result */}
        {txHash && (
          <div className="terminal-panel p-3 border border-[#00F58C]">
            <div className="text-xs text-[#00F58C] mb-1">Transaction submitted</div>
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00F58C60] hover:text-[#00F58C] break-all"
            >
              {txHash}
            </a>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="terminal-panel p-3 border border-[#FB7185]">
            <div className="text-xs text-[#FB7185]">ERROR: {error}</div>
          </div>
        )}

        {/* Burn History / Stats */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <h2 className="text-sm text-[var(--color-accent-emerald)] font-bold mb-4 tracking-widest">Burn Mechanics</h2>
          <div className="space-y-3 text-sm text-[#00F58C60]">
            <div>• Burn tax: 0% Tier 1 / 0.1% Tier 2 / 10% Tier 3 / 20% Tier 4</div>
            <div>• Burn proceeds permanently removed from circulation</div>
            <div>
              • Auto-burn on interception (DEC-017): intercepted $IMD is
              burned and accounted in totalIMDBurnedByOptimizer
            </div>
            <div>
              • Buy-and-Burn (5% slice): Burn Budget ETH buys $IMD on the market,
              goes to BurnExecutor and adds the exact amount to
              totalIMDBurnedByOptimizer — native ETH is never burned
            </div>
            <div>• Remaining supply: dynamically adjusted per tier</div>
            <div>• Minimum burn threshold: 0.01 $IMD</div>
          </div>
        </div>
      </div>
    </div>
  );
}