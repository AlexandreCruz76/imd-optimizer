"use client";

import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { WalletProvider } from "./components/WalletProvider";

const DEPLOYMENT_STATUS = "Sepolia Testnet";

function LiveMetricsBar() {
  const [mev, setMev] = useState<string | null>(null);
  const [burned, setBurned] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setMev(d.mevInterceptedEth ?? null);
        setBurned(d.imdBurned ?? null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const fmt = (v: string | null) =>
    v === null ? "—" : `${Number(v).toFixed(2)}`;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0B111A]/80 p-4">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono">
        <span className="inline-flex items-center gap-2 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Status: {DEPLOYMENT_STATUS}
        </span>
        <span className="text-slate-400">
          Total MEV Intercepted:{" "}
          <span className="text-white">{fmt(mev)} ETH</span>
        </span>
        <span className="text-slate-400">
           Auto-Burned:{" "}
          <span className="text-white">{fmt(burned)} </span>
        </span>
        <span className="text-slate-500">Network: Powered by Codeming</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-[#070A0F] font-mono">
        <Navbar />

        <main className="pt-20 pb-16 px-4 md:px-8">
          {/* Ambient Background */}
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,140,0.03)_0%,transparent_70%)]" />

          {/* Corner Brackets */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-emerald-500/30" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-emerald-500/30" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-emerald-500/30" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-emerald-500/30" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/avatar.jpg"
                  alt="IMD Optimizer"
                  className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover"
                />
                <h1 className="text-sm md:text-base font-mono text-white tracking-widest uppercase">
                  IMD OPTIMIZER PROTOCOL
                </h1>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE SEPOLIA
                </span>
              </div>
            </div>

            {/* ASCII Bezel Header */}
            <div className="text-center mb-6">
              <div className="font-mono text-sm tracking-[0.25em] text-emerald-400 font-bold uppercase">
                ┌─ AGENTIC V4 META-HOOK ── MEV INTERCEPTION & LVR MITIGATION ────────────────────┐
              </div>
            </div>

            {/* Hero Section */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sepolia Testnet · Unaudited
                </div>

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] bg-gradient-to-r from-white via-slate-300 to-emerald-400 bg-clip-text text-transparent">
                  The Agentic V4 Meta-Hook
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                  We don&apos;t simulate protection. We execute it. Uniswap V4 hooks intercept MEV at the source — before settlement occurs.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs font-mono text-slate-400 uppercase">Uniswap V4 Singleton Hook</span>
                  <span className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs font-mono text-slate-400 uppercase">Sepolia Live</span>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 uppercase">LVR Protection</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-8">
                  <a href="#swap" className="w-full sm:w-auto bg-emerald-500 text-black font-bold px-10 py-5 rounded-xl hover:bg-emerald-400 transition-all text-center shadow-[0_0_20px_rgba(0,245,140,0.3)] text-base">
                    PROTECTED SWAP
                  </a>
                  <a href="#pool" className="w-full sm:w-auto bg-slate-800/50 text-white font-bold px-10 py-5 rounded-xl hover:bg-slate-700/50 transition-all text-center border border-slate-700/50 text-base">
                    META HOOK POOL
                  </a>
                </div>
              </div>

              {/* Right: Visual Hero */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-[#0B111A]/80 shadow-[0_0_50px_rgba(0,245,140,0.15)]">
                  <img
                    src="/images/Frog_firing_energy_blast_20260926015955.jpg"
                    alt="Agentic Frog defending against MEV bots"
                    className="w-full h-[480px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Live Metrics Bar */}
            <LiveMetricsBar />

            {/* Core Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                title="MEMOPOOL SURVEILLANCE"
                desc="Autonomous agents continuously scan the mempool for toxic order flow patterns before they execute on-chain."
                accent="#00F5FF"
                bgImage="/images/acao.jpeg"
              />
              <FeatureCard
                title="TOXICITY SCORING"
                desc="Each incoming swap is scored for MEV probability. High-toxicity swaps trigger dynamic fee escalation and protective routing."
                accent="#FFB000"
                bgImage="/images/acao2.jpg"
              />
              <FeatureCard
                title="INSTANT INTERCEPTION"
                desc="Uniswap V4 beforeSwap hooks intercept and neutralize MEV at the source — before settlement occurs."
                accent="#00F58C"
                bgImage="/images/Frog_firing_energy_blast_20260926015955.jpg"
              />
            </div>

            {/* LVR Mitigation Section */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Loss-Versus-Rebalancing (LVR) Mitigation
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  LVR is the silent value leak every LP suffers when arbitrageurs exploit stale pool prices.
                  Traditional AMMs passively accept this loss. IMD Optimizer&apos;s V4 hooks actively intervene at the protocol level.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <MetricCard value="0 – 0.5%" label="Swap Fee por Tier" accent="#00F58C" />
                  <MetricCard value="5 – 25%" label="Success Fee só Lucro" accent="#00F5FF" />
                  <MetricCard value="0x – 4x Yield Multiplier" label="" accent="#FFB000" />
                  <MetricCard value="2 – 5%" label="Unstake Penalty" accent="#FF567E" />
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-[#0B111A]/80 shadow-[0_0_50px_rgba(0,245,140,0.15)]">
                  <img
                    src="/images/colecao.png"
                    alt="LVR Mitigation — Collection"
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Tier Mountain */}
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  The Tier Mountain — Value Capture Funnel
                </h3>
                <p className="text-slate-400">Where captured MEV flows back to users through a four-tier hierarchy</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { tier: "1", name: "ALPHA · Buildercoin NFT", fee: "0.00% Swap · 5% Success", boost: "4x Yield", color: "#FFD700", glow: "rgba(255,215,0,0.4)", desc: "Buildercoin NFT (501 supply, mint 0.05 ETH). Swap isento, Success Fee mínima sobre o lucro de arbitragem e multiplicador de yield máximo.", bgImage: "/images/nft builder.jpeg" },
                  { tier: "2", name: "PARTNER · Identity md NFT", fee: "0.10% Swap · 10% Success", boost: "3x Yield", color: "#00F5FF", glow: "rgba(0,245,255,0.4)", desc: "Identity md NFT. Taxa de swap quase nula, Success Fee reduzida e 3x de yield ponderado no Builder Staking.", bgImage: "/images/imd%20(2).jpg" },
                  { tier: "3", name: "HOLDER · IMD / BLD", fee: "0.30% Swap · 20% Success", boost: "1x Yield", color: "#BB86FC", glow: "rgba(187,134,252,0.4)", desc: "Saldo > 0 de IMD ou BLD — qualificação automática por balanceOf. Yield ponderado 1x.", bgImage: "/images/pepe%20clarao.png" },
                  { tier: "4", name: "RETAIL", fee: "0.50% Swap · 25% Success", boost: "0x Yield", color: "#FF567E", glow: "rgba(255,86,126,0.4)", desc: "Tier padrão para qualquer carteira: proteção V4 completa sem pré-requisitos. Sem multiplicador de yield.", bgImage: "/images/tier.jpeg" },
                ].map((t, i) => (
                  <TierCard key={i} {...t} />
                ))}
              </div>
            </div>

            {/* Protocol Metrics */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Protocol Metrics</h3>
                <p className="text-slate-400">Verifiable contract parameters — no marketing numbers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Genesis Mint (Buildercoin)" value="501" change="0.05 ETH / key" icon={
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M15.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-2.5 1.5L15.5 21z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7v4M12 15h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
} description="40% Core · 40% Infra · 20% Growth" accent="#00F58C" badge="Tier 1 · Alpha" backgroundImage="/images/colecao.png" />
                <StatCard title="Swap Fee por Tier" value="0 – 0.5%" change="Tiers 1 → 4" icon={
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 22V12M22 8.5L12 15.5M2 8.5L12 15.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
} description="0.00% / 0.10% / 0.30% / 0.50% via identityTier()" accent="#00F5FF" badge="identityTier() on-chain" />
                <StatCard title="Success Fee (arb)" value="5 – 25%" change="só sobre o lucro" icon={
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
} description="Cobrada apenas sobre lucro líquido de executeCustomArbitrage" accent="#FFB000" badge="receiveYield() only" />
                <StatCard title="Penalty Split (Diamond)" value="50/25/25" change="Burn/Treasury/Yield" icon={
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7v4M12 15h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
} description="Unstake instantâneo (2–5%): 50% Burn, 25% Tesouro, 25% yield" accent="#FF567E" badge="DEC-020 · BuilderStakingVault" />
              </div>
            </div>

            {/* Footer CTA */}
            <div className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#0B111A]/90 to-[#070A0E]/90 p-8 md:p-12 shadow-[0_0_60px_rgba(0,245,140,0.1)] overflow-hidden text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,140,0.05)_0%,transparent_70%)]" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Join the Sovereign Guardian?</h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Stake IMD, mint a Genesis Key, or simply swap on an IMD-protected pool.
                  Every interaction strengthens the protocol that protects you.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <a href="/swap" className="w-full sm:w-auto bg-emerald-500 text-black font-bold px-8 py-4 rounded-xl hover:bg-emerald-400 transition-all text-center shadow-[0_0_30px_rgba(0,245,140,0.3)] text-base">
                    MINT
                  </a>
                  <a href="/pool" className="w-full sm:w-auto bg-slate-800/50 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-700/50 transition-all text-center border border-slate-700/50 text-base">
                    META HOOK POOL
                  </a>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 max-w-2xl mx-auto mt-8">
              IMD Optimizer is experimental software on Sepolia testnet. No mainnet deployment yet.
              Smart contracts unaudited. Use at your own risk. This is not financial advice.
            </p>

            {/* Footer ASCII */}
            <div className="text-center text-xs text-slate-500 font-mono tracking-wider pt-8 border-t border-slate-800/50 mt-8">
              └────────────────────────────────────────────────────────────────────────┘
            </div>
          </div>
        </main>
      </div>
    </WalletProvider>
  );
}

