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
        "Endpoint /api/burn não configurado — Buy-and-Burn assistido entra após o deploy (a auto-burn DEC-017 do hook já funciona on-chain)."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Elastic Contraction</h1>
            <p className="text-[var(--color-muted)] mt-1">MEV-funded token burn with dynamic supply reduction</p>
          </div>
          <div className="text-right">
            <button
              onClick={handleBurn}
              disabled={loading}
              className="py-2 px-4 text-sm font-bold transition-all disabled:bg-[#00FF5820] disabled:text-[#00F58C40] cursor-not-allowed hover:bg-[#00CC33]">
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
            <div className="text-xs text-[var(--color-muted)] mt-2 font-mono">
              {onChainBurned !== null
                ? "OptimizerHookV2 · totalIMDBurnedByOptimizer"
                : "hook não configurado (OPTIMIZER_HOOK_ADDRESS)"}
            </div>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-widest">Volume Processado</div>
            <div className="text-3xl font-semibold text-[var(--color-accent-cyan)]">
              {txHash && volume !== "0" ? `${volume} ETH` : "— ETH"}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-2 font-mono">
              volume de burn registrado nesta sessão (getStats após execução)
            </div>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-widest">Supply Reduction</div>
            <div className="text-3xl font-semibold text-[var(--color-accent-emerald)]">
              {progress > 0 ? `${progress}%` : "—"}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-2 font-mono">
              redução medida após execução — meta por tier (DEC-017)
            </div>
          </div>
        </div>

        {/* Elastic Progress Bar */}
        {progress > 0 && (
          <div className="mb-8">
            <div className="progress-bar h-2 rounded-full">
              <div
                className="progress-bar-fill"
                style={{ width: progress }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-[#00ff4160]">{burned} $IMD burned</span>
              <span className="text-[#00ff4160]">{progress.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* Transaction Result */}
        {txHash && (
          <div className="terminal-panel p-3 border border-[#00ff41]">
            <div className="text-xs text-[#00ff41] mb-1">Transaction submitted</div>
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00ff4160] hover:text-[#00ff41] break-all"
            >
              {txHash}
            </a>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="terminal-panel p-3 border border-[#ff0040]">
            <div className="text-xs text-[#ff0040]">ERROR: {error}</div>
          </div>
        )}

        {/* Burn History / Stats */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <h2 className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest">Burn Mechanics</h2>
          <div className="space-y-3 text-sm text-[#00ff4160]">
            <div>• Burn tax: 0% Tier 1 / 0.1% Tier 2 / 10% Tier 3 / 20% Tier 4</div>
            <div>• Burn proceeds permanently removed from circulation</div>
            <div>
              • Auto-burn na interceptação (DEC-017): $IMD interceptado é
              queimado e contabilizado em totalIMDBurnedByOptimizer
            </div>
            <div>
              • Buy-and-Burn (fatia de 5%): o ETH do Burn Budget compra $IMD a
              mercado, vai ao BurnExecutor e soma o valor exato a
              totalIMDBurnedByOptimizer — nunca queima ETH nativo
            </div>
            <div>• Remaining supply: dynamically adjusted per tier</div>
            <div>• Minimum burn threshold: 0.01 $IMD</div>
          </div>
        </div>
      </div>
    </div>
  );
}