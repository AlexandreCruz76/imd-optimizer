"use client";

import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";

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
          <span className="text-white/92">{fmt(mev)} ETH</span>
        </span>
        <span className="text-slate-400">
           Auto-Burned:{" "}
          <span className="text-white/92">{fmt(burned)} </span>
        </span>
        <span className="text-slate-500">Network: Powered by Codeming</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070A0F] font-mono">
        <Navbar />
        <Sidebar />

        <main className="pt-20 pb-16 px-4 md:px-8 lg:pl-60">
          {/* Ambient Background */}
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,140,0.03)_0%,transparent_70%)]" />

          {/* Corner Brackets — constrained to the content area, clear of fixed Navbar/Sidebar */}
          <div className="fixed top-24 right-4 bottom-4 left-4 lg:left-60 pointer-events-none z-0">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-emerald-500/30" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-emerald-500/30" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-emerald-500/30" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-emerald-500/30" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/avatar.jpg"
                  alt="IMD Optimizer"
                  className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover"
                />
                <div className="text-sm md:text-base font-mono text-white/92 tracking-widest uppercase">
                  IMD OPTIMIZER PROTOCOL
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE SEPOLIA
                </span>
              </div>
            </div>

            {/* Decorative divider + micro-label (ASCII bezel retired) */}
            <div
              className="flex items-center gap-4 mt-10 mb-6"
              aria-hidden="true"
            >
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/45" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/45 whitespace-nowrap">
                MEV Interception · LVR Mitigation
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/45" />
            </div>

            {/* Hero Section */}
            <div className="grid lg:grid-cols-2 gap-8 items-center mt-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sepolia Testnet · Unaudited
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] bg-gradient-to-r from-white via-slate-300 to-emerald-400 bg-clip-text text-transparent">
                  The Agentic V4 Meta-Hook
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                  We don&apos;t simulate protection. We execute it. Uniswap V4 hooks intercept MEV at the source — before settlement occurs.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs font-mono text-slate-400 uppercase">Uniswap V4 Singleton Hook</span>
                  <span className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs font-mono text-slate-400 uppercase">Sepolia Live</span>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 uppercase">LVR Protection</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-8">
                  <a href="#swap" className="w-full sm:w-auto bg-emerald-500 text-black font-bold px-10 py-5 rounded-xl hover:bg-emerald-400 transition-colors duration-150 text-center shadow-[0_0_20px_rgba(0,245,140,0.3)] text-base">
                    PROTECTED SWAP
                  </a>
                  <a href="#pool" className="w-full sm:w-auto bg-slate-800/50 text-white/92 font-bold px-10 py-5 rounded-xl hover:bg-slate-700/50 transition-colors duration-150 text-center border border-slate-700/50 text-base">
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
            <div className="mt-10">
              <LiveMetricsBar />
            </div>

            {/* Core Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
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

            {/* Living Identity Section */}
            <div className="grid lg:grid-cols-2 gap-8 items-center mt-16">
              <div>
                <p className="max-w-xl">
                  <span className="block text-2xl md:text-3xl font-bold tracking-tight text-[#E8E8E8] mb-4">
                    The Living Identity (Dynamic ID NFT)
                  </span>
                  <span className="text-slate-400 leading-relaxed">
                    Your NFT is forged as a Recruit (Bronze Card), but it evolves in real-time. The smart contract actively reads your interactions with the protocol. As your address executes successful arbitrages or commits to prolonged staking (Diamond Hands), your NFT automatically levels up. Your Card evolves from Bronze to Silver, Gold, and ultimately Neon—dynamically updating your on-chain metadata and your visual prestige on the secondary market
                  </span>
                </p>
              </div>

              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-[#0B111A]/80 shadow-[0_0_50px_rgba(0,245,140,0.15)]">
                  <img
                    src="/images/colecao.png"
                    alt="Living Identity — Collection"
                    className="w-full aspect-[3/2] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Tier Mountain */}
            <div className="space-y-8 mt-24">
              <div className="text-center">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  The Tier Mountain — Value Capture Funnel
                </h3>
                <p className="text-slate-400">Where captured MEV flows back to users through a four-tier hierarchy</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { tier: "1", name: "ALPHA · Buildercoin NFT", fee: "0.00% Swap · 5% Success", boost: "4x Yield", color: "#00F58C", glow: "rgba(0,245,140,0.4)", desc: "Buildercoin NFT (501 supply, mint 0.05 ETH). Zero swap fee, minimal Success Fee on arbitrage profit and maximum yield multiplier.", bgImage: "/images/nft builder.jpeg" },
                  { tier: "2", name: "PARTNER · Identity md NFT", fee: "0.10% Swap · 10% Success", boost: "3x Yield", color: "rgba(0,245,140,0.72)", glow: "rgba(0,245,140,0.28)", desc: "Identity md NFT. Near-zero swap fee, reduced Success Fee and 3x weighted yield in Builder Staking.", bgImage: "/images/imd%20(2).jpg" },
                  { tier: "3", name: "HOLDER · IMD / BLD", fee: "0.30% Swap · 20% Success", boost: "1x Yield", color: "rgba(0,245,140,0.44)", glow: "rgba(0,245,140,0.18)", desc: "Balance > 0 of IMD or BLD — automatic qualification via balanceOf. Weighted 1x yield.", bgImage: "/images/pepe%20clarao.png" },
                  { tier: "4", name: "RETAIL", fee: "0.50% Swap · 25% Success", boost: "0x Yield", color: "rgba(0,245,140,0.25)", glow: "rgba(0,245,140,0.1)", desc: "Default tier for any wallet: full V4 protection with no prerequisites. No yield multiplier.", bgImage: "/images/tier.jpeg" },
                ].map((t, i) => (
                  <TierCard key={i} {...t} />
                ))}
              </div>
            </div>

            {/* Protocol Metrics */}
            <div className="space-y-6 mt-24">
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
                <StatCard title="Swap Fee per Tier" value="0 – 0.5%" change="Tiers 1 → 4" icon={
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 22V12M22 8.5L12 15.5M2 8.5L12 15.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
} description="0.00% / 0.10% / 0.30% / 0.50% via identityTier()" accent="#00F5FF" badge="identityTier() on-chain" />
                <StatCard title="Success Fee (arb)" value="5 – 25%" change="profit only" icon={
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
} description="Charged only on net profit of executeCustomArbitrage" accent="#FFB000" badge="receiveYield() only" />
                <StatCard title="Penalty Split (Diamond)" value="50/25/25" change="Burn/Treasury/Yield" icon={
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7v4M12 15h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
} description="Instant unstake (2–5%): 50% Burn, 25% Treasury, 25% yield" accent="#FF567E" badge="DEC-020 · BuilderStakingVault" />
              </div>
            </div>

            {/* Footer CTA */}
            <div className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#0B111A]/90 to-[#070A0E]/90 p-8 md:p-12 shadow-[0_0_60px_rgba(0,245,140,0.1)] overflow-hidden text-center mt-24">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,140,0.05)_0%,transparent_70%)]" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Join the Sovereign Guardian?</h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Stake IMD, mint a Genesis Key, or simply swap on an IMD-protected pool.
                  Every interaction strengthens the protocol that protects you.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <a href="/swap" className="w-full sm:w-auto bg-emerald-500 text-black font-bold px-8 py-4 rounded-xl hover:bg-emerald-400 transition-colors duration-150 text-center shadow-[0_0_30px_rgba(0,245,140,0.3)] text-base">
                    MINT
                  </a>
                  <a href="/pool" className="w-full sm:w-auto bg-slate-800/50 text-white/92 font-bold px-8 py-4 rounded-xl hover:bg-slate-700/50 transition-colors duration-150 text-center border border-slate-700/50 text-base">
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
  );
}