// ===== REUSABLE COMPONENTS =====

function FeatureCard({ title, desc, accent, bgImage }: { title: string; desc: string; accent: string; bgImage: string }) {
  return (
    <div className="relative bg-[#0B111A]/80 border border-slate-700/50 rounded-2xl p-5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 overflow-hidden">
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F]/90 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">
        <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider text-center mb-3">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed text-center">{desc}</p>
      </div>
    </div>
  );
}

function MetricCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="bg-[#0B111A]/80 border border-slate-700/50 rounded-xl p-4 text-center">
      <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: accent }}>{value}</div>
      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TierCard({ tier, name, fee, boost, color, glow, desc, bgImage }: { 
  tier: string; name: string; fee: string; boost: string; color: string; glow: string; desc: string; bgImage: string; 
}) {
  return (
    <div className="relative flex flex-col h-full bg-[#0B111A]/80 border border-slate-700/50 hover:border-emerald-500/30 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <img
        src={bgImage}
        alt={`${name} Tier ${tier}`}
        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F]/90 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold text-sm bg-gradient-to-br from-[${color}] to-[${color}80]">
            {tier}
          </div>
          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-xs font-mono text-slate-400 uppercase">Tier {tier}</div>
          </div>
        </div>
        <div className="space-y-1 mb-3">
          <div className="font-mono text-lg font-bold text-white">{fee}</div>
          <div className="text-sm font-medium" style={{ color }}>{boost}</div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed flex-1">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon, description, accent, badge, backgroundImage }: { 
  title: string; value: string; change: string; icon: React.ReactNode; description: string; accent: string; badge?: string; backgroundImage?: string;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-700/50 bg-[#0B111A]/80 p-5 hover:border-emerald-500/30 transition-all overflow-hidden">
      {backgroundImage && (
        <>
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${backgroundImage})` }} aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F]/95 via-transparent to-transparent pointer-events-none" />
        </>
      )}
      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="text-2xl" style={{ color: accent }}>{icon}</div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
          {change}
        </span>
      </div>
      <h4 className="relative text-2xl md:text-3xl font-bold text-white mb-1">{value}</h4>
      <p className="relative text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">{title}</p>
      <p className="relative text-xs text-slate-500">{description}</p>
      {badge && (
        <div className="relative mt-3 pt-3 border-t border-slate-700/50">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] font-mono text-slate-400">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}