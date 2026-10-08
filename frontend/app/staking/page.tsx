"use client";

import { useState } from "react";
import { useWallet } from "../components/WalletProvider";
import { Navbar } from "../components/Navbar";

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
      <Navbar />

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
          <div className="font-mono text-[11px] text-slate-500 mb-4 leading-relaxed">
            No stake registered yet — positions appear after the BuilderStakingVault deploy.
            <br />
            Yield scales with your Identity Tier (Alpha 4x → Retail 0x) and comes from real protocol fees.
          </div>
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
                className="w-full mt-4 rounded-xl py-3 font-mono text-sm font-semibold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(0,245,140,0.35)] active:scale-[0.98] transition-all"
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
                className="w-full mt-4 rounded-xl py-3 font-mono text-sm font-semibold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(0,245,140,0.35)] active:scale-[0.98] transition-all"
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
          className="w-full rounded-xl py-3 font-mono text-sm font-semibold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(0,245,140,0.35)] active:scale-[0.98] transition-all"
        >
          {connected ? "STAKE NOW" : `CONNECT ${walletName.toUpperCase()} FOR STAKING`}
        </button>

        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">RULES (DEC-020)</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { t: "T1 · ALPHA", c: "#00F58C", m: "4x yield · 0% fee" },
              { t: "T2 · PARTNER", c: "#00F5FF", m: "3x · 0.10% fee" },
              { t: "T3 · HOLDER", c: "#FFB000", m: "1x · 0.30% fee" },
              { t: "T4 · RETAIL", c: "#6B7A88", m: "0x · 0.50% fee" },
            ].map((tier) => (
              <span
                key={tier.t}
                className="inline-flex items-center gap-2 text-[10px] font-mono px-2.5 py-1.5 rounded-full border uppercase tracking-wider"
                style={{ color: tier.c, borderColor: `${tier.c}55`, background: `${tier.c}12` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.c }} />
                {tier.t}
                <span className="opacity-70 normal-case tracking-normal">{tier.m}</span>
              </span>
            ))}
          </div>
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