// ===== REUSABLE COMPONENTS =====

function FeatureCard({ title, desc, accent, bgImage }: { title: string; desc: string; accent: string; bgImage: string }) {
  return (
    <div className="relative bg-[#0B111A]/80 border border-slate-700/50 rounded-2xl p-5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-150 overflow-hidden">
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F]/90 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">
        <h4 className="font-mono text-sm font-bold text-white/92 uppercase tracking-wider text-center mb-3">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed text-center">{desc}</p>
      </div>
    </div>
  );
}

function TierCard({ tier, name, fee, boost, color, glow, desc, bgImage }: { 
  tier: string; name: string; fee: string; boost: string; color: string; glow: string; desc: string; bgImage: string; 
}) {
  return (
    <div className="relative flex flex-col h-full bg-[#0B111A]/80 border border-slate-700/50 hover:border-emerald-500/30 rounded-2xl p-5 transition-[transform,border-color,box-shadow] duration-150 lift overflow-hidden">
      <img
        src={bgImage}
        alt={`${name} Tier ${tier}`}
        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F]/90 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{
              background: color,
              color: Number(tier) <= 2 ? "#04150E" : "rgba(255 255 255 / .92)",
            }}
          >
            {tier}
          </div>
          <div>
            <div className="font-semibold text-white/92">{name}</div>
            <div className="text-xs font-mono text-slate-400 uppercase">Tier {tier}</div>
          </div>
        </div>
        <div className="space-y-1 mb-3">
          <div className="font-mono text-lg font-bold text-white/92">{fee}</div>
          <div className="text-sm font-medium text-[#00F58C]">{boost}</div>
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
    <div className="relative rounded-2xl border border-slate-700/50 bg-[#0B111A]/80 p-5 hover:border-emerald-500/30 transition-[transform,border-color,box-shadow,background-color] duration-150 lift overflow-hidden">
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
      <h4 className="relative text-2xl md:text-3xl font-bold text-white/92 mb-1">{value}</h4>
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