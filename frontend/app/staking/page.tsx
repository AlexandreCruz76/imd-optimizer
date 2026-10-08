"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "../components/WalletProvider";

export default function StakingPage() {
  const { connected, walletName, connect } = useWallet();
  const [error, setError] = useState<string | null>(null);

  function handleDemo(message: string) {
    setError(
      "DEMO PAGE — no transaction is signed. " +
        message
    );
  }

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono p-4 md:p-6">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-white/[0.08] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/50 bg-[#0D121A]">
              <img src="/images/avatar.jpg" alt="IMD" className="w-full h-full object-cover"/>
            </div>
            <span className="hidden sm:block text-xl font-bold text-white">IMD Optimizer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-400 hover:text-emerald-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link href="/swap" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Swap</Link>
            <Link href="/arbitrage" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Arbitrage</Link>
            <Link href="/docs" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Docs</Link>
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
              Yield weighted by Identity Tier (DEC-020) — yield = stake × multiplier (4x / 3x / 1x / 0x)
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 mb-6">
          <p className="font-mono text-xs text-amber-400">
            DEMO PAGE — the BuilderStakingVault contract is not deployed yet
            (Sepolia/mainnet). No transaction is signed here; the rules below
            are the official protocol rules (DEC-020).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">CLAIM YIELD</div>
            <div className="font-mono font-bold text-emerald-400 text-2xl mb-1">0% TAX</div>
            <div className="font-mono font-bold text-emerald-400 text-[11px] tracking-widest uppercase">NO FEE TO CLAIM</div>
            <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-2">claimYield() — DEC-020</div>
          </div>
          <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">UNSTAKE WITH LOCK-UP</div>
            <div className="font-mono font-bold text-emerald-400 text-2xl mb-1">0% TAX</div>
            <div className="font-mono font-bold text-emerald-400 text-[11px] tracking-widest uppercase">7-DAY LOCK-UP</div>
            <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-2">beginUnbond → completeUnbond</div>
          </div>
          <div className="bg-[#0B111A]/80 border border-rose-500/30 rounded-2xl p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">INSTANT UNSTAKE</div>
            <div className="font-mono font-bold text-rose-400 text-2xl mb-1">PENALTY 2–5%</div>
            <div className="font-mono font-bold text-rose-400 text-[11px] tracking-widest uppercase">50% BURN · 25% TREASURY · 25% YIELD</div>
            <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-2">emergencyInstantWithdraw</div>
          </div>
        </div>

        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5 mb-6">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">CURRENT POSITIONS</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#070A0F]/80 border border-slate-800/50 rounded-xl p-4">
              <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-1">$BLD STAKED</div>
              <div className="font-mono font-bold tracking-tight text-white text-2xl">— $BLD</div>
              <div className="font-mono text-[11px] tracking-widest text-slate-400 uppercase mt-2">
                YIELD: <span className="text-emerald-400 font-bold">stake × tier mult.</span>
              </div>
              <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-1">LOCK-UP: 7 DAYS · 0%</div>
              <button
                onClick={() =>
                  handleDemo(
                    "Real $BLD staking arrives after the BuilderStakingVault deploy."
                  )
                }
                className="w-full mt-4 py-3 font-mono font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,140,0.25)] active:scale-95"
              >
                STAKE $BLD
              </button>
            </div>
            <div className="bg-[#070A0F]/80 border border-slate-800/50 rounded-xl p-4">
              <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-1">YIELD POSITION</div>
              <div className="font-mono font-bold tracking-tight text-white text-2xl">— ETH</div>
              <div className="font-mono text-[11px] tracking-widest text-slate-400 uppercase mt-2">
                CLAIM: <span className="text-emerald-400 font-bold">0% fee</span>
              </div>
              <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-1">WEIGHT = 0 IF STAKE = 0</div>
              <button
                onClick={() =>
                  handleDemo(
                    "claimYield() with a 0% fee arrives after the BuilderStakingVault deploy."
                  )
                }
                className="w-full mt-4 py-3 font-mono font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,140,0.25)] active:scale-95"
              >
                CLAIM YIELD
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            connected
              ? handleDemo(
                  "Real staking becomes available with the BuilderStakingVault deploy."
                )
              : connect()
          }
          className="w-full py-3 font-mono font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,140,0.25)] active:scale-95"
        >
          {connected ? "STAKE NOW" : `CONNECT ${walletName.toUpperCase()} FOR STAKING`}
        </button>

        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">RULES (DEC-020)</div>
          <div className="space-y-2 font-mono text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>Yield = Stake × Identity Tier Multiplier (Alpha 4x / Partner 3x / Holder 1x / Retail 0x)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>Vault distributes 60% Stakers · 20% Treasury · 15% Devs · 5% Buy-and-Burn</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>claimYield() with 0% fee — no promised APY, yield comes from real revenue</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>Unstake with a 7-day lock-up: 0%</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">▸</span>
              <span className="text-rose-500">Instant unstake: penalty 2–5% → 50% Buy-and-Burn · 25% Treasury · 25% weighted yield</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">▸</span>
              <span>Yield weight only changes with stake (public checkpoint to refresh after a Tier change)</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-slate-900/80 border border-rose-500/40 rounded-xl p-4">
            <div className="font-mono text-xs text-rose-500">AVISO: {error}</div>
          </div>
        )}
      </main>
    </div>
  );
}
