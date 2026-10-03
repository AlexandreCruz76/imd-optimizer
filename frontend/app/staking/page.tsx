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

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono p-4 md:p-6">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-white/[0.08] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/50 bg-[#0D121A]">
              <img src="/images/avatar.jpg" alt="IMD" className="w-full h-full object-cover"/>
            </div>
            <span className="hidden sm:block text-xl font-bold text-white">IMD Optimizer</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-slate-400 hover:text-emerald-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span className="hidden sm:inline">Home</span>
            </a>
            <a href="/swap" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Swap</a>
            <a href="/arbitrage" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Arbitrage</a>
          </div>
        </div>
      </nav>

      <main className="pt-20 max-w-4xl mx-auto space-y-6">
<div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full border border-emerald-500/40 bg-[#0B111A] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,245,140,0.25)]">
            <img
              src="/images/buildercoin.jpeg"
              alt="Buildercoin"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/builder.jpg";
              }}
            />
          </div>
          <div>
            <div className="font-mono text-sm tracking-[0.25em] text-white font-bold uppercase">
              ┌─ BUILDER STAKING ── DIAMOND HANDS VAULT ────────────────────────┐
            </div>
            <p className="font-mono text-xs text-slate-400 tracking-widest uppercase mt-1">
              Yield ponderado por Identity Tier (DEC-020) — yield = stake × multiplicador (4x / 3x / 1x / 0x)
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 mb-6">
          <p className="font-mono text-xs text-slate-400">
            Aviso: Saque antecipado antes do vencimento incorre penalidade conforme DEC-020. Consulte regras abaixo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">30 DIAS</div>
            <div className="font-mono font-bold text-emerald-400 text-2xl mb-1">37% APR</div>
            <div className="font-mono font-bold text-emerald-400 text-[11px] tracking-widest uppercase">7 DIAS · 0% TAX</div>
            <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-2">UNLOCK: 30 DIAS</div>
          </div>
          <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">60 DIAS</div>
            <div className="font-mono font-bold text-emerald-400 text-2xl mb-1">52% APR</div>
            <div className="font-mono font-bold text-emerald-400 text-[11px] tracking-widest uppercase">14 DIAS · 0% TAX</div>
            <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-2">UNLOCK: 60 DIAS</div>
          </div>
          <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">90 DIAS</div>
            <div className="font-mono font-bold text-emerald-400 text-2xl mb-1">68.5% APR</div>
            <div className="font-mono font-bold text-emerald-400 text-[11px] tracking-widest uppercase">21 DIAS · 0% TAX</div>
            <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-2">UNLOCK: 90 DIAS</div>
          </div>
        </div>

        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5 mb-6">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">POSIÇÕES ATUAIS</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#070A0F]/80 border border-slate-800/50 rounded-xl p-4">
              <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-1">$BUILDER STAKED</div>
              <div className="font-mono font-bold tracking-tight text-white text-2xl">{stakedBuilder} $BUILDER</div>
              <div className="font-mono text-[11px] tracking-widest text-slate-400 uppercase mt-2">APY: <span className="text-emerald-400 font-bold">{aprBuilder}</span></div>
              <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-1">UNLOCK: {unlockDate}</div>
              <button
                onClick={handleUnstake}
                disabled={parseFloat(stakedBuilder) <= 0 || loading}
                className="w-full mt-4 py-3 font-mono font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,140,0.25)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {parseFloat(stakedBuilder) <= 0 ? "STAKE $BUILDER" : "UNSTAKE $BUILDER"}
              </button>
            </div>
            <div className="bg-[#070A0F]/80 border border-slate-800/50 rounded-xl p-4">
              <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-1">$IMD STAKED</div>
              <div className="font-mono font-bold tracking-tight text-white text-2xl">{stakedImd} $IMD</div>
              <div className="font-mono text-[11px] tracking-widest text-slate-400 uppercase mt-2">APY: <span className="text-emerald-400 font-bold">{aprImd}</span></div>
              <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-1">UNLOCK: {unlockDate}</div>
              <button
                onClick={handleUnstake}
                disabled={parseFloat(stakedImd) <= 0 || loading}
                className="w-full mt-4 py-3 font-mono font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,140,0.25)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {parseFloat(stakedImd) <= 0 ? "STAKE $IMD" : "UNSTAKE $IMD"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5 mb-6">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">DURAÇÃO DO LOCK</div>
          <div className="flex flex-wrap gap-3">
            {["30", "60", "90"].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-6 py-3 font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,140,0.25)] active:scale-95 ${
                  duration === d
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {d} DIAS
              </button>
            ))}
          </div>
          <div className="mt-4 font-mono text-xs text-slate-400 tracking-widest">
            SELECIONADO: <span className="text-emerald-400 font-bold">{duration} DIAS</span>
          </div>
        </div>

        <button
          onClick={handleStake}
          disabled={loading}
          className="w-full py-3 font-mono font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,140,0.25)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? "STAKING..." : parseFloat(stakedBuilder) <= 0 && parseFloat(stakedImd) <= 0 ? "STAKE NOW" : "MANAGE POSITION"}
        </button>

        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">REGRAS (DEC-020)</div>
          <div className="space-y-2 font-mono text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>Yield = Stake × Multiplicador por Tier (Diamond 4x / Gold 3x / Silver 1x / Bronze 0x)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>$BUILDER stakers recebem 60% das taxas do protocolo</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>$IMD stakers recebem 37% das taxas + bonus rewards</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>Lock maior = APR maior + peso de governança aumentado</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">▸</span>
              <span className="text-rose-500">Saque antecipado: 2-5% PENALTY conforme tempo restante</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>Sem taxas de entrada/saída no vencimento (0% TAX)</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-slate-900/80 border border-rose-500/40 rounded-xl p-4">
            <div className="font-mono text-xs text-rose-500">ERROR: {error}</div>
          </div>
        )}
      </main>
    </div>
  );
}