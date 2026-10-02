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
          $IMD Auto-Burned:{" "}
          <span className="text-white">{fmt(burned)} $IMD</span>
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

                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="#swap" className="w-full sm:w-auto bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all text-center shadow-[0_0_20px_rgba(0,245,140,0.3)]">
                    PROTECTED SWAP
                  </a>
                  <a href="#pool" className="w-full sm:w-auto bg-slate-800/50 text-white font-bold py-3 rounded-xl hover:bg-slate-700/50 transition-all text-center border border-slate-700/50">
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
                icon="🔍"
              />
              <FeatureCard
                title="TOXICITY SCORING"
                desc="Each incoming swap is scored for MEV probability. High-toxicity swaps trigger dynamic fee escalation and protective routing."
                accent="#FFB000"
                icon="📊"
              />
              <FeatureCard
                title="INSTANT INTERCEPTION"
                desc="Uniswap V4 beforeSwap hooks intercept and neutralize MEV at the source — before settlement occurs."
                accent="#00F58C"
                icon="⚡"
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
                  <MetricCard value="4x – 0x" label="Yield Multiplier" accent="#FFB000" />
                  <MetricCard value="2 – 5%" label="Unstake Penalty" accent="#FF567E" />
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-[#0B111A]/80 shadow-[0_0_50px_rgba(0,245,140,0.15)]">
                  <img
                    src="/images/Character_standing_on_landing_pad_20260926015733.jpg"
                    alt="LVR Mitigation engine"
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

              <div className="relative w-full max-w-4xl mx-auto rounded-3xl border border-emerald-500/20 shadow-[0_0_50px_rgba(0,245,140,0.15)] overflow-hidden bg-[#0B111A]/80">
                <img
                  src="/images/tier.jpeg"
                  alt="$IMD Value Capture Funnel"
                  className="w-full h-auto object-contain mx-auto block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/40 via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { tier: "1", name: "ALPHA · Buildercoin NFT", fee: "0.00% Swap · 5% Success", boost: "4x Yield", color: "#FFD700", glow: "rgba(255,215,0,0.4)", desc: "Buildercoin NFT (501 supply, mint 0.05 ETH). Swap isento, Success Fee mínima sobre o lucro de arbitragem e multiplicador de yield máximo." },
                  { tier: "2", name: "PARTNER · Identity md NFT", fee: "0.10% Swap · 10% Success", boost: "3x Yield", color: "#00F5FF", glow: "rgba(0,245,255,0.4)", desc: "Identity md NFT. Taxa de swap quase nula, Success Fee reduzida e 3x de yield ponderado no Builder Staking." },
                  { tier: "3", name: "HOLDER · $IMD / $BLD", fee: "0.30% Swap · 20% Success", boost: "1x Yield", color: "#BB86FC", glow: "rgba(187,134,252,0.4)", desc: "Saldo > 0 de $IMD ou $BLD — qualificação automática por balanceOf. Yield ponderado 1x." },
                  { tier: "4", name: "RETAIL", fee: "0.50% Swap · 25% Success", boost: "0x Yield", color: "#FF567E", glow: "rgba(255,86,126,0.4)", desc: "Tier padrão para qualquer carteira: proteção V4 completa sem pré-requisitos. Sem multiplicador de yield." },
                ].map((t, i) => (
                  <TierCard key={i} {...t} />
                ))}
              </div>
            </div>

            {/* On-Chain Mechanics */}
            <div className="space-y-10">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  On-Chain Mechanics & Architecture
                </h3>
                <p className="text-slate-400">Uniswap V4 hooks, agentic execution layer, and elastic tokenomics</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h4 className="text-xl font-bold mb-4">Uniswap V4 Hook Lifecycles</h4>
                  <p className="text-slate-400 mb-6">
                    Singleton architecture with customizable hooks at four key lifecycle points for MEV capture and LVR mitigation.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <HookCard
                      hook="beforeSwap"
                      title="Pre-Execution Hook"
                      accent="#00F5FF"
                      steps={[
                        "Validate swap parameters against oracle TWAP",
                        "Calculate dynamic fee based on toxicity score",
                        "Route surplus to MEV capture module",
                        "Return modified params or revert toxic swaps"
                      ]}
                    />
                    <HookCard
                      hook="afterSwap"
                      title="Post-Execution Hook"
                      accent="#FFB000"
                      steps={[
                        "Compute actual vs expected output amounts",
                        "Measure realized LVR / slippage delta",
                        "Trigger buyback if threshold exceeded",
                        "Update tier accrual counters"
                      ]}
                    />
                  </div>
                  <p className="mt-4 text-xs text-slate-500 font-mono">
                    Additional: beforeAddLiquidity · afterAddLiquidity · beforeRemoveLiquidity · afterRemoveLiquidity
                  </p>
                </div>
                <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-[#0B111A]/80 shadow-[0_0_50px_rgba(0,245,140,0.15)]">
                  <img src="/images/acao.png" alt="V4 Hook Execution" className="w-full h-[380px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="relative lg:order-2">
                  <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-[#0B111A]/80 shadow-[0_0_50px_rgba(0,245,140,0.15)]">
                    <img src="/images/acao3.jpg" alt="Agentic Oracle" className="w-full h-[400px] object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xl font-bold">Agentic Oracle Network</h4>
                  <p className="text-slate-400">
                    Decentralized node network providing real-time MEV detection, TWAP price feeds, and toxicity scoring.
                    $BLD stakers operate nodes and earn 60% of protocol fees.
                  </p>
                  <div className="space-y-3">
                    <OracleItem title="100+ Node Target" desc="Geographically distributed validators ensuring censorship-resistant price feeds" />
                    <OracleItem title="Sub-Second Latency" desc="TWAP feeds updated every block with cryptographic verification" />
                    <OracleItem title="Slashing for Invalid Data" desc="Economic security via stake slashing on proven data manipulation" />
                    <OracleItem title="60% Fees → Stakers" desc="OptimizerVaultV2 split: 60% Stakers · 20% Treasury · 15% Devs · 5% Buy-and-Burn" />
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h4 className="text-xl font-bold mb-4">Elastic Supply Contraction</h4>
                  <p className="text-slate-400 mb-6">
                    Algorithmic, self-stabilizing monetary policy. When MEV extraction spikes, the system automatically contracts supply.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <BurnItem value="Live" label="$IMD Auto-Burned (on-chain)" accent="#00F58C" />
                    <BurnItem value="50%" label="Penalty → Buy-and-Burn" accent="#FFB000" />
                    <BurnItem value="100%" label="Burned → 0xdEaD" accent="#00F5FF" />
                  </div>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-start gap-2"><span className="text-amber-400">▸</span> TWAP Buybacks: Captured ETH executes time-weighted purchases on $IMD/ETH pools</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400">▸</span> Immediate Burn: Purchased tokens sent to dead address within same block</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400">▸</span> Epoch Accounting: Burns recorded per epoch (90 days), rate published on-chain</li>
                    <li className="flex items-start gap-2"><span className="text-amber-400">▸</span> Supply Floor: Contraction continues until equilibrium — no inflationary minting ever</li>
                  </ul>
                </div>
                <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-[#0B111A]/80 shadow-[0_0_50px_rgba(0,245,140,0.15)]">
                  <img src="/images/heli.png" alt="Elastic supply contraction" className="w-full h-[400px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Protocol Metrics */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Protocol Metrics</h3>
                <p className="text-slate-400">Verifiable contract parameters — no marketing numbers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Genesis Mint (Buildercoin)" value="501" change="0.05 ETH / key" icon="🔑" description="40% Core · 40% Infra · 20% Growth" accent="#00F58C" badge="Tier 1 · Alpha" />
                <StatCard title="Swap Fee por Tier" value="0 – 0.5%" change="Tiers 1 → 4" icon="💠" description="0.00% / 0.10% / 0.30% / 0.50% via identityTier()" accent="#00F5FF" badge="identityTier() on-chain" />
                <StatCard title="Success Fee (arb)" value="5 – 25%" change="só sobre o lucro" icon="⚡" description="Cobrada apenas sobre lucro líquido de executeCustomArbitrage" accent="#FFB000" badge="receiveYield() only" />
                <StatCard title="Penalty Split (Diamond)" value="50/25/25" change="Burn/Treasury/Yield" icon="🔥" description="Unstake instantâneo (2–5%): 50% Burn, 25% Tesouro, 25% yield" accent="#FF567E" badge="DEC-020 · BuilderStakingVault" />
              </div>
            </div>

            {/* System Architecture */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">System Architecture</h3>
                <p className="text-slate-400">Technical deep-dive: singleton hooks, agentic execution, cross-chain oracle</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <ArchCard title="V4 Hook Contract" description="Singleton-deployed hook implementing beforeSwap/afterSwap for MEV capture. Gas-optimized with minimal storage reads." features={["Solidity 0.8.24", "Gas optimized (~45k per swap)", "Formal verification pending", "Sepolia: 0x...HookAddr"]} />
                <ArchCard title="Agentic Oracle Network" description="Decentralized node network providing real-time MEV detection, TWAP feeds, and toxicity scoring. $BLD stakers operate nodes." features={["100+ nodes target", "Sub-second latency", "Slashing for invalid data", "Yield: 60% p/ stakers"]} />
                <ArchCard title="Elastic Tokenomics" description="Algorithmic supply contraction via MEV-funded buybacks. No admin keys, no minting. Hard-capped deflationary asset." features={["Hard cap: 1B $IMD", "Burn address: 0x...dead", "Epoch: 90 days", "Audit: TBD"]} />
              </div>

              <div className="rounded-3xl bg-[#0B111A]/80 border border-slate-700/50 p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                <h4 className="text-xl font-bold mb-8 text-center">Data Flow Architecture</h4>
                <ArchitectureFlow />
              </div>
            </div>

            {/* Footer CTA */}
            <div className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#0B111A]/90 to-[#070A0E]/90 p-8 md:p-12 shadow-[0_0_60px_rgba(0,245,140,0.1)] overflow-hidden text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,140,0.05)_0%,transparent_70%)]" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Join the Sovereign Guardian?</h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Stake $BLD, mint a Genesis Key, or simply swap on an IMD-protected pool.
                  Every interaction strengthens the protocol that protects you.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a href="/swap" className="w-full sm:w-auto bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all text-center shadow-[0_0_30px_rgba(0,245,140,0.3)]">
                    PROTECTED SWAP
                  </a>
                  <a href="/pool" className="w-full sm:w-auto bg-slate-800/50 text-white font-bold py-3 rounded-xl hover:bg-slate-700/50 transition-all text-center border border-slate-700/50">
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

function FeatureCard({ title, desc, accent, icon }: { title: string; desc: string; accent: string; icon: string }) {
  return (
    <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5 hover:border-emerald-500/40 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-[${accent}] to-[${accent}/40] text-black`}>
          {icon}
        </div>
        <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
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

function TierCard({ tier, name, fee, boost, color, glow, desc }: { 
  tier: string; name: string; fee: string; boost: string; color: string; glow: string; desc: string; 
}) {
  return (
    <div className="relative flex flex-col h-full bg-[#0B111A]/80 border border-slate-700/50 hover:border-emerald-500/30 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold text-sm bg-gradient-to-br from-[${color}] to-[${color}/60]`}>
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
  );
}

function HookCard({ hook, title, accent, steps }: { hook: string; title: string; accent: string; steps: string[] }) {
  return (
    <div className="bg-[#070A0F]/80 rounded-xl p-4 border border-slate-700/50 h-full">
      <div className="flex flex-col gap-2 mb-3">
        <span className={`self-start px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${accent}/30 text-[${accent}] bg-[${accent}/10]`}>
          {hook}
        </span>
        <h4 className="font-bold text-white">{title}</h4>
      </div>
      <ul className="space-y-2 text-xs text-slate-400">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2">
            <span style={{ color: accent }}>▸</span> {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OracleItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#070A0F]/80 border border-slate-700/50">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-slate-800/50 flex-shrink-0">🌐</div>
      <div>
        <div className="font-semibold text-white text-sm">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
    </div>
  );
}

function BurnItem({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="bg-[#070A0F]/80 rounded-xl p-4 border border-slate-700/50 text-center">
      <div className="text-2xl font-bold mb-1" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function StatCard({ title, value, change, icon, description, accent, badge }: { 
  title: string; value: string; change: string; icon: string; description: string; accent: string; badge?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-[#0B111A]/80 p-5 hover:border-emerald-500/30 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-2xl">{icon}</div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${accent}/20 text-[${accent}] bg-[${accent}/10]`}>
          {change}
        </span>
      </div>
      <h4 className="text-2xl md:text-3xl font-bold text-white mb-1">{value}</h4>
      <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
      {badge && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] font-mono text-slate-400">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}

function ArchCard({ title, description, features }: { 
  title: string; description: string; features: string[]; 
}) {
  return (
    <div className="rounded-2xl bg-[#0B111A]/80 border border-slate-700/50 p-5 hover:border-emerald-500/30 transition-all h-full">
      <h4 className="font-bold text-lg mb-2">{title}</h4>
      <p className="text-slate-400 text-sm mb-4 leading-relaxed">{description}</p>
      <ul className="space-y-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-emerald-400">▸</span> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArchitectureFlow() {
  const steps = [
    { label: "USER / WALLET", desc: "Swap Intent" },
    { label: "UNISWAP V4 SINGLETON", desc: "PoolManager" },
    { label: "beforeSwap HOOK", desc: "Toxicity Scan • Dynamic Fees • Tier Check" },
    { label: "SWAP EXECUTION", desc: "Price Impact • Settlement" },
    { label: "afterSwap HOOK", desc: "LVR Measurement • Buyback Trigger • Tier Accrual" },
    { label: "AGENTIC EXECUTION", desc: "MEV Scanner • Oracle Nodes • Buyback & Burn Engine" },
    { label: "TIER REDISTRIBUTION", desc: "$BLD Alpha → $IMD Alpha → $IMD Holder → Retail" },
  ];

  return (
    <div className="relative">
      <div className="absolute left-8 md:left-[160px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500 via-cyan-500 to-amber-500 hidden md:block" />
      <div className="space-y-6 md:space-y-8">
        {steps.map((step, i) => (
          <div key={i} className="relative flex items-start gap-4 md:pl-[180px]">
            <div className="relative flex-shrink-0 w-16 md:w-[140px] md:pr-4 md:text-right">
              <div className="relative z-10 w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-slate-700/50 bg-[#070A0F] flex items-center justify-center mx-auto md:mx-0 md:ml-auto">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
              </div>
              <p className="mt-1 md:mt-0 font-mono text-[10px] md:text-xs font-semibold text-white text-center md:text-right">{step.label}</p>
            </div>
            <div className="flex-1 pt-0.5 md:pt-0">
              <p className="text-xs text-slate-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}